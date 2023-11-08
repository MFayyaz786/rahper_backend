const express = require("express");
const asyncHandler = require("express-async-handler");
const colorServices = require("../services/colorServices");
const colorRouter = express.Router();

//geting all color's list route
colorRouter.get(
  "/list",
  asyncHandler(async (req, res) => {
    const list = await colorServices.list();
    res.status(200).send({ data: list });
  })
);

module.exports = colorRouter;
