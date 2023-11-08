const express = require("express");
const cityRouter = express.Router();
const asyncHandler = require("express-async-handler");
const cityServices = require("../services/cityServices");

//route to get cities by province id
cityRouter.post(
  "/listbyprovince",
  asyncHandler(async (req, res) => {
    const { province } = req.body;
    const list = await cityServices.listByProvince(province);
    res.status(200).send({ data: list });
  })
);

module.exports = cityRouter;
