const driverRouteModel = require('../models/driverRouteModel');
const mongoose = require('mongoose');
const polylineEncoded = require('polyline-encoded');
const scheduleRideModel = require('../models/scheduleRideModel');
const scheduleRideServices = require('./scheduleRideServices');
const { isNear } = require('./locationServices');
const routeStatus = require('../utils/routeStatus');
const priceCalculator = require('../utils/priceCalculator');
const historyModel = require('../models/historyModel');
const userModel = require('../models/userModel');
const scheduleReminder = require('../utils/scheduleReminder');

// const routeStatus = {
//   ACTIVE: "active",
//   STARTED: "started",
//   COMPLETED: "completed",
// };
const driverRouteServices = {
  defineRoute: async (
    userId,
    startPoint,
    endPoint,
    date,
    isScheduled,
    availableSeats,
    vehicleId,
    gender,
    polyline,
    bounds_sw,
    bounds_ne,
    kmLeverage,
    distance,
    duration,
    corporateCode
  ) => {
    corporateCode = corporateCode == '' ? null : corporateCode;
    // console.log({
    //   bounds_sw: {
    //     latitude: bounds_sw[0],
    //     longitude: bounds_sw[1],
    //   },
    //   bounds_ne: {
    //     latitude: bounds_ne[0],
    //     longitude: bounds_ne[1],
    //   },
    // });
    const route = new driverRouteModel({
      userId: mongoose.Types.ObjectId(userId),
      startPoint,
      endPoint,
      lastLocation: [
        {
          latitude: startPoint.latitude,
          longitude: startPoint.longitude,
        },
      ],
      date,
      isScheduled,
      availableSeats,
      vehicleId: mongoose.Types.ObjectId(vehicleId),
      gender,
      initialSeats: availableSeats,
      bounds_sw: {
        latitude: bounds_sw[0],
        longitude: bounds_sw[1],
      },
      bounds_ne: {
        latitude: bounds_ne[0],
        longitude: bounds_ne[1],
      },
      polyline: polylineEncoded.decode(polyline),
      encodedPolyline: polyline,
      kmLeverage,
      distance,
      duration,
      corporateCode,
    });
    const result = await route.save();
    return result;
  },

  updateRoute: async (
    _id,
    startPoint,
    endPoint,
    date,
    time,
    availableSeats
  ) => {
    const updateRoute = await driverRouteModel.findOneAndUpdate(
      { _id },
      {
        startPoint,
        endPoint,
        date,
        time,
        availableSeats,
      }
    );
    return updateRoute;
  },

  updateAvailableSeats: async (_id, seats, increment) => {
    if (increment) {
      const updatedRoute = await driverRouteModel.findOneAndUpdate(
        {
          _id,
        },
        { $inc: { availableSeats: seats } },
        { new: true }
      );
      return updatedRoute;
    } else {
      const updatedRoute = await driverRouteModel.findOneAndUpdate(
        {
          _id,
          availableSeats: { $gte: seats },
        },
        { $inc: { availableSeats: seats * -1 } },
        { new: true }
      );
      return updatedRoute;
    }
  },

  validateUserRoute: async (userId) => {
    const check = await driverRouteModel.findOne({ userId });
    return check;
  },

  deleteRoute: async (_id) => {
    const route = await driverRouteServices.routeById(_id);
    if (route.accepted.length > 0 && route.status === 'active') {
      const deletedRoute = await driverRouteModel.findOneAndUpdate(
        { _id },
        {
          deleted: true,
        }
      );
      const acceptedUser = [];
      for (var i = 0; i < route.accepted.length; i++) {
        const result = await scheduleRideServices.cancelRequest(
          route.accepted[i].toString(),
          _id
        );
        accepted.push(result);
      }
      deletedRoute.acceptedUser = acceptedUser;
      //here we are we need routeId as well
      return deletedRoute;
    } else if (route.status === 'started') {
      return false;
    } else {
      const deletedRoute = await driverRouteModel.findOneAndUpdate(
        { _id },
        {
          deleted: true,
        }
      );
      return deletedRoute;
    }
  },

  driverRoutes: async (userId) => {
    var top = null;

    //query will return all deiver schedules with date sorted
    var list = await driverRouteModel
      .find(
        {
          userId,
          rescheduled: false,
          // status: { $nin: ["rescheduled"] },
          deleted: false,
        },
        { polyline: 0, matchedPassengers: 0 }
      )
      .populate({
        path: 'userId',
        model: 'User',
        select: [
          'firstName',
          'lastName',
          'totalRating',
          'totalRatingCount',
          'profileImage',
        ],
      })
      .sort('-date');

    //filter will return all schedule excluded route which is started
    list = list.filter((route) => {
      if (route.status === 'started') {
        //adding started route in top var and exclude from list
        top = route;
        return false;
      }
      return true;
    });

    let activeList = [];
    let remainingList = [];

    for (var i = 0; i < list.length; i++) {
      if (list[i].status == routeStatus.ACTIVE) {
        activeList.push(list[i]);
      } else {
        remainingList.push(list[i]);
      }
    }

    //if any started route then place it at top of the list
    let sortedList = [...activeList, ...remainingList];
    top && sortedList.unshift(top);
    sortedList.forEach((item, index) => {
      sortedList[index].totalRequests =
        item.request.length -
        item.accepted.length -
        item.rejected.length -
        item.cancelled.length;
    });
    //returning sortedList
    return sortedList;
  },

  routeByIdForPanel: async (_id) => {
    const route = await driverRouteModel
      .findOne({ _id })
      .populate({
        path: 'vehicleId',
        populate: { path: 'model', populate: 'make' },
      })
      .populate({
        path: 'vehicleId',
        populate: { path: 'registrationCity' },
      })
      .populate({
        path: 'vehicleId',
        populate: { path: 'registrationProvince' },
      })
      .populate({
        path: 'vehicleId',
        populate: { path: 'color' },
      })
      .populate({
        path: 'userId',
        select: [
          'firstName',
          'lastName',
          'mobile',
          'gender',
          'profileImage',
          'totalRating',
          'totalRatingCount',
          'fcmToken',
          'corporateCode',
        ],
      })
      .populate({ path: 'request', populate: 'userId' })
      .populate({ path: 'myRequests', populate: 'userId' });
    return route;
  },

  routeById: async (_id) => {
    const route = await driverRouteModel
      .findOne({ _id })
      .populate('vehicleId')
      .populate({
        path: 'userId',
        select: [
          'firstName',
          'lastName',
          'mobile',
          'gender',
          'profileImage',
          'totalRating',
          'totalRatingCount',
          'fcmToken',
          'corporateCode',
        ],
      });
    return route;
  },

  routeByIdWithRequests: async (_id) => {
    // console.log({ _id });
    const route = await driverRouteModel
      .findOne({ _id }, { polyline: 0 })
      .populate({
        path: 'request',
        model: 'ScheduleRide',
        select: '-polyline -request -rejected -accepted -cancelled',
        populate: {
          path: 'userId',
          select:
            'firstName lastName totalRating totalRatingCount profileImage gender',
        },
      });
    // .populate({
    //   path: "userId",
    //   select: [
    //     "firstName",
    //     "lastName",
    //     "mobile",
    //     "gender",
    //     "profileImage",
    //     "totalRating",
    //     "totalRatingCount",
    //     "fcmToken",
    //   ],
    // })
    // .populate("request");
    // console.log(route);
    return route;
  },
  getRoutesWithFilter: async (bookedSeats, gender, isScheduled) => {
    const result = await driverRouteModel.find({
      gender,
      isScheduled,
      availableSeats: { $lte: bookedSeats },
    });
    return result;
  },

  matchedPassengers: async (routeId, flag) => {
    const route = await driverRouteServices.routeById(routeId);
    const scheduleList = await scheduleRideServices.pendingSchedules(
      route.date,
      route.availableSeats,
      route.gender,
      route.userId._id.toString(),
      flag,
      routeId
    );

    const schedules = scheduleList.filter((item) => {
      const requestValidation = item.request.find((item) => {
        return item.toString() == route._id.toString();
      });
      if (item.accepted) {
        const requestValidation2 =
          item.accepted.toString() == route._id.toString();
        if (requestValidation2) {
          return true;
        }
      }
      if (requestValidation !== undefined) {
        return false;
      }
      if (item.gender === 'any') {
        //&& item.userId.gender === route.gender
        return (
          item.userId.gender === route.userId.gender ||
          item.gender == route.gender
        );
        // return true;
      } else if (item.gender !== 'any') {
        if (route.gender == 'female') {
          return route.gender == item.gender;
        }
        if (item.gender == 'female' && route.gender == 'male') return false;
        return (
          item.gender === route.userId.gender || route.gender === item.gender
        );
      } else if (item.gender === route.gender) return true;
      else {
        return false;
      }
    });

    let matchedScheduleWithRoute = schedules.filter((schedule) => {
      const start = isNear(
        schedule.startPoint,
        route.polyline,
        route.kmLeverage
      );
      const end = isNear(schedule.endPoint, route.polyline, route.kmLeverage);
      // if (schedule.corporateCode != null) {
      const corporateCodeValidation =
        schedule.corporateCode == route.corporateCode;
      return start && end && corporateCodeValidation;
      // }
      // return start && end;
    });

    matchedScheduleWithRoute = await Promise.all(
      matchedScheduleWithRoute.map(async (item) => {
        const fare = await priceCalculator(
          route.vehicleId.minMileage,
          item.distance,
          item.corporateCode
        );
        return { ...item, fare };
      })
    );

    // console.log(matchedScheduleWithRoute);

    return matchedScheduleWithRoute;
    // {
    //   const { availableSeats, gender, polyline } = route;
    //   const passengerSchedules =
    //     await scheduleRideServices.getSchedulesWithFilter(
    //       availableSeats,
    //       gender,
    //       isScheduled
    //     );
    //   const nearestpassengers = passengerSchedules.filter((passenger) => {
    //     const start = isNear(passenger.startPoint, polyline);
    //     const end = isNear(passenger.endPoint, polyline);
    //     return start && end;
    //   });
    //   const matchedPassengers = [];
    //   nearestpassengers.forEach(async (passenger, index) => {
    //     matchedPassengers.push({
    //       scheduleId: mongoose.Types.ObjectId(routeId),
    //       status: "posted",
    //     });
    //     nearestpassengers[index] = await scheduleRideModel.findOneAndUpdate(
    //       { _id: passenger._id },
    //       {
    //         $push: {
    //           matchedDriver: { routeId: mongoose.Types.ObjectId(routeId) },
    //         },
    //       },
    //       { new: true }
    //     );
    //   });
    //   route.matchedPassengers = matchedPassengers;
    //   await route.save();
    //   return nearestpassengers;
    // }
  },

  newRequest: async (_id, scheduleId) => {
    const schedule = await scheduleRideServices.getById(scheduleId);
    const result = await driverRouteModel.findOneAndUpdate(
      {
        _id,
        availableSeats: { $gte: schedule.bookedSeats },
        request: { $nin: [scheduleId] },
        myRequests: { $nin: [scheduleId] },
        status: { $ne: 'completed' },
        deleted: false,
      },
      { $push: { request: mongoose.Types.ObjectId(scheduleId) } },
      {
        new: true,
        populate: {
          path: 'userId',
          select: ['firstName', 'lastName', 'fcmToken', 'profileImage'],
        },
      }
    );
    return result;
  },

  rejectRequest: async (_id, scheduleId) => {
    // console.log({ _id, scheduleId });
    const result = await driverRouteModel.findOneAndUpdate(
      {
        _id,
        rejected: { $nin: [scheduleId] },
      },
      {
        $push: { rejected: mongoose.Types.ObjectId(scheduleId) },
      },
      {
        new: true,
        populate: {
          path: 'userId',
          select: ['firstName', 'lastName', 'fcmToken', 'profileImage'],
        },
      }
    );
    return result;
  },

  acceptRequest: async (_id, scheduleId) => {
    const schedule = await scheduleRideServices.getById(scheduleId);
    const { bookedSeats } = schedule;
    const result = await driverRouteModel.findOneAndUpdate(
      {
        _id,
        availableSeats: { $gte: bookedSeats },
        accepted: { $nin: [scheduleId] },
      },
      {
        $inc: { availableSeats: -1 * bookedSeats },
        $push: { accepted: mongoose.Types.ObjectId(scheduleId) },
      },
      {
        new: true,
        populate: {
          path: 'userId',
          select: ['firstName', 'lastName', 'fcmToken', 'profileImage'],
        },
      }
    );
    return result;
  },

  cancelRequest: async (_id, scheduleId) => {
    // console.log({ _id, scheduleId });
    const schedule = await scheduleRideServices.getById(scheduleId);
    const { bookedSeats } = schedule;
    const result = await driverRouteModel.findOneAndUpdate(
      {
        _id,
        accepted: { $in: [scheduleId] },
      },
      {
        $inc: { availableSeats: bookedSeats },
        $pull: { accepted: scheduleId },
        $push: { cancelled: mongoose.Types.ObjectId(scheduleId) },
      },
      {
        new: true,
        populate: {
          path: 'userId',
          select: ['firstName', 'lastName', 'fcmToken', 'profileImage'],
        },
      }
    );
    // console.log({ result });
    return result;
  },

  completeRequest: async (_id, scheduleId) => {
    const schedule = await scheduleRideServices.getById(scheduleId);
    const { bookedSeats } = schedule;
    const result = await driverRouteModel.findOneAndUpdate(
      {
        _id,
        accepted: { $in: [scheduleId] },
      },
      {
        $inc: { availableSeats: bookedSeats },
        $pull: { accepted: scheduleId },
        $push: { completed: mongoose.Types.ObjectId(scheduleId) },
      },
      {
        new: true,
        populate: {
          path: 'userId',
          select: ['firstName', 'lastName', 'fcmToken', 'profileImage'],
        },
      }
    );
    return result;
  },
  complete: async (_id) => {
    const result = await driverRouteModel.findOneAndUpdate(
      { _id },
      { status: 'completed' },
      { new: true, populate: { path: 'accepted', select: 'userId' } }
    );
    return result;
  },
  getRequests: async (_id) => {
    let data = await driverRouteModel
      .findOne({ _id }, { polyline: 0 })
      .populate({
        path: 'request',
        model: 'ScheduleRide',
        select: '-polyline -request -rejected -accepted -cancelled',
        populate: {
          path: 'userId',
          select:
            'firstName lastName totalRating totalRatingCount profileImage gender',
        },
      })
      .populate('vehicleId')
      .lean();

    data.request = await Promise.all(
      data.request.map(async (item) => {
        const fare = await priceCalculator(
          data.vehicleId.minMileage,
          item.distance,
          item.corporateCode
        );
        return { ...item, fare };
      })
    );
    data.vehicleId = data.vehicleId._id;
    // console.log(data);
    return data;
  },
  getAcceptedRequests: async (_id) => {
    const data = await driverRouteModel
      .findOne({ _id }, { polyline: 0 })
      .populate({
        path: 'accepted',
        model: 'ScheduleRide',
        select: '-polyline -request -rejected -accepted -cancelled',
        populate: {
          path: 'userId',
          select:
            'firstName lastName totalRating totalRatingCount profileImage',
        },
      });
    //console.log(data.request);
    return data;
  },

  updateStatus: async (_id) => {
    const result = await driverRouteModel.findOneAndUpdate(
      { _id },
      { status: routeStatus.STARTED },
      { new: true, populate: 'vehicleId' }
    );

    return result;
  },

  updateLastLocation: async (_id, lastLocation) => {
    const result = await driverRouteModel.findOneAndUpdate(
      { _id },
      { $push: { lastLocation } },
      { new: true }
    );
    return result;
  },

  upcomingCount: async (userId) => {
    const count = await driverRouteModel.count({
      userId,
      status: 'active',
    });
    return count;
  },

  upcomingRides: async (userId) => {
    const list = await driverRouteModel.find({
      userId,
      status: 'active',
    });
    return list;
  },

  upcoming: async (userId) => {
    const result = await driverRouteModel
      .find(
        { userId, status: 'active' },
        { startPoint: 1, endPoint: 1, date: 1 }
      )
      .sort('-date')
      .limit(1);
    return result;
  },
  active: async (userId) => {
    const result = await driverRouteModel
      .find(
        { userId, status: routeStatus.STARTED },
        { startPoint: 1, endPoint: 1, date: 1 }
      )
      .sort('-date')
      .limit(1);
    return result;
  },
  cancelRoute: async (_id) => {
    //console.log({ _id });
    const result = await driverRouteModel.findOneAndUpdate(
      { _id, status: 'active' },
      {
        status: 'cancelled',
        accepted: [],
        rejected: [],
        request: [],
        cancelled: [],
        myRequests: [],
      },
      {
        populate: {
          path: 'userId',
          select:
            'firstName lastName totalRating totalRatingCount profileImage',
        },
      }
    );
    return result;
  },

  //driver schedule re-schedule services will create a new route with the new date and time
  reSchedule: async (_id, date) => {
    const oldRoute = await driverRouteServices.routeById(_id);
    const {
      userId,
      startPoint,
      endPoint,
      isScheduled,
      initialSeats,
      vehicleId,
      gender,
      bounds_sw,
      bounds_ne,
      polyline,
      encodedPolyline,
      corporateCode,
      kmLeverage,
      distance,
      duration,
    } = oldRoute;
    const route = new driverRouteModel({
      userId,
      startPoint,
      endPoint,
      lastLocation: [
        {
          latitude: startPoint.latitude,
          longitude: startPoint.longitude,
        },
      ],
      date,
      isScheduled,
      availableSeats: initialSeats,
      vehicleId,
      gender,
      initialSeats,
      bounds_sw,
      bounds_ne,
      polyline,
      encodedPolyline,
      kmLeverage,
      distance,
      duration,
      corporateCode,
    });
    const result = await route.save();
    if (result) {
      oldRoute.rescheduled = true;
      await oldRoute.save();
    }
    return result;
  },

  //validate if a ride is already started or not
  validateStartedRide: async (userId) => {
    const result = await driverRouteModel.findOne({
      userId,
      status: routeStatus.STARTED,
    });
    return result;
  },

  validateRouteTime: async (_id) => {
    const date = new Date();
    date.setHours(date.getHours() + 2);
    const result = await driverRouteModel
      .findOne({
        _id,
      })
      .lean();
    if (new Date() <= new Date(result.date)) {
      if (result.status == routeStatus.ACTIVE) {
        return false;
      }
    }
    if (new Date(result.date) >= date) {
      if (result.status == routeStatus.ACTIVE) {
        return true;
      }
    }
    return false;
  },
  //check any active ride of the driver if found then return true else false

  anyActiveRide: async (userId) => {
    const result = await driverRouteModel.findOne({
      userId,
      status: 'started',
    });
    if (result) {
      return result;
    } else {
      return false;
    }
  },

  //service to all those request on which no action performed yet

  notRespondedRequests: async (routeId) => {
    const route = await driverRouteServices.routeByIdWithRequests(routeId);
    const list = route.request.filter((request) => {
      const isAccepted = route.accepted.filter((accepted) => {
        if (accepted.toString() == request._id.toString()) {
          return true;
        }
      });
      if (isAccepted.length === 0) {
        const isCancelled = route.cancelled.filter((cancelled) => {
          if (cancelled.toString() == request._id.toString()) {
            return true;
          } else {
            return false;
          }
        });
        if (isCancelled.length === 0) {
          const isRejected = route.rejected.filter((rejected) => {
            if (rejected.toString() == request._id.toString()) {
              return true;
            } else {
              return false;
            }
          });
          if (isRejected.length === 0) {
            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      } else {
        return false;
      }
    });
    //console.lg(list);
    return list;
  },

  completedRidesCount: async (userId) => {
    const count = await driverRouteModel.count({
      userId,
      status: {
        // $in: ["completed", "rescheduled", "deleted"],
        $in: ['completed'],
      },
    });
    // console.log("count: " + count);
    return count;
  },

  totalCount: async (userId) => {
    const count = await driverRouteModel.count({
      userId,
      status: { $in: ['completed', 'cancelled', routeStatus.STARTED] },
    });
    return count;
  },

  cancelledRidesCount: async (userId) => {
    const count = await driverRouteModel.count({
      userId,
      status: { $in: ['cancelled'] },
    });
    return count;
  },
  upcomingSchedules: async (userId, skip) => {
    const list = await driverRouteModel
      .find(
        {
          userId,
          status: 'active',
        },
        { startPoint: 1, endPoint: 1, date: 1 }
      )
      .skip(skip)
      .limit(5)
      .populate({
        path: 'userId',
        select: 'firstName lastName totalRating totalRatingCount profileImage',
      });
    return list;
  },

  totalRides: async (userId, skip) => {
    const list = await driverRouteModel
      .find(
        {
          userId,
          // status: { $in: ["completed", "cancelled", "rescheduled", "deleted"] },
          status: { $in: ['completed', 'cancelled', routeStatus.STARTED] },
        },
        { startPoint: 1, endPoint: 1, date: 1, status: 1 }
      )
      .skip(skip)
      .limit(5)
      .populate({
        path: 'userId',
        select: 'firstName lastName totalRating totalRatingCount profileImage',
      })
      .sort({ date: -1 });
    return list;
  },

  totalRidesForWeb: async (userId) => {
    const list = await driverRouteModel
      .find(
        {
          userId,
          status: { $in: ['completed', 'cancelled', 'rescheduled', 'deleted'] },
        },
        {
          polyline: 0,
        }
      )
      .sort('-createdAt');
    return list;
  },

  activeRides: async (userId) => {
    const list = await driverRouteModel
      .find(
        {
          userId,
          status: routeStatus.STARTED,
        },
        {
          polyline: 0,
        }
      )
      .sort('-createdAt')
      .lean();
    return list;
  },

  allActiveRides: async () => {
    const list = await driverRouteModel
      .find(
        {
          status: routeStatus.STARTED,
        },
        {
          polyline: 0,
        }
      )
      .sort('-createdAt')
      .populate({
        path: 'userId',
        select: 'firstName lastName gender profileImage mobile',
      })
      .lean();
    return list;
  },

  completedRides: async (userId, skip) => {
    const list = await driverRouteModel
      .find(
        {
          userId,
          // status: { $in: ["completed", "rescheduled", "deleted"] },
          status: { $in: ['completed'] },
        },
        { startPoint: 1, endPoint: 1, date: 1 }
      )
      .skip(skip)
      .limit(5)
      .populate({
        path: 'userId',
        select: 'firstName lastName totalRating totalRatingCount profileImage',
      });
    // console.log({ completedRidesLength: list.length });
    return list;
  },

  historyRidesForPanel: async (userId) => {
    const list = await driverRouteModel.find(
      {
        userId,
        status: { $in: [routeStatus.COMPLETED, routeStatus.CANCELLED] },
      },
      { polyline: 0 }
    );
    return list;
  },

  //all other excluded completed, cancelled and started

  userOtherRides: async (userId) => {
    const list = await driverRouteModel
      .find(
        {
          userId,
          status: {
            $nin: [
              routeStatus.STARTED,
              routeStatus.COMPLETED,
              routeStatus.CANCELLED,
            ],
          },
        },
        {
          polyline: 0,
        }
      )
      .sort('-createdAt')
      .lean();
    return list;
  },
  allOtherRides: async () => {
    const list = await driverRouteModel
      .find(
        {
          status: {
            $nin: [
              routeStatus.STARTED,
              routeStatus.COMPLETED,
              routeStatus.CANCELLED,
            ],
          },
        },
        {
          polyline: 0,
        }
      )
      .populate({
        path: 'userId',
        select: 'firstName lastName gender profileImage mobile',
      })
      .sort('-createdAt')
      .lean();
    return list;
  },

  allUpcomingRides: async () => {
    const list = await driverRouteModel
      .find(
        {
          status: {
            $in: [routeStatus.ACTIVE],
          },
        },
        {
          polyline: 0,
        }
      )
      .populate({
        path: 'userId',
        select: 'firstName lastName gender profileImage mobile',
      })
      .sort('-createdAt')
      .lean();
    return list;
  },
  cancelledRides: async (userId, skip) => {
    const list = await driverRouteModel
      .find(
        {
          userId,
          status: 'cancelled',
        },
        { startPoint: 1, endPoint: 1, date: 1 }
      )
      .skip(skip)
      .limit(5)
      .populate({
        path: 'userId',
        select: 'firstName lastName totalRating totalRatingCount profileImage',
      });
    return list;
  },
  validateNowRoute: async (userId) => {
    const check = await driverRouteModel.findOne({
      userId,
      isScheduled: false,
      status: { $in: [routeStatus.ACTIVE, routeStatus.STARTED] },
    });
    if (check) {
      return true;
    } else {
      return false;
    }
  },

  //services for driver to passenger request module

  //to send request to passenger will accept route id and schedule id and push in myrequests
  sendRequest: async (_id, scheduleId) => {
    const schedule = await scheduleRideServices.getById(scheduleId);
    const result = await driverRouteModel.findOneAndUpdate(
      {
        _id,
        myRequests: { $nin: [scheduleId] },
      },
      { $push: { myRequests: mongoose.Types.ObjectId(scheduleId) } },
      {
        new: true,
        populate: {
          path: 'userId',
          select: ['firstName', 'lastName', 'fcmToken', 'profileImage'],
        },
      }
    );
    return result;
  },
  getMileage: async (_id) => {
    const result = await driverRouteModel
      .findOne({ _id }, { vehicleId: 1 })
      .populate({ path: 'vehicleId', select: 'minMileage' });
    if (result && result.vehicleId) {
      return result.vehicleId.minMileage;
    }
    return null;
  },

  history: async (userId, skip) => {
    const list = await driverRouteModel.aggregate([
      {
        $match: {
          status: routeStatus.COMPLETED,
          userId: mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: 'histories',
          localField: '_id',
          foreignField: 'routeId',
          as: 'history',
        },
      },
      {
        $match: {
          'history.userId': mongoose.Types.ObjectId(userId),
          'history.isDriver': true,
        },
      },
      {
        $project: {
          startPoint: '$startPoint',
          endPoint: '$endPoint',
          date: '$date',
          history: {
            $map: {
              input: '$history',
              as: 'item',
              in: {
                _id: '$$item._id',
                scheduleId: '$$item.scheduleId',
                routeId: '$$item.routeId',
                isRated: '$$item.isRated',
                isDriver: '$$item.isDriver',
              },
            },
          },
        },
      },
      {
        $project: {
          startPoint: 1,
          endPoint: 1,
          date: 1,
          history: {
            $filter: {
              input: '$history',
              as: 'item',
              cond: '$$item.isDriver',
            },
          },
        },
      },
      {
        $sort: {
          date: -1,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: 5,
      },
    ]);

    await scheduleRideModel.populate(list, {
      path: 'history.scheduleId',
      select:
        'startPoint endPoint _id userId distance duration bookedSeats fare',
    });
    await userModel.populate(list, {
      path: 'history.scheduleId.userId',
      select: [
        '_id',
        'firstName',
        'lastName',
        'gender',
        'totalRating',
        'totalRatingCount',
        'profileImage',
      ],
    });
    return list;
  },

  dashboardStat: async (startDate, endDate) => {
    let counts = await driverRouteModel.aggregate([
      {
        $match: {
          $expr: {
            $and: [{ $gte: ['$date', startDate] }, { $lt: ['$date', endDate] }],
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: ['$status', '$user.gender'],
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    const lowerDateForTodayCount = new Date();
    lowerDateForTodayCount.setMilliseconds(0);
    lowerDateForTodayCount.setSeconds(0);
    lowerDateForTodayCount.setMinutes(0);
    lowerDateForTodayCount.setHours(0);
    const upperDateForTodayCount = new Date(lowerDateForTodayCount);
    upperDateForTodayCount.setHours(lowerDateForTodayCount.getHours() + 24);

    let todayCounts = await driverRouteModel.aggregate([
      {
        $match: {
          date: {
            $lt: upperDateForTodayCount,
            $gte: lowerDateForTodayCount,
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: ['$status', '$user.gender'],
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    const lowerDate = new Date();
    lowerDate.setDate(lowerDate.getDate() - 30);
    lowerDate.setHours(0);
    lowerDate.setMinutes(0);
    lowerDate.setSeconds(0);
    lowerDate.setMilliseconds(0);
    const upperDate = new Date();
    upperDate.setHours(0);
    upperDate.setMinutes(0);
    upperDate.setSeconds(0);
    upperDate.setMilliseconds(0);
    upperDate.setDate(upperDate.getDate() + 1);
    const lineChartData = await driverRouteModel.aggregate([
      // { $match: { date: { $lt: endDate, $gte: startDate } } },
      {
        $match: {
          $expr: {
            $and: [{ $gte: ['$date', startDate] }, { $lt: ['$date', endDate] }],
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: -1 },
      },
    ]);

    counts = counts.map((item) => {
      return {
        status: item._id[0],
        gender: item._id[1],
        count: item.count,
      };
    });

    todayCounts = todayCounts.map((item) => {
      return {
        status: item._id[0],
        gender: item._id[1],
        count: item.count,
      };
    });

    const statuses = ['active', 'started', 'completed', 'cancelled'];
    const countByStatus = [];
    statuses.forEach((status) => {
      const maleCount =
        counts.find((item) => item.status === status && item.gender === 'male')
          ?.count || 0;
      const femaleCount =
        counts.find(
          (item) => item.status === status && item.gender === 'female'
        )?.count || 0;

      const todayMaleCount =
        todayCounts.find(
          (item) => item.status === status && item.gender === 'male'
        )?.count || 0;
      const todayFemaleCount =
        todayCounts.find(
          (item) => item.status === status && item.gender === 'female'
        )?.count || 0;

      countByStatus.push({
        status,
        male: maleCount,
        female: femaleCount,
        total: maleCount + femaleCount,
        todayMale: todayMaleCount,
        todayFemale: todayFemaleCount,
        todayTotal: todayMaleCount + todayFemaleCount,
      });
    });
    const result = {};
    countByStatus.forEach((item) => {
      result[item.status] = {
        male: item.male,
        female: item.female,
        total: item.total,
        todayMale: item.todayMale,
        todayFemale: item.todayFemale,
        todayTotal: item.todayTotal,
      };
    });
    return { lineChartData, countByStatus: result };
  },

  rejectedRequestsCount: async (startDate, endDate) => {
    let result = await driverRouteModel.aggregate([
      {
        $match: {
          $expr: {
            $and: [{ $gte: ['$date', startDate] }, { $lt: ['$date', endDate] }],
          },
        },
      },
      {
        $match: {
          $and: [
            {
              $expr: {
                $ne: [
                  0,
                  {
                    $size: '$request',
                  },
                ],
              },
            },
            {
              $expr: {
                $ne: [
                  0,
                  {
                    $size: '$rejected',
                  },
                ],
              },
            },
          ],
        },
      },
      {
        $project: {
          userId: 1,
          commonToBoth: { $setIntersection: ['$request', '$rejected'] },
          _id: 1,
        },
      },
      { $unwind: '$commonToBoth' },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'owner',
        },
      },
      {
        $lookup: {
          from: 'schedulerides',
          localField: 'commonToBoth',
          foreignField: '_id',
          as: 'schedule',
        },
      },
      {
        $unwind: {
          path: '$owner',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: '$schedule',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'schedule.userId',
          foreignField: '_id',
          as: 'passenger',
        },
      },
      {
        $unwind: {
          path: '$passenger',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: '$owner.gender',
          count: {
            $sum: 1,
          },
        },
      },
    ]);
    result = result.reduce(
      (acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      },
      { male: 0, female: 0 }
    );
    result.total = result.male + result.female;
    return result;
  },
  rejectedDriversRequestsCount: async (startDate, endDate) => {
    let result = await driverRouteModel.aggregate([
      {
        $match: {
          $expr: {
            $and: [{ $gte: ['$date', startDate] }, { $lt: ['$date', endDate] }],
          },
        },
      },
      {
        $match: {
          $and: [
            {
              $expr: {
                $ne: [
                  0,
                  {
                    $size: '$myRequests',
                  },
                ],
              },
            },
            {
              $expr: {
                $ne: [
                  0,
                  {
                    $size: '$rejected',
                  },
                ],
              },
            },
          ],
        },
      },
      {
        $project: {
          userId: 1,
          commonToBoth: { $setIntersection: ['$myRequests', '$rejected'] },
          _id: 1,
        },
      },
      { $unwind: '$commonToBoth' },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'owner',
        },
      },
      {
        $lookup: {
          from: 'schedulerides',
          localField: 'commonToBoth',
          foreignField: '_id',
          as: 'schedule',
        },
      },
      {
        $unwind: {
          path: '$owner',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: '$schedule',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'schedule.userId',
          foreignField: '_id',
          as: 'passenger',
        },
      },
      {
        $unwind: {
          path: '$passenger',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: '$passenger.gender',
          count: {
            $sum: 1,
          },
        },
      },
    ]);
    result = result.reduce(
      (acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      },
      { male: 0, female: 0 }
    );
    result.total = result.male + result.female;
    return result;
  },

  acceptedRequestsCount: async (startDate, endDate) => {
    let result = await driverRouteModel.aggregate([
      {
        $match: {
          $expr: {
            $and: [{ $gte: ['$date', startDate] }, { $lt: ['$date', endDate] }],
          },
        },
      },
      {
        $match: {
          $and: [
            {
              $expr: {
                $ne: [
                  0,
                  {
                    $size: '$request',
                  },
                ],
              },
            },
            {
              $expr: {
                $ne: [
                  0,
                  {
                    $size: '$accepted',
                  },
                ],
              },
            },
          ],
        },
      },
      {
        $project: {
          userId: 1,
          commonToBoth: { $setIntersection: ['$request', '$accepted'] },
          _id: 1,
        },
      },
      { $unwind: '$commonToBoth' },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'owner',
        },
      },
      {
        $lookup: {
          from: 'schedulerides',
          localField: 'commonToBoth',
          foreignField: '_id',
          as: 'schedule',
        },
      },
      {
        $unwind: {
          path: '$owner',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: '$schedule',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'schedule.userId',
          foreignField: '_id',
          as: 'passenger',
        },
      },
      {
        $unwind: {
          path: '$passenger',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: '$owner.gender',
          count: {
            $sum: 1,
          },
        },
      },
    ]);
    result = result.reduce(
      (acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      },
      { male: 0, female: 0 }
    );
    result.total = result.male + result.female;
    return result;
  },
  acceptedDriversRequestsCount: async (startDate, endDate) => {
    let result = await driverRouteModel.aggregate([
      {
        $match: {
          $expr: {
            $and: [{ $gte: ['$date', startDate] }, { $lt: ['$date', endDate] }],
          },
        },
      },
      {
        $match: {
          $and: [
            {
              $expr: {
                $ne: [
                  0,
                  {
                    $size: '$myRequests',
                  },
                ],
              },
            },
            {
              $expr: {
                $ne: [
                  0,
                  {
                    $size: '$accepted',
                  },
                ],
              },
            },
          ],
        },
      },
      {
        $project: {
          userId: 1,
          commonToBoth: { $setIntersection: ['$myRequests', '$accepted'] },
          _id: 1,
        },
      },
      { $unwind: '$commonToBoth' },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'owner',
        },
      },
      {
        $lookup: {
          from: 'schedulerides',
          localField: 'commonToBoth',
          foreignField: '_id',
          as: 'schedule',
        },
      },
      {
        $unwind: {
          path: '$owner',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: '$schedule',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'schedule.userId',
          foreignField: '_id',
          as: 'passenger',
        },
      },
      {
        $unwind: {
          path: '$passenger',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: '$passenger.gender',
          count: {
            $sum: 1,
          },
        },
      },
    ]);
    result = result.reduce(
      (acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      },
      { male: 0, female: 0 }
    );
    result.total = result.male + result.female;
    return result;
  },

  cancelledRequestsCount: async (startDate, endDate) => {
    let result = await driverRouteModel.aggregate([
      {
        $match: {
          $expr: {
            $and: [{ $gte: ['$date', startDate] }, { $lt: ['$date', endDate] }],
          },
        },
      },
      {
        $match: {
          $and: [
            {
              $expr: {
                $ne: [
                  0,
                  {
                    $size: '$request',
                  },
                ],
              },
            },
            {
              $expr: {
                $ne: [
                  0,
                  {
                    $size: '$cancelled',
                  },
                ],
              },
            },
          ],
        },
      },
      {
        $project: {
          userId: 1,
          commonToBoth: { $setIntersection: ['$request', '$cancelled'] },
          _id: 1,
        },
      },
      { $unwind: '$commonToBoth' },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'owner',
        },
      },
      {
        $lookup: {
          from: 'schedulerides',
          localField: 'commonToBoth',
          foreignField: '_id',
          as: 'schedule',
        },
      },
      {
        $unwind: {
          path: '$owner',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: '$schedule',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'schedule.userId',
          foreignField: '_id',
          as: 'passenger',
        },
      },
      {
        $unwind: {
          path: '$passenger',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: '$owner.gender',
          count: {
            $sum: 1,
          },
        },
      },
    ]);
    result = result.reduce(
      (acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      },
      { male: 0, female: 0 }
    );
    result.total = result.male + result.female;
    return result;
  },
  cancelledDriversRequestsCount: async (startDate, endDate) => {
    let result = await driverRouteModel.aggregate([
      {
        $match: {
          $expr: {
            $and: [{ $gte: ['$date', startDate] }, { $lt: ['$date', endDate] }],
          },
        },
      },
      {
        $match: {
          $and: [
            {
              $expr: {
                $ne: [
                  0,
                  {
                    $size: '$myRequests',
                  },
                ],
              },
            },
            {
              $expr: {
                $ne: [
                  0,
                  {
                    $size: '$cancelled',
                  },
                ],
              },
            },
          ],
        },
      },
      {
        $project: {
          userId: 1,
          commonToBoth: { $setIntersection: ['$myRequests', '$cancelled'] },
          _id: 1,
        },
      },
      { $unwind: '$commonToBoth' },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'owner',
        },
      },
      {
        $lookup: {
          from: 'schedulerides',
          localField: 'commonToBoth',
          foreignField: '_id',
          as: 'schedule',
        },
      },
      {
        $unwind: {
          path: '$owner',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: '$schedule',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'schedule.userId',
          foreignField: '_id',
          as: 'passenger',
        },
      },
      {
        $unwind: {
          path: '$passenger',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: '$passenger.gender',
          count: {
            $sum: 1,
          },
        },
      },
    ]);
    result = result.reduce(
      (acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      },
      { male: 0, female: 0 }
    );
    result.total = result.male + result.female;
    return result;
  },

  //service to get all driver last location those who have started route
  startedRouteDriverLocation: async () => {
    const list = await driverRouteModel.aggregate([
      {
        $match: {
          status: routeStatus.STARTED,
        },
      },
      {
        $project: {
          _id: 1,
          status: 1,
          lastLocation: { $slice: ['$lastLocation', -1] },
        },
      },
      {
        $project: {
          lastLocation: {
            $arrayElemAt: ['$lastLocation', 0],
          },
        },
      },
    ]);
    return list;
  },

  setRouteReminder: async () => {
    const date = new Date();
    date.setMinutes(date.getMinutes() - 5);
    const list = await driverRouteModel.find(
      { date: { $gt: date }, status: routeStatus.ACTIVE },
      { date: 1, userId: 1 }
    );
    list.forEach((item) => {
      const reminderTime = new Date(item.date);
      reminderTime.setMinutes(reminderTime.getMinutes() - 5);
      scheduleReminder(
        reminderTime,
        item._id.toString(),
        item.userId.toString()
      );
    });
  },
};

module.exports = driverRouteServices;
