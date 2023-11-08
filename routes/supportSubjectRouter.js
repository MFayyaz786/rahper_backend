const express = require("express");
const supportSubjectRouter = express.Router();
const expressAsyncHandler = require("express-async-handler");
const supportServices = require("../services/supportServices");
const supportSubjectServices = require("../services/supportSubjectServices");

supportSubjectRouter.post(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { subject } = req.body;
    if (!subject) {
      res.status(400).send({ msg: "Subject is missing!" });
      return;
    }
    const result = await supportSubjectServices.new(subject);
    if (result) {
      res.status(201).send({ msg: "Subject created!" });
    } else {
      res.status(400).send({ msg: "Subject not created!" });
    }
  })
);

supportSubjectRouter.get(
  "/",
  expressAsyncHandler(async (req, res) => {
    const result = await supportSubjectServices.all();
    res.status(200).send({ msg: "Subjects list!", data: result });
  })
);

supportSubjectRouter.get(
  "/stat",
  expressAsyncHandler(async (req, res) => {
    const result = await supportServices.stat();
    res.status(200).send({ msg: "Subjects list!", data: result });
  })
);

supportSubjectRouter.put(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { subjectId, subject } = req.body;
    if (!subjectId || !subject) {
      res.status(400).send({ msg: "Some fields are missing!" });
      return;
    }
    const result = await supportSubjectServices.update(subjectId, subject);
    if (result) {
      res.status(200).send({ msg: "Subject updated!", data: result });
    } else {
      res.status(400).send({ msg: "Subject not found!" });
    }
  })
);

supportSubjectRouter.delete(
  "/?",
  expressAsyncHandler(async (req, res) => {
    const { subjectId } = req.query;
    if (!subjectId) {
      res.status(400).send({ msg: "Subject id is missing!" });
      return;
    }
    const result = await supportSubjectServices.delete(subjectId);
    if (result) {
      res.status(200).send({ msg: "Subject deleted!", data: result });
    } else {
      res.status(400).send({ msg: "Subject not found!" });
    }
  })
);
module.exports = supportSubjectRouter;
