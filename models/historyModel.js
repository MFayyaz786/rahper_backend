const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    routeId: {
      type: Schema.Types.ObjectId,
      ref: "DriverRoute",
    },
    scheduleId: {
      type: Schema.Types.ObjectId,
      ref: "ScheduleRide",
    },
    isDriver: {
      type: Boolean,
    },
    status: {
      type: String,
    },
    isRated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const historyModel = new mongoose.model("History", schema);
module.exports = historyModel;
