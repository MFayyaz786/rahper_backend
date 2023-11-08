const express = require("express");
const asyncHandler = require("express-async-handler");
const historyServices = require("../services/historyServices");
const ratingServices = require("../services/ratingServices");

const ratingRouter = express.Router();

//route to add new rating for ride passenger /driver
ratingRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    var { routeId, scheduleId, rating, text, isDriver, historyId } = req.body;
    if (!historyId && !isDriver) {
      const history = await historyServices.passengerLastHistory(
        routeId,
        scheduleId,
        isDriver
      );
      if (history) historyId = history._id.toString();
    }
    const result = await ratingServices.newRating(
      routeId,
      scheduleId,
      rating,
      text,
      isDriver
    );
    if (result) {
      historyId && (await historyServices.updateOnRating(historyId));
      res.status(200).send({ msg: "Than you for feedback!" });
    } else {
      res.status(400).send({ msg: "Oops feedback not sent" });
    }
  })
);

//geting user's ratings
ratingRouter.post(
  "/userRatings",
  asyncHandler(async (req, res) => {
    const { userId, isDriver } = req.body;
    const result = await ratingServices.userRatings(userId, isDriver);
    res.status(200).send({ msg: "User Ratings", data: result });
  })
);

module.exports = ratingRouter;
