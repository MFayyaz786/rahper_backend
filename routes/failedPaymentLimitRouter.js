const express = require("express");
const failedPaymentLimitRouter = express.Router();
const expressAsyncHandler = require("express-async-handler");
const failedPaymentLimitServices = require("../services/failedPaymentLimitServices");

failedPaymentLimitRouter.post(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { limit } = req.body;
    const result = await failedPaymentLimitServices.new(limit);
    if (result)
      res.status(200).send({ msg: "Limit created successfully", data: result });
    else res.status(400).send({ msg: "Failed to create limit" });
  })
);

failedPaymentLimitRouter.put(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { limit } = req.body;
    const result = await failedPaymentLimitServices.update(limit);
    if (result)
      res.status(200).send({ msg: "Limit updated successfully", data: result });
    else res.status(400).send({ msg: "Failed to update limit" });
  })
);

failedPaymentLimitRouter.get(
  "/",
  expressAsyncHandler(async (req, res) => {
    const result = await failedPaymentLimitServices.get();
    if (result)
      res
        .status(200)
        .send({ msg: "Limit retrieved successfully", data: result });
    else res.status(400).send({ msg: "Failed to retrieve limit" });
  })
);

module.exports = failedPaymentLimitRouter;
