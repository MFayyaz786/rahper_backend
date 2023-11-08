const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const FAQServices = require("../services/FAQServices");
const FAQRouter = express.Router();

FAQRouter.post(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { question, answer, category } = req.body;
    if (!question || !answer || !category) {
      res.status(400).send({ msg: "Some field is missing!" });
      return;
    }
    const result = await FAQServices.new(question, answer, category);
    if (result) {
      res.status(201).send({ msg: "FAQ created!", data: result });
    } else {
      res.status(400).send({ msg: "FAQ not created!" });
    }
  })
);

FAQRouter.put(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { FAQId, question, answer, category } = req.body;
    if (!FAQId || !question || !answer || !category) {
      res.status(400).send({ msg: "Field is missing!" });
      return;
    }
    const result = await FAQServices.update(FAQId, question, answer, category);
    if (result) {
      res.status(200).send({ msg: "FAQ updated!", data: result });
    } else {
      res.status(400).send({ msg: "FAQ not updated!" });
    }
  })
);

FAQRouter.get(
  "/",
  expressAsyncHandler(async (req, res) => {
    const result = await FAQServices.all();
    res.status(200).send({ msg: "FAQ list!", data: result });
  })
);

FAQRouter.delete(
  "/?",
  expressAsyncHandler(async (req, res) => {
    const { FAQId } = req.query;
    if (!FAQId) {
      res.status(400).send({ msg: "FAQId is missing!" });
      return;
    }
    const result = await FAQServices.delete(FAQId);
    if (result) {
      res.status(200).send({ msg: "FAQ deleted!" });
    } else {
      res.status(400).send({ msg: "FAQ not deleted!" });
    }
  })
);

module.exports = FAQRouter;
