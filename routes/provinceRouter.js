const express = require("express");
const provinceRouter = express.Router();
const asyncHandler = require("express-async-handler");
const provinceServices = require("../services/provinceServices");

//route to get provinces list
provinceRouter.get(
  "/list",
  asyncHandler(async (req, res) => {
    const list = await provinceServices.list();
    res.status(200).send({ data: list });
  })
);

module.exports = provinceRouter;
