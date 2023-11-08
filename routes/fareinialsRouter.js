const express = require("express");
const asyncHandler = require("express-async-handler");
const fareIntialsServices = require("../services/fareIntialsServices");
const fareInitialRouter = express.Router();

//route for adding new ad
fareInitialRouter.patch(
  "/",
  asyncHandler(async (req, res) => {
    const {
      initialFareId,
      minCarCharges,
      minBikeCharges,
      carMaintenance,
      bikeMaintenance,
      petrol,
      deisel,
      gasoline,
    } = req.body;
    const result = await fareIntialsServices.update(
      initialFareId,
      minCarCharges,
      minBikeCharges,
      carMaintenance,
      bikeMaintenance,
      petrol,
      deisel,
      gasoline
    );
    if (result) {
      res.status(200).send({ msg: "FareInitial update", data: result });
    } else {
      res.status(400).send({ msg: "FareInitial not update", data: result });
    }
  })
);

//route to gel all posted ads
fareInitialRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const result = await fareIntialsServices.getCurrent();
    res.status(200).send({ msg: "FareInitial", data: result });
  })
);
module.exports = fareInitialRouter;
