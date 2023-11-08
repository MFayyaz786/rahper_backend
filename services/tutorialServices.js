const tutorialModel = require("../models/tutorialModel");
const uploadFile = require("../utils/uploadFile");
const mongoose = require("mongoose");
const tutorialServices = {
  addTutorial: async (title, category, videoLink) => {
    const tutorial = new tutorialModel({
      title,
      category: mongoose.Types.ObjectId(category),
      videoLink,
    });
    const result = await tutorial.save();
    console.log(result);
    return result;
  },
  getTutorials: async () => {
    const tutorials = await tutorialModel
      .find({}, { createdAt: 0, updatedAt: 0, __v: 0 })
      .populate({
        path: "category",
        select: { name: 1 },
      });
    return tutorials;
  },
  categoryWise: async (category) => {
    const tutorials = await tutorialModel
      .find(
        { category: { $in: category } },
        { __v: 0, createdAt: 0, updatedAt: 0 }
      )
      .populate({
        path: "category",
        select: { name: 1 },
      });
    return tutorials;
  },
  getTutorial: async (id) => {
    const tutorial = await tutorialModel
      .findById({ _id: id }, { createdAt: 0, updatedAt: 0, __v: 0 })
      .populate({
        path: "category",
        select: { name: 1 },
      });
    return tutorial;
  },
  updateTutorial: async (tutorialId, title, category, videoLink) => {
    let tutorial = await tutorialModel.findByIdAndUpdate(
      { _id: tutorialId },
      {
        title,
        category: mongoose.Types.ObjectId(category),
        videoLink,
      }
    );

    return tutorial;
  },
  deleteTutorial: async (id) => {
    const tutorial = await tutorialModel.findByIdAndDelete(id);
    return tutorial;
  },
};

module.exports = tutorialServices;
