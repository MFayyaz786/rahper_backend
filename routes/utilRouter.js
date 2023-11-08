const express = require("express");
const utilRouter = express.Router();
const asyncHandler = require("express-async-handler");
const colorServices = require("../services/colorServices");
const provinceServices = require("../services/provinceServices");
const vehicleMakeServices = require("../services/vehicleMakeServices");
const vehicleTypeServices = require("../services/vehicleTypeServices");

//register util get api
utilRouter.get(
  "/registerutil",
  asyncHandler(async (req, res) => {
    const [vehicleTypes, vehicleMakes, vehicleColors, provinces] =
      await Promise.all([
        vehicleTypeServices.list(),
        vehicleMakeServices.list(),
        colorServices.list(),
        provinceServices.list(),
      ]);
    res
      .status(200)
      .send({ vehicleTypes, vehicleMakes, vehicleColors, provinces });
  })
);

module.exports = utilRouter;
