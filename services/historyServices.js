const { default: mongoose } = require("mongoose");
const historyModel = require("../models/historyModel");
const driverRouteServices = require("./driverRouteServices");
const scheduleRideServices = require("./scheduleRideServices");
const historyServices = {
  newHistory: async (routeId, scheduleId, isDriver, status) => {
    if (isDriver) {
      const route = await driverRouteServices.routeById(routeId);
      const history = new historyModel({
        userId: mongoose.Types.ObjectId(route.userId._id.toString()),
        routeId: mongoose.Types.ObjectId(routeId),
        scheduleId: mongoose.Types.ObjectId(scheduleId),
        isDriver,
        status,
      });
      const result = await history.save();
      return result;
    } else {
      const schedule = await scheduleRideServices.getById(scheduleId);
      const history = new historyModel({
        userId: mongoose.Types.ObjectId(schedule.userId._id.toString()),
        routeId: mongoose.Types.ObjectId(routeId),
        scheduleId: mongoose.Types.ObjectId(scheduleId),
        isDriver,
        status,
      });
      const result = await history.save();
      return result;
    }
  },
  updateOnRating: async (_id) => {
    const result = await historyModel.findOneAndUpdate(
      {
        _id,
      },
      { isRated: true },
      { new: true }
    );
    return result;
  },

  userCompletedRides: async (userId, isDriver) => {
    const list = await historyModel
      .find({ userId, isDriver })
      .populate({
        path: "scheduleId",
        select:
          "-polyline -request -cancelled -rejected -accepted -completed -softSave",
        populate: {
          path: "userId",
          select:
            "firstName lastName totalRating totalRatingCount profileImage gender",
        },
      })
      .populate({
        path: "routeId",
        select:
          "-polyline -request -cancelled -rejected -accepted -completed -lastLocation -vehicleId -kmLeverage -distance -duration -initialSeats -availableSeats -status",
        populate: {
          path: "userId",
          select:
            "firstName lastName totalRating totalRatingCount profileImage gender",
        },
      })
      .sort("-createdAt");
    return list;
  },

  userHistoryCount: async (userId, isDriver) => {
    const count = await historyModel.count({ userId, isDriver });
    return count;
  },
  completedRidesCount: async (userId, isDriver) => {
    const count = await historyModel.count({
      userId,
      isDriver,
      status: "completed",
    });
    return count;
  },
  cancelledRidesCount: async (userId, isDriver) => {
    const count = await historyModel.count({
      userId,
      isDriver,
      status: "cancelled",
    });
    return count;
  },
  userHistory: async (userId, isDriver, page) => {
    const limit = 5;

    const skip = (page || 0) * limit;

    if (isDriver) {
      const list = await driverRouteServices.history(userId, skip, limit);
      return list;
    } else {
      let list = await historyModel
        .find({ userId, isDriver })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "scheduleId",
          select:
            "-polyline -request -cancelled -rejected -accepted -completed -softSave",
          populate: {
            path: "userId",
            select:
              "firstName lastName totalRating totalRatingCount profileImage gender",
          },
        })
        .populate({
          path: "routeId",
          select:
            "-polyline -request -cancelled -rejected -accepted -completed -lastLocation -kmLeverage -initialSeats -availableSeats -status",
          populate: {
            path: "userId",
            select:
              "firstName lastName totalRating totalRatingCount profileImage gender",
          },
        })
        .sort("-createdAt")
        .lean();
      list = list.filter((item) => {
        return item.scheduleId !== null;
      });
      return list;
    }
  },
  passengerLastHistory: async (routeId, scheduleId, isDriver) => {
    const result = await historyModel
      .findOne({ routeId, scheduleId, isDriver, isRated: false })
      .sort("-createdAt");
    return result;
  },
};

module.exports = historyServices;
