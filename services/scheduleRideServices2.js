const mongoose = require("mongoose");
const scheduleRideModel = require("../models/scheduleRideModel");
const polylineEncoded = require("polyline-encoded");
const driverRouteModel = require("../models/driverRouteModel");
const { isNear } = require("./locationServices");
const priceCalculator = require("../utils/priceCalculator");
const fareIntialsServices = require("./fareIntialsServices");
const { passengerCancelled } = require("../utils/notificationsInfo");
const scheduleRideStatuses = {
  ACCEPTED: "accepted",
  ACTIVE: "active",
  PENDING: "pending",
  PAYMENTPENDING: "payment pending",
};

const scheduleRideServices = {
  schedule: async (
    userId,
    startPoint,
    endPoint,
    date,
    startTime,
    endTime,
    distance,
    isScheduled,
    bookedSeats,
    gender,
    polyline,
    bounds_sw,
    bounds_ne,
    duration,
    corporateCode
  ) => {
    corporateCode = corporateCode == "" ? null : corporateCode;
    if (isScheduled) {
      const scheduleRide = new scheduleRideModel({
        userId: mongoose.Types.ObjectId(userId),
        startPoint,
        endPoint,
        date,
        startTime,
        endTime,
        distance,
        isScheduled,
        bookedSeats,
        gender,
        duration,
        softSave: true,
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
        corporateCode,
      });
      const result = await scheduleRide.save();
      return result;
    } else {
      //adding 10 min before the start time
      const date = new Date(startTime);
      const updatedStartTime = new Date(
        date.setMinutes(date.getMinutes() - 10)
      );

      const scheduleRide = new scheduleRideModel({
        userId: mongoose.Types.ObjectId(userId),
        startPoint,
        endPoint,
        date,
        startTime: updatedStartTime,
        endTime,
        distance,
        isScheduled,
        bookedSeats,
        gender,
        duration,
        softSave: true,
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
        corporateCode,
      });
      const result = await scheduleRide.save();
      return result;
    }
  },

  softSave: async (_id) => {
    const ride = await scheduleRideModel.findOneAndUpdate(
      { _id },
      { softSave: true },
      { new: true }
    );
    return ride;
  },

  getById: async (_id) => {
    const ride = await scheduleRideModel.findOne({ _id }).populate({
      path: "userId",
      select: [
        "firstName",
        "lastName",
        "mobile",
        "gender",
        "profileImage",
        "totalRating",
        "totalRatingCount",
        "fcmToken",
        "corporateCode",
      ],
    });
    return ride;
  },

  getByIdForPanel: async (_id) => {
    const ride = await scheduleRideModel
      .findOne({ _id })
      .populate({
        path: "userId",
        select: [
          "firstName",
          "lastName",
          "mobile",
          "gender",
          "profileImage",
          "totalRating",
          "totalRatingCount",
          "fcmToken",
          "corporateCode",
        ],
      })
      .populate({ path: "request", populate: "userId" })
      .populate({ path: "driverRequests", populate: "userId" })
      .populate({
        path: "accepted",
        populate: { path: "userId", model: "User" },
      })
      .populate({
        path: "accepted",
        populate: {
          path: "vehicleId",
          model: "Vehicle",
          populate: { path: "model", model: "VehicleModel" },
        },
      })
      .populate({
        path: "accepted",
        populate: {
          path: "vehicleId",
          model: "Vehicle",
          populate: {
            path: "model",
            model: "VehicleModel",
            populate: { path: "make", model: "VehicleMake" },
          },
        },
      })
      .populate({
        path: "accepted",
        populate: {
          path: "vehicleId",
          model: "Vehicle",
          populate: {
            path: "model",
            model: "VehicleModel",
            populate: { path: "type", model: "VehicleType" },
          },
        },
      })
      .populate({
        path: "accepted",
        populate: {
          path: "vehicleId",
          model: "Vehicle",
          populate: {
            path: "registrationCity",
          },
        },
      })
      .populate({
        path: "accepted",
        populate: {
          path: "vehicleId",
          model: "Vehicle",
          populate: {
            path: "registrationProvince",
          },
        },
      })
      .populate({
        path: "accepted",
        populate: {
          path: "vehicleId",
          model: "Vehicle",
          populate: {
            path: "color",
          },
        },
      });

    return ride;
  },

  updatedVerifyPin: async (_id, verifyPin) => {
    const ride = await scheduleRideModel
      .findOneAndUpdate({ _id }, { verifyPin }, { new: true })
      .populate({
        path: "userId",
        select: [
          "firstName",
          "lastName",
          "mobile",
          "gender",
          "profileImage",
          "totalRating",
          "totalRatingCount",
          "fcmToken",
        ],
      });
    return ride;
  },
  getuserSchedules: async (userId) => {
    // console.log("herehhh");
    const list = await scheduleRideModel
      .find(
        {
          userId,
          // status: { $in: ["pending", "completed", "cancelled"] },
          reschedule: false,
          deleted: false,
          softSave: true,
        },
        { polyline: 0, matchedDrivers: 0 }
      )
      .populate({
        path: "userId",
        model: "User",
        select: [
          "firstName",
          "lastName",
          "totalRating",
          "totalRatingCount",
          "profileImage",
        ],
      })
      .sort("-startTime");
    let activeList = [];
    let acceptedList = [];
    let pendingList = [];
    let remainingList = [];
    for (let i = 0; i < list.length; i++) {
      if (list[i].status == scheduleRideStatuses.ACTIVE) {
        activeList.push(list[i]);
      } else if (list[i].status == scheduleRideStatuses.ACCEPTED) {
        acceptedList.push(list[i]);
      } else if (list[i].status == scheduleRideStatuses.PENDING) {
        pendingList.push(list[i]);
      } else {
        remainingList.push(list[i]);
      }
    }
    let sortedList = [
      ...activeList,
      ...pendingList,
      ...acceptedList,
      ...remainingList,
    ];
    return sortedList;
  },

  getuserSchedulesTojoingRoom: async (userId) => {
    const list = await scheduleRideModel
      .find(
        { userId, status: { $in: ["accepted", "active"] }, softSave: true },
        { polyline: 0, matchedDrivers: 0 }
      )
      .populate({
        path: "userId",
        model: "User",
        select: [
          "firstName",
          "lastName",
          "totalRating",
          "totalRatingCount",
          "profileImage",
        ],
      })
      .sort("-createdAt");
    return list;
  },

  schedulesToJoinRooms: async (userId) => {
    const list = await scheduleRideModel
      .find(
        {
          userId,
          status: { $in: ["accepted", "acitve"] },
          softSave: true,
        },
        { polyline: 0, matchedDrivers: 0 }
      )
      .populate({
        path: "userId",
        model: "User",
        select: [
          "firstName",
          "lastName",
          "totalRating",
          "totalRatingCount",
          "profileImage",
        ],
      })
      .sort("-createdAt");
    return list;
  },

  delete: async (_id) => {
    const deletedRide = await scheduleRideModel.findOneAndDelete({
      _id,
      accepted: null,
    });

    if (deletedRide == null) {
      const softDeletedRide = await scheduleRideModel.findOneAndUpdate(
        {
          _id,
        },
        {
          deleted: true,
        },
        {
          new: true,
        }
      );
      return softDeletedRide;
    }
    return deletedRide;
  },

  getSchedulesWithFilter: async (availableSeats, gender, isScheduled) => {
    const result = await scheduleRideModel.find({
      gender,
      isScheduled,
      bookedSeats: { $lte: availableSeats },
    });
    return result;
  },

  matchedDrivers: async (scheduleId) => {
    const schedule = await scheduleRideServices.getById(scheduleId);
    if (schedule == null) {
      throw new Error("");
    }
    const {
      bookedSeats,
      gender,
      startPoint,
      endPoint,
      distance,
      request,
      rejected,
      cancelled,
      accepted,
      driverRequests,
      corporateCode,
    } = schedule;

    //console.log(schedule.date);
    // console.log({ a: schedule.startTime, b: schedule.endTime });
    if (gender === "any") {
      let driverRoutes = await driverRouteModel
        .find({
          date: { $lte: schedule.endTime, $gte: schedule.startTime },
          status: { $in: ["active", "started"] },
          availableSeats: { $gte: bookedSeats },
          userId: { $ne: schedule.userId },
        })
        .populate({
          path: "userId",
          select:
            "firstName lastName totalRating totalRatingCount mobile profileImage gender corporateCode fcmToken",
        })
        .populate({
          path: "vehicleId",
          select: "-registrationCity -registrationProvince",
          populate: { path: "model", select: "model" },
        })
        .populate({
          path: "vehicleId",
          select: "-registrationCity -registrationProvince",
          populate: { path: "color", select: "color" },
        })
        .sort("-createdAt");
      // .filter((item) => {
      //   return userId.gender === item.userId.gender || item.gender === gender;
      // });

      // console.log("**************", driverRoutes);

      driverRoutes = driverRoutes.filter((item) => {
        return (
          schedule.userId.gender === item.userId.gender ||
          item.gender === gender
        );
      });

      const nearestDriver = await Promise.all(
        driverRoutes
          .filter((driver) => {
            const start = isNear(
              startPoint,
              driver.polyline,
              driver.kmLeverage
            );
            // const requestValidation = driverRequests.request.find((item) => {
            //   return item.toString() == route._id.toString();
            // });
            // if (requestValidation !== undefined) {
            //   return false;
            // }
            const end = isNear(endPoint, driver.polyline, driver.kmLeverage);
            // if (schedule.corporateCode !== null) {
            const corporateCodeValidation =
              schedule.corporateCode == driver.corporateCode;
            return start && end && corporateCodeValidation;
            // }
            // return start && end;
          })
          .map(async (item) => {
            // console.log();
            const fare = await priceCalculator(
              item.vehicleId.minMileage,
              distance,
              corporateCode
            );
            const {
              _id,
              startPoint,
              endPoint,
              userId,
              date,
              time,
              isScheduled,
              availableSeats,
              vehicleId,
              gender,
              encodedPolyline,
              request,
              cancelled,
              rejected,
              accepted,
              bounds_ne,
              bounds_sw,
            } = item;
            return {
              _id,
              startPoint,
              endPoint,
              userId,
              date,
              time,
              isScheduled,
              availableSeats,
              vehicleId,
              gender,
              encodedPolyline,
              request,
              cancelled,
              rejected,
              accepted,
              bounds_ne,
              bounds_sw,
              fare,
            };
          })
      );
      //console.log(nearestDriver);
      const {
        _id,
        userId,
        date,
        time,
        vehicleId,
        isScheduled,
        encodedPolyline,
      } = schedule;
      // console.log(await nearestDriver);
      return {
        schedule: {
          _id,
          startPoint,
          endPoint,
          userId,
          date,
          time,
          isScheduled,
          bookedSeats,
          vehicleId,
          gender,
          encodedPolyline,
          request,
          rejected,
          cancelled,
          accepted,
          driverRequests,
        },
        nearestDriver,
      };
    } else {
      let driverRoutes = await driverRouteModel
        .find({
          gender: { $in: [gender, "any"] },
          date: { $lte: schedule.endTime, $gte: schedule.startTime },
          status: { $in: ["active", "started"] },
          availableSeats: { $gte: bookedSeats },
        })
        .populate({
          path: "userId",
          select:
            "firstName lastName totalRating totalRatingCount mobile profileImage gender corporateCode fcmToken",
        })
        .populate({
          path: "vehicleId",
          select: "-registrationCity -registrationProvince",
          populate: { path: "model", select: "model" },
        })
        .populate({
          path: "vehicleId",
          select: "-registrationCity -registrationProvince",
          populate: { path: "color", select: "color" },
        })
        .sort("-createdAt");

      driverRoutes = driverRoutes.filter((item) => {
        return gender === item.userId.gender || item.gender === gender;
      });

      const nearestDriver = await Promise.all(
        driverRoutes
          .filter((driver) => {
            const start = isNear(
              startPoint,
              driver.polyline,
              driver.kmLeverage
            );
            const end = isNear(endPoint, driver.polyline, driver.kmLeverage);
            const corporateCodeValidation =
              schedule.corporateCode == driver.corporateCode;
            return start && end && corporateCodeValidation;
          })
          .map(async (item) => {
            // console.log();
            const fare = await priceCalculator(
              item.vehicleId.minMileage,
              schedule.distance,
              schedule.corporateCode
            );
            const {
              _id,
              startPoint,
              endPoint,
              userId,
              date,
              time,
              isScheduled,
              availableSeats,
              vehicleId,
              gender,
              encodedPolyline,
              request,
              cancelled,
              rejected,
              accepted,
              bounds_ne,
              bounds_sw,
            } = item;
            return {
              _id,
              startPoint,
              endPoint,
              userId,
              date,
              time,
              isScheduled,
              availableSeats,
              vehicleId,
              gender,
              encodedPolyline,
              request,
              cancelled,
              rejected,
              accepted,
              bounds_ne,
              bounds_sw,
              fare,
            };
          })
      );
      //console.log(nearestDriver);
      const {
        _id,
        userId,
        date,
        time,
        vehicleId,
        isScheduled,
        encodedPolyline,
      } = schedule;

      return {
        schedule: {
          _id,
          startPoint,
          endPoint,
          userId,
          date,
          time,
          isScheduled,
          bookedSeats,
          vehicleId,
          gender,
          encodedPolyline,
          request,
          rejected,
          cancelled,
          accepted,
          driverRequests,
        },
        nearestDriver,
      };
    }
    //console.log(driverRoutes);
  },

  newRequest: async (_id, routeId) => {
    console.log("new request");
    const result = await scheduleRideModel.findOneAndUpdate(
      { _id, deleted: false, request: { $nin: [routeId] } },
      { $push: { request: mongoose.Types.ObjectId(routeId) }, softSave: true },
      {
        new: true,
        select: "-polyline -request -rejected -accepted -cancelled",
        populate: {
          path: "userId",
          select:
            "firstName lastName totalRating totalRatingCount profileImage gender",
        },
      }
    );
    if (result) {
      return result;
    }
    return false;
  },

  rejectRequest: async (_id, routeId) => {
    console.log("rejectRequest check");

    const result = await scheduleRideModel
      .findOneAndUpdate(
        {
          _id,
          rejected: { $nin: [routeId] },
        },
        {
          $push: { rejected: mongoose.Types.ObjectId(routeId) },
          // $pull: { request: routeId },
          // $pull: { driverRequests: routeId },
        },
        {
          new: true,
          populate: { path: "driverRequests", select: "userId" },
        }
      )
      .populate({
        path: "userId",
        select: [
          "firstName",
          "lastName",
          "mobile",
          "gender",
          "profileImage",
          "totalRating",
          "totalRatingCount",
          "fcmToken",
          "corporateCode",
        ],
      });

    return result; //await scheduleRideServices.getById(_id);
  },

  acceptedRequest: async (_id, routeId) => {
    console.log("acceptedRequest check");
    const route = await driverRouteModel.findOne({ _id: routeId });
    const result = await scheduleRideModel
      .findOneAndUpdate(
        {
          _id,
          accepted: null,
          deleted: false,
          bookedSeats: { $lte: route.availableSeats },
          rejected: { $nin: [routeId] },
        },
        {
          accepted: mongoose.Types.ObjectId(routeId),
          status: "accepted",
        },
        {
          new: true,
          populate: {
            path: "userId",
            select: ["firstName", "lastName", "fcmToken", "profileImage"],
          },
        }
      )
      .populate("userId");
    return result;
  },

  cancelRequest: async (_id, routeId) => {
    // console.log({ _id, routeId });
    console.log("cancelRequest check");
    const result = await scheduleRideModel.findOneAndUpdate(
      {
        _id,
        accepted: routeId,
      },
      {
        accepted: null,
        status: "pending",
        $push: { cancelled: mongoose.Types.ObjectId(routeId) },
      },
      {
        new: true,
        populate: {
          path: "userId",
          select: ["firstName", "lastName", "fcmToken", "profileImage"],
        },
      }
    );

    return result;
  },

  driverCancelledRequest: async (_id, routeId) => {
    console.log("driver cancelRequest check");
    const result = await scheduleRideModel.findOneAndUpdate(
      {
        _id,
      },
      {
        status: "cancelled",
        // $pull: { request: routeId },
        // $pull: { driverRequests: routeId },
        $push: { cancelled: mongoose.Types.ObjectId(routeId) },
      },
      { new: true, populate: { path: "userId", select: "fcmToken" } }
    );
    return result;
  },
  passengerCancelledInRideRequest: async (_id, routeId) => {
    console.log("here in passenger in ride cancel");
    // console.log(_id);
    const result = await scheduleRideModel.findOneAndUpdate(
      {
        _id,
      },
      {
        status: "cancelled",
        // $pull: { request: routeId },
        // $pull: { driverRequests: routeId },
        $push: { cancelled: mongoose.Types.ObjectId(routeId) },
      },
      { new: true, populate: { path: "userId", select: "fcmToken" } }
    );
    return result;
  },
  active: async (_id) => {
    const result = await scheduleRideModel.findOneAndUpdate(
      {
        _id,
      },
      {
        status: "active",
      },
      { new: true }
    );
    return result;
  },

  validateVerifyPin: async (_id, verifyPin) => {
    const result = await scheduleRideModel.findOneAndUpdate(
      {
        _id,
        verifyPin,
      },
      { verifyPin: null },
      { new: true }
    );
    return result;
  },

  completeRequest: async (_id) => {
    const result = await scheduleRideModel
      .findOneAndUpdate(
        {
          _id,
        },
        {
          status: "completed",
        },
        { new: true }
      )
      .populate({
        path: "userId",
        select: [
          "firstName",
          "lastName",
          "mobile",
          "gender",
          "profileImage",
          "totalRating",
          "totalRatingCount",
          "fcmToken",
        ],
      });
    return result;
  },

  requestPaymentPending: async (_id) => {
    const result = await scheduleRideModel
      .findOneAndUpdate(
        {
          _id,
        },

        {
          status: scheduleRideStatuses.PAYMENTPENDING,
        },
        { new: true }
      )
      .populate({
        path: "userId",
        select: [
          "firstName",
          "lastName",
          "mobile",
          "gender",
          "profileImage",
          "totalRating",
          "totalRatingCount",
          "fcmToken",
        ],
      });
    return result;
  },

  acceptedRequestsCounts: async (userId) => {
    const count = await scheduleRideModel.count({
      userId,
      status: "accepted",
      endTime: { $gte: Date.now() },
    });
    return count;
  },

  upcomingRides: async (userId) => {
    const list = await scheduleRideModel.find({
      userId,
      status: "accepted",
      endTime: { $gte: Date.now() },
    });
    return list;
  },

  upcoming: async (userId) => {
    const result = await scheduleRideModel
      .find(
        { userId, status: "accepted", endTime: { $gte: Date.now() } },
        {
          startPoint: 1,
          endPoint: 1,
          date: 1,
          startTime: 1,
          accepted: 1,
          distance: 1,
        }
      )
      .populate({
        path: "accepted",
        select: "vehicleId",
        populate: { path: "vehicleId", select: "minMileage" },
      })
      .sort("-startTime")
      .limit(1);

    if (result.length === 1) {
      // result[0].date = result[0].startTime;
      const fare = await priceCalculator(
        result[0].accepted.vehicleId.minMileage,
        result[0].distance,
        result[0].corporateCode
      );
      return [{ ...result[0]._doc, fare }];
    } else return [];
  },

  currentActive: async (userId) => {
    const result = await scheduleRideModel
      .find(
        { userId, status: "active" },
        {
          startPoint: 1,
          endPoint: 1,
          date: 1,
          startTime: 1,
          accepted: 1,
          distance: 1,
        }
      )
      .populate({
        path: "accepted",
        select: "vehicleId",
        populate: { path: "vehicleId", select: "minMileage" },
      })
      .sort("-startTime")
      .limit(1);
    if (result.length === 1) {
      const fare = await priceCalculator(
        result[0].accepted.vehicleId.minMileage,
        result[0].distance,
        result[0].corporateCode
      );
      return [{ ...result[0]._doc, fare }];
    } else return [];
  },
  //will reschedule a passenger schedule with new date and new start and end time
  reSchedule: async (_id, date, startTime, endTime) => {
    // console.log({ _id, date, startTime, endTime });
    const oldSchedule = await scheduleRideServices.getById(_id);
    const {
      userId,
      startPoint,
      endPoint,
      distance,
      isScheduled,
      bookedSeats,
      gender,
      duration,
      softSave,
      bounds_sw,
      bounds_ne,
      polyline,
      encodedPolyline,
      corporateCode,
    } = oldSchedule;
    const schedule = new scheduleRideModel({
      userId,
      startPoint,
      endPoint,
      date,
      startTime,
      endTime,
      distance,
      isScheduled,
      bookedSeats,
      gender,
      duration,
      softSave,
      bounds_sw,
      bounds_ne,
      polyline,
      encodedPolyline,
      corporateCode,
    });
    const result = await schedule.save();
    if (result) {
      oldSchedule.reschedule = true;
      await oldSchedule.save();
    }
    return result;
  },

  /*match scheule with driver route will accept driver route time
  available seates and gender and returns all matching pending schedules*/

  pendingSchedules: async (time, seats, gender, userId, flag, routeId) => {
    // console.log({ time, seats, gender, userId, flag, routeId });
    //if flag is true then show all pending and accepted to show passenger on driver side
    if (flag) {
      let list = await scheduleRideModel
        .find(
          {
            userId: { $ne: userId },
            status: { $in: ["pending", "accepted", "active"] },
            startTime: { $lte: time },
            endTime: { $gte: time },
            // bookedSeats: { $lte: seats },
            // gender: { $in: [gender, "any"] },
            accepted: { $in: [null, routeId] },
            deleted: false,
          },
          {
            polyline: 0,
            softSave: 0,
            reschedule: 0,
            rejected: 0,
            cancelled: 0,
            isScheduled: 0,
            driverRequests: 0,
          }
        )
        .populate({
          path: "userId",
          select:
            "firstName lastName gender fcmToken corporateCode totalRatingCount totalRating profileImage",
        })
        .lean();
      //if schedule is accepted by the user then do not apply seats check if schedule is not accepted then apply
      list = list.filter((item) => {
        console.log({
          accepted: item.accepted,
          bookedSeats: item.bookedSeats,
          seats,
          status: item.status,
          deleted: item.deleted,
        });
        // console.log(item);
        if (item.accepted == null && item.bookedSeats > seats) {
          return false;
        }
        return true;
      });
      return list;
    }
    //else show only pending for first time when driver creates its route
    else {
      const list = await scheduleRideModel
        .find(
          {
            userId: { $ne: userId },
            status: "pending",
            startTime: { $lte: time },
            endTime: { $gte: time },
            bookedSeats: { $lte: seats },
            // gender: { $in: [gender, "any"] },
            deleted: false,
          },
          {
            polyline: 0,
            deleted: 0,
            softSave: 0,
            reschedule: 0,
            rejected: 0,
            cancelled: 0,
            isScheduled: 0,
            driverRequests: 0,
          }
        )
        .populate({
          path: "userId",
          select:
            "firstName lastName gender fcmToken corporateCode totalRatingCount totalRating profileImage",
        })
        .lean();
      return list;
    }
  },

  upcomingSchedules: async (userId, skip) => {
    const list = await scheduleRideModel
      .find(
        {
          userId,
          status: "accepted",
          endTime: { $gte: new Date() },
        },
        { startPoint: 1, endPoint: 1, startTime: 1, endTime: 1, date: 1 }
      )
      .skip(skip)
      .limit(5)
      .populate({
        path: "userId",
        select: "firstName lastName totalRating totalRatingCount profileImage",
      });
    return list;
  },

  totalRides: async (userId, skip) => {
    const list = await scheduleRideModel
      .find(
        {
          userId,
          status: { $in: ["completed", "cancelled", "active", "accepted"] },
          // status: { $in: ["completed", "cancelled", "rescheduled", "deleted"] },
        },
        {
          startPoint: 1,
          endPoint: 1,
          startTime: 1,
          endTime: 1,
          date: 1,
          status: 1,
        }
      )
      .skip(skip)
      .limit(5)
      .populate({
        path: "userId",
        select: "firstName lastName totalRating totalRatingCount profileImage",
      })
      .sort({ date: -1, startTime: -1 });
    return list;
  },

  totalRidesForWeb: async (userId) => {
    const list = await scheduleRideModel.find(
      {
        userId,
        status: { $in: ["completed", "cancelled"] },

        // status: { $in: ["completed", "cancelled", "rescheduled", "deleted"] },
      },
      {
        polyline: 0,
      }
    );
    return list;
  },

  completedRides: async (userId, skip) => {
    // console.log({ userId });
    const list = await scheduleRideModel
      .find(
        {
          userId,
          status: { $in: ["completed"] },
          // status: { $in: ["completed", "rescheduled", "deleted"] },
          accepted: { $ne: null },
        },
        { startPoint: 1, endPoint: 1, startTime: 1, endTime: 1, date: 1 }
      )
      .skip(skip)
      .limit(5)
      .populate({
        path: "userId",
        select: "firstName lastName totalRating totalRatingCount profileImage",
      });

    return list;
  },

  cancelledRides: async (userId, skip) => {
    const list = await scheduleRideModel
      .find(
        {
          userId,
          status: "cancelled",
        },
        { startPoint: 1, endPoint: 1, startTime: 1, endTime: 1, date: 1 }
      )
      .skip(skip)
      .limit(5)
      .populate({
        path: "userId",
        select: "firstName lastName totalRating totalRatingCount profileImage",
      });
    console.log(list);
    return list;
  },
  cancelledRidesCount: async (userId) => {
    const count = await scheduleRideModel.count({
      userId,
      status: "cancelled",
    });
    return count;
  },
  completedRidesCount: async (userId) => {
    const count = await scheduleRideModel.count({
      userId,
      status: { $in: ["completed"] },
      // status: { $in: ["completed", "rescheduled", "deleted"] },
      accepted: { $ne: null },
    });
    return count;
  },
  totalRidesCount: async (userId) => {
    const count = await scheduleRideModel.count({
      userId,
      status: { $in: ["completed", "cancelled", "active", "accepted"] },
    });

    return count;
  },

  addFare: async (_id, fare) => {
    const result = await scheduleRideModel.findOneAndUpdate(
      { _id },
      { fare },
      { new: true }
    );
    return result;
  },

  activeRides: async (userId) => {
    // console.log({ userId });
    const list = await scheduleRideModel
      .find(
        {
          userId,
          status: "active",
        },
        {
          polyline: 0,
        }
      )
      .sort("-createdAt");
    return list;
  },

  allActiveRides: async () => {
    // console.log({ userId });
    const list = await scheduleRideModel
      .find(
        {
          status: "active",
        },
        {
          polyline: 0,
        }
      )
      .populate({
        path: "userId",
        select: "firstName lastName gender profileImage mobile",
      })
      .sort("-createdAt");
    return list;
  },

  //
  historyRidesForPanel: async (userId) => {
    const list = await scheduleRideModel
      .find(
        {
          userId,
          status: { $in: ["completed", "cancelled"] },
        },
        {
          polyline: 0,
        }
      )
      .sort("-createdAt");
    return list;
  },

  userOtherRides: async (userId) => {
    const list = await scheduleRideModel.find({
      userId,
      status: { $nin: ["completed", "cancelled", "accepted"] },
    });

    return list;
  },

  allOtherRides: async () => {
    const list = await scheduleRideModel
      .find({
        status: { $in: ["accepted"] },
      })
      .populate({
        path: "userId",
        select: "firstName lastName gender profileImage mobile",
      });

    return list;
  },
  //

  //driver's request
  driverRequest: async (_id, routeId) => {
    // console.log(_id, routeId);
    const result = await scheduleRideModel.findOneAndUpdate(
      {
        _id,
        deleted: false,
        request: { $nin: [routeId] },
        rejected: { $nin: [routeId] },
        driverRequests: { $nin: [routeId] },
        accepted: null,
      },
      {
        $push: { driverRequests: mongoose.Types.ObjectId(routeId) },
        softSave: true,
      },
      {
        new: true,
        select:
          "-polyline -request -rejected -accepted -cancelled -driverRequests",
        populate: {
          path: "userId",
          select:
            "firstName lastName totalRating totalRatingCount profileImage gender fcmToken",
        },
      }
    );
    if (result) {
      return result;
    }
    return false;
  },

  pullDriverRequest: async (_id, routeId) => {
    const result = await scheduleRideModel.findOneAndUpdate(
      {
        _id,
        request: { $nin: [routeId] },
        driverRequests: { $nin: [routeId] },
        accepted: { $ne: null },
      },
      {
        $pull: { driverRequests: mongoose.Types.ObjectId(routeId) },
        softSave: true,
      }
    );
    if (result) {
      return result;
    }
    return false;
  },

  dashboardStat: async (startDate, endDate) => {
    let counts = await scheduleRideModel.aggregate([
      {
        $match: {
          $expr: {
            $and: [{ $gte: ["$date", startDate] }, { $lt: ["$date", endDate] }],
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: ["$status", "$user.gender"],
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

    let todayCounts = await scheduleRideModel.aggregate([
      {
        $match: {
          date: { $lt: upperDateForTodayCount, $gte: lowerDateForTodayCount },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: ["$status", "$user.gender"],
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
    const lineChartData = await scheduleRideModel.aggregate([
      {
        $match: {
          $expr: {
            $and: [{ $gte: ["$date", startDate] }, { $lt: ["$date", endDate] }],
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
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

    const statuses = [
      "pending",
      "accepted",
      "active",
      "completed",
      "cancelled",
    ];
    let countByStatus = [];
    statuses.forEach((status) => {
      const maleCount =
        counts.find((item) => item.status === status && item.gender === "male")
          ?.count || 0;
      const femaleCount =
        counts.find(
          (item) => item.status === status && item.gender === "female"
        )?.count || 0;

      const todayMaleCount =
        todayCounts.find(
          (item) => item.status === status && item.gender === "male"
        )?.count || 0;
      const todayFemaleCount =
        todayCounts.find(
          (item) => item.status === status && item.gender === "female"
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

  wallet: async (_id) => {
    const result = await scheduleRideModel
      .findOne({ _id }, { userId: 1, fare: 1 })
      .populate({ path: "userId", select: "zindigiWallet" });
    return result;
  },
};

module.exports = scheduleRideServices;
