const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    name: {
      type: String,
      unique: true,
      uppercase: true,
    },
    code: {
      type: String,
      unique: true,
      uppercase: true,
    },
    address: {
      type: String,
      allowNull: false,
    },
    fee: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);
const corporateModel = new mongoose.model("Corporate", schema);
module.exports = corporateModel;
