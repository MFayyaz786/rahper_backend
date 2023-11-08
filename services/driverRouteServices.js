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
const { STARTED, ACTIVE } = require('../utils/routeStatus');

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

  defineRecurringRoutes: async (
    userId,
    startPoint,
    endPoint,
    isScheduled = true,
    availableSeats,
    vehicleId,
    gender,
    polyline,
    bounds_sw,
    bounds_ne,
    kmLeverage,
    distance,
    duration,
    corporateCode,
    startDate,
    endDate,
    recurringDays
  ) => {
    corporateCode = corporateCode === '' ? null : corporateCode;
    const routes = [];
    const currentDate = new Date(startDate);
    const lastDate = new Date(endDate);
    const recurringId = mongoose.Types.ObjectId();

    while (currentDate <= lastDate) {
      // Check if the current day is included in the recurring days
      const currentDay = currentDate.getDay();
      if (recurringDays.includes(currentDay)) {
        // Create a route for the current day
        const route = new driverRouteModel({
          _id: mongoose.Types.ObjectId(),
          recurringId,
          userId: mongoose.Types.ObjectId(userId),
          startPoint,
          endPoint,
          lastLocation: [
            {
              latitude: startPoint.latitude,
              longitude: startPoint.longitude,
            },
          ],
          date: new Date(currentDate),
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

        routes.push(route);
      }

      // Increment current date by one day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Save all the routes to the database
    if (routes.length == 0) {
      return [];
    }
    const savedRoutes = await driverRouteModel.insertMany(routes);
    return savedRoutes;
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

  deleteRecurringRoute: async (recurringId) => {
    const routes = await driverRouteModel.find({
      recurringId,
      status: { $in: [routeStatus.CANCELLED, routeStatus.COMPLETED] },
    });
    const deletedRoutes = [];
    for (const route of routes) {
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
        deletedRoutes.push(deletedRoute);
      } else {
        const deletedRoute = await driverRouteModel.findOneAndUpdate(
          { _id: route._id },
          {
            deleted: true,
          }
        );
        deletedRoutes.push(deletedRoute);
      }
    }
    return deletedRoutes.length;
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
      .sort('-date')
      .lean();

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

    activeList = await Promise.all(
      activeList.map(async (route) => {
        const matchedPassengers = await driverRouteServices.matchedPassengers(
          route._id,
          false
        );

        const requestCount = route.request.filter(
          (idA) =>
            ![...route.accepted, ...route.rejected, ...route.cancelled].some(
              (idB) => idB.toString() === idA.toString()
            )
        );
        return {
          ...route,
          matchCount: matchedPassengers.length - route.myRequests.length,
          requestCount: requestCount.length,
        };
      })
    );
    if (top) {
      const matchedPassengersTop = await driverRouteServices.matchedPassengers(
        top._id,
        false
      );
      const requestCount = top.request.filter(
        (idA) =>
          ![...top.accepted, ...top.rejected, ...top.cancelled].some(
            (idB) => idB.toString() === idA.toString()
          )
      );
      top = {
        ...top,
        matchCount: matchedPassengersTop.length - top.myRequests.length,
        requestCount: requestCount.length,
      };
    }
    //if any started route then place it at top of the list
    let sortedList = [...activeList, ...remainingList];
    top && sortedList.unshift(top);
    sortedList.forEach((item, index) => {
      console.log("item.request.length", item.request.length);
      console.log("item.accepted.length", item.accepted.length);
      console.log("item.rejected.length", item.rejected.length);
      console.log("item.cancelled.length", item.cancelled.length);
      sortedList[index].totalRequests =
        item.request.length -
        item.accepted.length -
        item.rejected.length -
        item.cancelled.length;
    });
    //returning sortedList
    console.log("sortedList", sortedList);
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
      .populate({
        path: 'request',
        populate: {
          path: 'userId',
          select: 'firstName lastName profileImage gender',
        },
        select:
          'startPoint endPoint status bounds_ne bounds_sw fare  endTime startTime',
      })
      .populate({
        path: 'myRequests',
        populate: {
          path: 'userId',
          select: 'firstName lastName profileImage gender',
        },
        select:
          'startPoint endPoint status bounds_ne bounds_sw fare  endTime startTime',
      })
      .populate({
        path: 'accepted',
        populate: {
          path: 'userId',
          select: 'firstName lastName profileImage gender',
        },
        select:
          'startPoint endPoint status bounds_ne bounds_sw fare polyline  endTime startTime',
      });
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
          select: [
            'firstName',
            'lastName',
            'fcmToken',
            'profileImage',
            'anyMatchAsDriver',
          ],
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
    console.log({ _id, scheduleId });
    const schedule = await scheduleRideServices.getById(scheduleId);
    const { bookedSeats } = schedule;
    const result1 = await driverRouteModel.findOne({
      _id,
      accepted: { $in: [scheduleId] },
    });
    console.log({ result1 });
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
      deleted: false,
    });
    return count;
  },

  upcomingRides: async (userId) => {
    const list = await driverRouteModel.find({
      userId,
      status: 'active',
      deleted: false,
    });
    return list;
  },

  upcoming: async (userId) => {
    const result = await driverRouteModel
      .find(
        { userId, status: 'active', deleted: false },
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

  cancelRecurring: async (recurringId) => {
    const recurring = await driverRouteModel.find(
      { recurringId, status: routeStatus.ACTIVE },
      { _id: 1 }
    );
    const cancelledRoutes = [];
    for (route of recurring) {
      const cancelledRoute = await driverRouteServices.cancelRoute(route._id);
      if (cancelledRoute) {
        cancelledRoutes.push(cancelledRoute);
      }
    }
    return cancelledRoutes;
  },

  //driver schedule re-schedule services will create a new route with the new date and time
  reSchedule: async (_id, date, vehicleId) => {
    const oldRoute = await driverRouteServices.routeById(_id);
    const {
      userId,
      startPoint,
      endPoint,
      isScheduled,
      initialSeats,
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
          deleted: false,
        },
        { startPoint: 1, endPoint: 1, date: 1 }
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

  allActiveRides: async (pageNumber = 0) => {
    pageNumber = parseInt(pageNumber) + 1;
    const pageSize = 50; // Specify the number of documents per page
    const skip = (pageNumber - 1) * pageSize;
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
      .skip(skip)
      .limit(pageSize)
      .lean();
    return list;
  },
  allActiveRidesCount: async () => {
    const result = await driverRouteModel.count({
      status: routeStatus.STARTED,
    });
    return result;
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
      })
      .sort({ date: -1 });
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

  allUpcomingRides: async (pageNumber = 0) => {
    pageNumber = parseInt(pageNumber) + 1;
    const pageSize = 50; // Specify the number of documents per page
    const skip = (pageNumber - 1) * pageSize;
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
      .lean()
      .skip(skip)
      .limit(pageSize);
    return list;
  },
  allUpcomingRidesCount: async () => {
    const list = await driverRouteModel.count({
      status: {
        $in: [routeStatus.ACTIVE],
      },
    });
    return list;
  },
  allCompletedRides: async (pageNumber = 0) => {
    pageNumber = parseInt(pageNumber) + 1;
    const pageSize = 50; // Specify the number of documents per page
    const skip = (pageNumber - 1) * pageSize;
    const list = await driverRouteModel
      .find(
        {
          status: {
            $in: [routeStatus.COMPLETED],
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
      .lean()
      .skip(skip)
      .limit(pageSize);
    return list;
  },
  allCompletedRidesCount: async () => {
    const result = await driverRouteModel.count({
      status: {
        $in: [routeStatus.COMPLETED],
      },
    });
    return result;
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
      })
      .sort({ date: -1 });
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
    list.forEach((item) => {
      item.history = item.history.filter(
        (historyItem) => historyItem.scheduleId !== null
      );
    });
    return list;
  },

  dashboardStat: async () => {
    const counts = await driverRouteModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
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

    const todayCounts = await driverRouteModel.aggregate([
      {
        $match: {
          date: {
            $lt: upperDateForTodayCount,
            $gte: lowerDateForTodayCount,
          },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
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
      { $match: { date: { $lt: upperDate, $gte: lowerDate } } },
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

    const status = [
      {
        _id: 'active',
      },
      {
        _id: 'cancelled',
      },
      {
        _id: 'completed',
      },
      {
        _id: 'pending',
      },
      {
        _id: 'started',
      },
    ];

    result = {};
    status.forEach((item) => {
      const find = counts.find((element) => {
        return item._id == element._id;
      });

      if (find) {
        result[item._id] = find.count;
      } else {
        result[item._id] = 0;
      }
      const find2 = todayCounts.find((element) => {
        return item._id == element._id;
      });

      if (find2) {
        result[item._id + 'Today'] = find2.count;
      } else {
        result[item._id + 'Today'] = 0;
      }
    });
    return { countByStatus: result, lineChartData };
  },

  // dashboardStat: async () => {
  //   const driver = await driverRouteModel.aggregate([
  //     {
  //       $group: {
  //         _id: {
  //           createdAt: { $month: "$createdAt" },
  //         },
  //        m: 1 },
  //       },
  //     },
  //   ]);
  //   // const passenger = await scheduleRideModel.aggregate([
  //   //   {
  //   //     $group: {
  //   //       _id: {
  //   //         createdAt: { $month: "$createdAt" },
  //   //       },
  //   //       count: { $sum: 1 },
  //   //     },
  //   //   },
  //   // ]);

  //   const lowerDate = new Date();
  //   lowerDate.setDate(lowerDate.getDate() - 30);
  //   lowerDate.setHours(0);
  //   lowerDate.setMinutes(0);
  //   lowerDate.setSeconds(0);
  //   lowerDate.setMilliseconds(0);
  //   const upperDate = new Date();
  //   upperDate.setHours(0);
  //   upperDate.setMinutes(0);
  //   upperDate.setSeconds(0);
  //   upperDate.setMilliseconds(0);
  //   upperDate.setDate(upperDate.getDate() + 1);
  //   const lineChartData = await driverRouteModel.aggregate([
  //     { $match: { date: { $lt: upperDate, $gte: lowerDate } } },
  //     {
  //       $group: {
  //         _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
  //         count: { $sum: 1 },
  //       },
  //     },
  //     {
  //       $sort: { _id: -1 },
  //     },
  //   ]);
  //   return { driver, lineChartData };
  // },

  rejectedRequestsCount: async () => {
    const result = await driverRouteModel.aggregate([
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
          commonToBoth: { $setIntersection: ['$request', '$rejected'] },
          _id: 1,
        },
      },
      { $unwind: '$commonToBoth' },
      {
        $facet: {
          totalCount: [
            {
              $count: 'count',
            },
          ],
        },
      },
    ]);
    if (!result[0].totalCount[0]) {
      return 0;
    }
    return result[0].totalCount[0].count;
  },
  rejectedDriversRequestsCount: async () => {
    const result = await driverRouteModel.aggregate([
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
          commonToBoth: { $setIntersection: ['$myRequests', '$rejected'] },
          _id: 1,
        },
      },
      { $unwind: '$commonToBoth' },
      {
        $facet: {
          totalCount: [
            {
              $count: 'count',
            },
          ],
        },
      },
    ]);
    if (!result[0].totalCount[0]) {
      return 0;
    }
    return result[0].totalCount[0].count;
  },

  acceptedRequestsCount: async () => {
    const result = await driverRouteModel.aggregate([
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
          commonToBoth: { $setIntersection: ['$request', '$accepted'] },
          _id: 1,
        },
      },
      { $unwind: '$commonToBoth' },
      {
        $facet: {
          totalCount: [
            {
              $count: 'count',
            },
          ],
        },
      },
    ]);
    if (!result[0].totalCount[0]) {
      return 0;
    }
    return result[0].totalCount[0].count;
  },
  acceptedDriversRequestsCount: async () => {
    const result = await driverRouteModel.aggregate([
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
          commonToBoth: { $setIntersection: ['$myRequests', '$accepted'] },
          _id: 1,
        },
      },
      { $unwind: '$commonToBoth' },
      {
        $facet: {
          totalCount: [
            {
              $count: 'count',
            },
          ],
        },
      },
    ]);
    if (!result[0].totalCount[0]) {
      return 0;
    }
    return result[0].totalCount[0].count;
  },

  cancelledRequestsCount: async () => {
    const result = await driverRouteModel.aggregate([
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
          commonToBoth: { $setIntersection: ['$request', '$cancelled'] },
          _id: 1,
        },
      },
      { $unwind: '$commonToBoth' },
      {
        $facet: {
          totalCount: [
            {
              $count: 'count',
            },
          ],
        },
      },
    ]);
    if (!result[0].totalCount[0]) {
      return 0;
    }
    return result[0].totalCount[0].count;
  },
  cancelledDriversRequestsCount: async () => {
    const result = await driverRouteModel.aggregate([
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
          commonToBoth: { $setIntersection: ['$myRequests', '$cancelled'] },
          _id: 1,
        },
      },
      { $unwind: '$commonToBoth' },
      {
        $facet: {
          totalCount: [
            {
              $count: 'count',
            },
          ],
        },
      },
    ]);
    if (!result[0].totalCount[0]) {
      return 0;
    }
    return result[0].totalCount[0].count;
  },

  anyActiveRoute: async (userId) => {
    const result = await driverRouteModel.findOne({
      userId,
      // $or: [{ accepted: { $ne: [] } }, { myRequests: { $ne: [] } }],
      status: routeStatus.ACTIVE,
      deleted: false,
    });
    return result;
  },

  //service to get all driver last location those who have started route
  startedRouteDriverLocation: async () => {
    const list = await driverRouteModel.aggregate([
      {
        $project: {
          _id: 1,
          status: 1,
          lastLocation: { $slice: ['$lastLocation', -1] },
        },
      },
      {
        $match: {
          status: routeStatus.STARTED,
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

  vehicleDeleteValidation: async (vehicleId) => {
    const result = await driverRouteModel.findOne({
      vehicleId,
      status: { $in: [STARTED, ACTIVE] },
    });
    return result;
  },
};

module.exports = driverRouteServices;
