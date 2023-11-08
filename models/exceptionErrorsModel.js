const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const schema = new Schema(
  {
    error: Object,
  },
  {
    timestamps: true,
  }
);

const exceptionErrorsModel = new mongoose.model("ExceptionError", schema);
module.exports = exceptionErrorsModel;
