const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const simProviderServices = require("../services/simProviderServices");

const uploadFile = require("../utils/uploadFile");
const simProviderRouter = express.Router();

simProviderRouter.post(
  "/",
  expressAsyncHandler(async (req, res) => {
    let { name, value } = req.body;
    if (!name || !value) {
      res.status(400).send({ msg: "Please provide name, icon and value!" });
    } else {
      const result = await simProviderServices.addNew(name, value);
      if (result) {
        res.status(200).send({ msg: "SIM provider added!" });
      } else {
        res.status(400).send({ msg: "SIM provider not added!" });
      }
    }
  })
);

simProviderRouter.get(
  "/list",
  expressAsyncHandler(async (req, res) => {
    const result = await simProviderServices.list();
    res.status(200).send({ msg: "list", data: result });
  })
);

module.exports = simProviderRouter;
