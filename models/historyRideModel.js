const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    vehicleId: {
      type: Schema.Types.ObjectId,
    },
    startPoint: {
      type: Number,
      required: true,
    },
    endPoint: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
    },
    time: {
      type: String,
    },
    commuterReview: {
      star: { type: Number },
      feedback: { type: String },
    },
    driverReview: {
      star: { type: Number },
      feedback: { type: String },
    },
  },
  { timestamps: true }
);

const historyRideModel = new mongoose.model("HistoryRide", schema);

module.exports = historyRideModel;
