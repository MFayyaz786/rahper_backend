const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const FAQCategoryModel = new mongoose.model("FAQCategory", schema);
module.exports = FAQCategoryModel;
