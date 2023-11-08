const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    routeId: {
      type: Schema.Types.ObjectId,
      ref: "DriverRoute",
      required: true,
    },
    passengers: [
      {
        passenger: {
          type: Schema.Types.ObjectId,
          ref: "ScheduleRide",
        },
        status: {
          type: String,
          default: "pending",
        },
        fare: {
          type: Number,
        },
        sortDistance: {
          type: Number,
        },
        verifyPin: {
          type: String,
          default: null,
        },
        count: {
          type: Number,
          default: 0,
        },
      },
    ],
    status: {
      type: String,
      default: "started",
    },
  },
  { timestamps: true }
);

const activeRideModel = new mongoose.model("ActiveRide", schema);

module.exports = activeRideModel;
