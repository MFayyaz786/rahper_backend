const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    ratingBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    ratingTo: {
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
    rating: {
      type: Number,
    },
    text: {
      type: String,
      default: " ",
    },
    isDriver: {
      type: Boolean,
    },
  },
  {
    timestamps: true,
  }
);

const ratingModel = new mongoose.model("Rating", schema);
module.exports = ratingModel;
