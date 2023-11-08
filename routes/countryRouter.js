const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const countryServices = require("../services/countryServices");

const uploadFile = require("../utils/uploadFile");
const countryRouter = express.Router();

countryRouter.post(
  "/",
  expressAsyncHandler(async (req, res) => {
    let { name, icon, countryCode, isoCode } = req.body;
    if (!name || !icon || !countryCode || !isoCode) {
      res.status(400).send({
        msg: "Some fields are missing must provide name, icon, countryCode, isoCode",
      });
    } else {
      icon = await uploadFile(icon);
      if (icon) {
        const result = await countryServices.addNew(
          name,
          icon,
          countryCode,
          isoCode
        );
        if (result) {
          res.status(200).send({ msg: "Country Added.", data: result });
        } else {
          res.status(400).send({ msg: "Failed to add country!" });
        }
      } else {
        res.status(400).send({ msg: "Icon must be in base64!" });
      }
    }
  })
);

countryRouter.get(
  "/list",
  expressAsyncHandler(async (req, res) => {
    const result = await countryServices.list();
    res.status(200).send({ msg: "Countries List", data: result });
  })
);

module.exports = countryRouter;
