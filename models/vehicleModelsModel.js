const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    type: {
      type: Schema.Types.ObjectId,
      ref: "VehicleType",
    },
    make: {
      type: Schema.Types.ObjectId,
      ref: "VehicleMake",
    },
    model: {
      type: String,
      lowercase: true,
    },
    seatingCapacity: {
      type: Number,
      default: 1,
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

const vehicleModelsModel = new mongoose.model("VehicleModel", schema);
module.exports = vehicleModelsModel;
