const express = require("express");
const asyncHandler = require("express-async-handler");
const vehicleModelsServices = require("../services/vehicleModelsServices");
const vehicleModelsRouter = express.Router();
vehicleModelsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const { type, make, model, seatingCapacity } = req.body;
    const isModelExist = await vehicleModelsServices.isExist(
      type,
      make,
      model,
      seatingCapacity
    );
    if (isModelExist) {
      res.status(200).send({
        msg: "Vehicle Model Added",
        data: isModelExist,
      });
    }else{
    const result = await vehicleModelsServices.addNew(
      type,
      make,
      model,
      seatingCapacity
    );
    if (result) {
      res.status(200).send({
        msg: "Vehicle Model Added",
        data: result,
      });
    } else {
      res.status(400).send({
        msg: "Vehicle Model Failed to Added!",
      });
    }
  }
  })
);

vehicleModelsRouter.get(
  "/?",
  asyncHandler(async (req, res) => {
    const { modelId } = req.query;
    const result = await vehicleModelsServices.getById(modelId);
    if (result) {
      res.status(200).send({
        msg: "Vehicle Model",
        data: result,
      });
    } else {
      res.status(400).send({
        msg: "Vehicle Model not found!",
      });
    }
  })
);

vehicleModelsRouter.patch(
  "/",
  asyncHandler(async (req, res) => {
    const { modelId, type, make, model, seatingCapacity } = req.body;
    const result = await vehicleModelsServices.update(
      modelId,
      type,
      make,
      model,
      seatingCapacity
    );
    if (result) {
      res.status(200).send({
        msg: "Vehicle Model Updated",
        data: result,
      });
    } else {
      res.status(400).send({
        msg: "Vehicle Model Failed to Update!",
      });
    }
  })
);
vehicleModelsRouter.post(
  "/list",
  asyncHandler(async (req, res) => {
    const { vehicleType, vehicleMake } = req.body;
    const list = await vehicleModelsServices.listByTypeAndMake(
      vehicleType,
      vehicleMake
    );
    res.status(200).send({ data: list });
  })
);
vehicleModelsRouter.delete(
  "/",
  asyncHandler(async (req, res) => {
    const { modelId } = req.query;
    const result = await vehicleModelsServices.delete(modelId);
    if (result) {
      res.status(200).send({ msg: "Vehicle model deleted successfully" });
    } else {
      res.status(400).send({ msg: "Failed to delete vehicle model" });
    }
  })
);
module.exports = vehicleModelsRouter;
