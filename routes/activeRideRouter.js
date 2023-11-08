const express = require("express");
const asyncHandler = require("express-async-handler");
const activeRideServices = require("../services/activeRideServices");

const acitveRideRouter = express.Router();

//route endpoint to create a new active ride
acitveRideRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const { routeId, scheduleRideId, startPoint, endPoint, fare } = req.body;

    const newRide = await activeRideServices.newRide(
      routeId
      // scheduleRideId,
      // startPoint,
      // endPoint,
      // fare
    );
    if (newRide) {
      res.status(201).send({ msg: "New active ride", data: newRide });
    } else {
      res.status(400).send({ msg: "Ride already active" });
    }
  })
);

module.exports = acitveRideRouter;
