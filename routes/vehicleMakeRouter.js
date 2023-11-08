const express = require("express");
const asyncHandler = require("express-async-handler");
const vehicleMakeServices = require("../services/vehicleMakeServices");
const vehicleMakeRouter = express.Router();
vehicleMakeRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const { make } = req.body;
    const isMakeExist = await vehicleMakeServices.isExist(make);
    if (isMakeExist) {
      res.status(200).send({
        msg: "Vehicle Make Added",
        data: isMakeExist,
      });
    } else {
      const result = await vehicleMakeServices.addNew(make);
      if (result) {
        res.status(200).send({
          msg: "Vehicle Make Added",
          data: result,
        });
      } else {
        res.status(400).send({
          msg: "Vehicle Make Failed to Added!",
        });
      }
    }
  })
);
vehicleMakeRouter.patch(
  "/",
  asyncHandler(async (req, res) => {
    const { makeId, make } = req.body;
    const result = await vehicleMakeServices.update(makeId, make);
    if (result) {
      res.status(200).send({
        msg: "Vehicle Make updated",
        data: result,
      });
    } else {
      res.status(400).send({
        msg: "Vehicle Make Failed to update!",
      });
    }
  })
);
vehicleMakeRouter.get(
  "/list",
  asyncHandler(async (req, res) => {
    const list = await vehicleMakeServices.list();
    res.status(200).send({ data: list });
  })
);
vehicleMakeRouter.delete(
  "/",
  asyncHandler(async (req, res) => {
    const { makeId } = req.query;
    const result = await vehicleMakeServices.delete(makeId);
    if (result) {
      res.status(200).send({ msg: "Vehicle make deleted successfully" });
    } else {
      res.status(400).send({ msg: "Failed to delete vehicle make" });
    }
  })
);

module.exports = vehicleMakeRouter;
