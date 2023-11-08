const express = require("express");
const tutorialRouter = express.Router();
const expressAsyncHandler = require("express-async-handler");
const tutorialServices = require("../services/tutorialServices");
const uploadFile = require("../utils/uploadFile");

tutorialRouter.post(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { title, category, videoLink } = req.body;
    const tutorial = await tutorialServices.addTutorial(
      title,
      category,
      videoLink
    );
    if (tutorial) {
      res
        .status(200)
        .send({ msg: "Tutorial added successfully", data: tutorial });
    } else {
      res.status(400).send({ msg: "Failed to add tutorial" });
    }
  })
);

tutorialRouter.get(
  "/",
  expressAsyncHandler(async (req, res) => {
    const tutorials = await tutorialServices.getTutorials();
    res.status(200).send({ msg: "Tutorials", data: tutorials });
  })
);
tutorialRouter.get(
  "/category?",
  expressAsyncHandler(async (req, res) => {
    const { category } = req.query;
    const tutorials = await tutorialServices.categoryWise(category);
    res.status(200).send({ msg: "Tutorials", data: tutorials });
  })
);
tutorialRouter.get(
  "/getOne",
  expressAsyncHandler(async (req, res) => {
    const { tutorialId } = req.query;
    const tutorial = await tutorialServices.getTutorial(tutorialId);
    if (tutorial) {
      res.status(200).send({ msg: "Tutorail", data: tutorial });
    } else {
      res.status(400).send({ msg: "Tutorial not found" });
    }
  })
);

tutorialRouter.patch(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { tutorialId, title, category, videoLink } = req.body;
    const tutorial = await tutorialServices.updateTutorial(
      tutorialId,
      title,
      category,
      videoLink
    );
    if (tutorial) {
      res
        .status(200)
        .send({ msg: "Tutorial updated successfully", data: tutorial });
    } else {
      res.status(400).send({ msg: "Failed to update tutorial" });
    }
  })
);

tutorialRouter.delete(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { tutorialId } = req.query;
    const tutorial = await tutorialServices.deleteTutorial(tutorialId);
    if (tutorial) {
      res.status(200).send({ msg: "Tutorial deleted successfully" });
    } else {
      res.status(400).send({ msg: "Failed to delete tutorial" });
    }
  })
);

module.exports = tutorialRouter;
