const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    make: {
      type: String,
      lowercase: true,
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const vehicleMakesModel = new mongoose.model("VehicleMake", schema);
module.exports = vehicleMakesModel;
