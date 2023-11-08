const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const schema = new Schema(
  {
    iosVersion: {
      type: String,
      required: true,
    },
    androidVersion: {
      type: String,
      required: true,
    },
    name: {
      type: String,
    },
    forceUpdate: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const appVersionModel = new mongoose.model("AppVersion", schema);
module.exports = appVersionModel;
