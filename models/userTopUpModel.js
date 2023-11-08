const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    userId: { type: mongoose.Types.ObjectId, ref: "User" },
    details: { type: Object },
    method: { type: String },
  },
  { timestamps: true }
);

const userTopUpModel = new mongoose.model("TopUp", schema);

module.exports = userTopUpModel;
