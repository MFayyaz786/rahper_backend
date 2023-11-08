const express = require("express");
const vehicleTypeRouter = express.Router();
const asyncHandler = require("express-async-handler");
const vehicleTypeServices = require("../services/vehicleTypeServices");
vehicleTypeRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const { type } = req.body;
    const isTypeExist = await vehicleTypeServices.isExist(type);
    if (isTypeExist) {
      res.status(200).send({
        msg: "Vehicle Type Added",
        data: isTypeExist,
      });
    } else {
      const result = await vehicleTypeServices.addNew(type);
      if (result) {
        res.status(200).send({
          msg: "Vehicle Type Added",
          data: result,
        });
      } else {
        res.status(400).send({
          msg: "Vehicle Type Failed to Added!",
        });
      }
    }
  })
);
vehicleTypeRouter.patch(
  "/",
  asyncHandler(async (req, res) => {
    const { typeId, type } = req.body;
    const result = await vehicleTypeServices.update(typeId, type);
    if (result) {
      res.status(200).send({
        msg: "Vehicle Type Updated",
        data: result,
      });
    } else {
      res.status(400).send({
        msg: "Vehicle Type Failed to Update!",
      });
    }
  })
);
vehicleTypeRouter.get(
  "/list",
  asyncHandler(async (req, res) => {
    const list = await vehicleTypeServices.list();
    res.status(200).send({ data: list });
  })
);
vehicleTypeRouter.delete(
  "/",
  asyncHandler(async (req, res) => {
    const { typeId } = req.query;
    const result = await vehicleTypeServices.delete(typeId);
    if (result) {
      res.status(200).send({ msg: "Vehicle type deleted successfully" });
    } else {
      res.status(400).send({ msg: "Failed to delete vehicle type" });
    }
  })
);
module.exports = vehicleTypeRouter;
