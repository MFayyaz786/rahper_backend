const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const appVersionServices = require("../../services/appVersionServices");
const appVersionRouter = express.Router();

appVersionRouter.post(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { iosVersion, androidVersion, name, forceUpdate } = req.body;
    const result = await appVersionServices.addNew(
      iosVersion,
      androidVersion,
      name,
      forceUpdate
    );
    if (result) {
      res.status(200).send({ msg: "New version added!", data: result });
    } else {
      res.status(400).send({ msg: "Some error occur!" });
    }
  })
);

appVersionRouter.get(
  "/list",
  expressAsyncHandler(async (req, res) => {
    const result = await appVersionServices.list();
    res.status(200).send({ msg: "All versions list!", data: result });
  })
);

module.exports = appVersionRouter;
