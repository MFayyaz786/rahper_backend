const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const schema = new Schema(
  {
    title: String,
    imageUrl: String,
    buttonText: String,
    redirectUrl: String,
    deleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const adsModel = new mongoose.model("Ad", schema);
module.exports = adsModel;
