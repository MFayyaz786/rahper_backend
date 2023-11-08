const mongoose = require("mongoose");
const ratingModel = require("../models/ratingModel");
const driverRouteServices = require("./driverRouteServices");
const historyServices = require("./historyServices");
const scheduleRideServices = require("./scheduleRideServices");
const userServices = require("./userServices");
const ratingServices = {
  newRating: async (routeId, scheduleId, rating, text, isDriver) => {
    // console.log({ routeId, scheduleId });
    const [schedule, route] = await Promise.all([
      scheduleRideServices.getById(scheduleId),
      driverRouteServices.routeById(routeId),
    ]);

    // console.log({ schedule, route });
    if (isDriver) {
      const newrating = new ratingModel({
        ratingBy: mongoose.Types.ObjectId(route.userId._id.toString()),
        ratingTo: mongoose.Types.ObjectId(schedule.userId._id.toString()),
        routeId: mongoose.Types.ObjectId(routeId),
        scheduleId: mongoose.Types.ObjectId(scheduleId),
        rating,
        isDriver,
        text,
      });
      const [result, addRating] = await Promise.all([
        newrating.save(),
        userServices.addRating(schedule.userId._id.toString(), rating),
      ]);
      return result;
    } else {
      const newrating = new ratingModel({
        ratingBy: mongoose.Types.ObjectId(schedule.userId._id.toString()),
        ratingTo: mongoose.Types.ObjectId(route.userId._id.toString()),
        routeId: mongoose.Types.ObjectId(routeId),
        scheduleId: mongoose.Types.ObjectId(scheduleId),
        rating,
        isDriver,
        text,
      });
      const [result, addRating] = await Promise.all([
        newrating.save(),
        userServices.addRating(route.userId._id.toString(), rating),
      ]);
      return result;
    }
  },
  userRatings: async (ratingTo, isDriver) => {
    const list = await ratingModel
      .find({ ratingTo, isDriver: !isDriver })
      .populate({ path: "ratingBy", select: "firstName lastName profileImage" })
      .populate({ path: "scheduleId", select: "startPoint endPoint" })
      .populate({ path: "routeId", select: "startPoint endPoint" })
      .sort("-createdAt");
    return list;
  },
};

module.exports = ratingServices;
