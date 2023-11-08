const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

const tutorialCategoryModel = new mongoose.model("TutorialCategory", schema);
module.exports = tutorialCategoryModel;
