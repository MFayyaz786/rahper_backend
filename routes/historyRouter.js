const express = require("express");
const asyncHandler = require("express-async-handler");
const historyServices = require("../services/historyServices");

const historyRouter = express.Router();

//route to make a new history
historyRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const { routeId, scheduleId, isDriver } = req.body;
    const result = await historyServices.newHistory(
      routeId,
      scheduleId,
      isDriver
    );
    if (result) {
      res.status(200).send({ msg: "history created!" });
    } else {
      res.status(400).send({ msg: "history not created!" });
    }
  })
);

//route to get user's history
historyRouter.post(
  "/getuserhistory",
  asyncHandler(async (req, res) => {
    const { userId, isDriver, page } = req.body;
    const result = await historyServices.userHistory(userId, isDriver, page);
    const skip = 5;
    // result = result.slice((page || 0) * skip, skip * (page || 0) + skip);
    res.status(200).send({ msg: "History", data: result });
  })
);

module.exports = historyRouter;
