const express = require("express");
const locatoinRouter = express.Router();
const asyncHandler = require("express-async-handler");
const driverRouteServices = require("../services/driverRouteServices");
const { isNear } = require("../services/locationServices");
const scheduleRideServices = require("../services/scheduleRideServices");

locatoinRouter.post(
  "/nearestpassengers",
  asyncHandler(async (req, res) => {
    const { routeId, isScheduled } = req.body;
    const route = await driverRouteServices.routeById(routeId);
    //console.log(route);
    const { availableSeats, gender, polyline } = route;
    const passengerSchedules =
      await scheduleRideServices.getSchedulesWithFilter(
        availableSeats,
        gender,
        isScheduled
      );
    const nearestpassengers = passengerSchedules
      .filter((passenger) => {
        const start = isNear(passenger.startPoint, polyline);
        const end = isNear(passenger.endPoint, polyline);
        return start && end;
      })
      .map((passenger) => {
        return {
          _id: passenger._id,
          startPoint: passenger.startPoint,
          endPoint: passenger.endPoint,
          bookedSeats: passenger.bookedSeats,
          user: passenger.userId,
        };
      });

    res.status(200).send({ data: nearestpassengers });
  })
);

module.exports = locatoinRouter;
