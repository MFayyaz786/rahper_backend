const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tutorialSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    category: { type: Schema.Types.ObjectId, ref: "TutorialCategory" },
    videoLink: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const tutorialModel = mongoose.model("Tutorial", tutorialSchema);

module.exports = tutorialModel;
