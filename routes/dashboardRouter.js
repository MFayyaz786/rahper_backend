const express = require("express");
const asyncHandler = require("express-async-handler");
const dashboardServices = require("../services/dashboardServices");
const dashboardRouter = express.Router();

//app dashboard intials get route
dashboardRouter.get(
  "/?",
  asyncHandler(async (req, res) => {
    const { userId } = req.query;
    const isDriver = req.query.isDriver === "true";
    const data = await dashboardServices.initials(userId, isDriver);
    console.log("data: ", data);
    res.status(200).send({ msg: "Dashboard initials!", data });
  })
);
dashboardRouter.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    const data = await dashboardServices.dashboard();
    if (data) {
      res.status(200).send({ msg: "Dashboard", data });
    } else {
      res.status(200).send({ msg: "Dashboard", data });
    }
  })
);

module.exports = dashboardRouter;
