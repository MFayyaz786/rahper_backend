const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    type: {
      type: String,
      lowercase: true,
      required: true,
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

const vehicleTypeModel = new mongoose.model("VehicleType", schema);
module.exports = vehicleTypeModel;
