const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const paymentGatewayServices = require("../../services/paymentGatewayServices");
const uploadFile = require("../../utils/uploadFile");
const paymentGatewayRouter = express.Router();

paymentGatewayRouter.post(
  "/",
  expressAsyncHandler(async (req, res) => {
    let { title, identifier, icon } = req.body;
    if (!title || !identifier || !icon) {
      res.status(400).send({
        msg: "Must provide these fields title, identifier, icon",
      });
    } else {
      icon = await uploadFile(icon);
      if (icon) {
        const result = await paymentGatewayServices.addNew(
          title,
          identifier,
          icon
        );
        if (result) {
          res.status(200).send({ msg: "Payment gateway added!" });
        } else {
          res.status(400).send({ msg: "Failed to add gateway!" });
        }
      }
    }
  })
);

paymentGatewayRouter.put(
  "/",
  expressAsyncHandler(async (req, res) => {
    let { gatewayId, status } = req.body;
    if (!gatewayId || !status) {
      res.status(400).send({
        msg: "Must provide these fields gatewayId and status",
      });
    } else {
      icon = await uploadFile(icon);
      if (icon) {
        const result = await paymentGatewayServices.addNew(
          title,
          identifier,
          icon
        );
        if (result) {
          res.status(200).send({ msg: "Payment gateway added!" });
        } else {
          res.status(400).send({ msg: "Failed to add gateway!" });
        }
      }
    }
  })
);

paymentGatewayRouter.get(
  "/getPaymentGatewayList",
  expressAsyncHandler(async (req, res) => {
    const result = await paymentGatewayServices.getActiveGateways();
    res.status(200).send({ msg: "Payment methods", data: result });
  })
);

module.exports = paymentGatewayRouter;
