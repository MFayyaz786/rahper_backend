const mongoose = require("mongoose");
const paymentStatuses = require("../utils/paymentStatuses");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    ride: {
      type: Schema.Types.ObjectId,
      ref: "ActiveRide",
    },
    schedule: {
      type: Schema.Types.ObjectId,
      ref: "ScheduleRide",
    },
    method: {
      type: String,
      default: "zindigi",
    },
    paymentDetails: {
      type: Object,
    },
    status: {
      type: String,
      default: paymentStatuses.UNPAID,
    },
  },
  {
    timestamps: true,
  }
);

const paymentModel = new mongoose.model("Payment", schema);

module.exports = paymentModel;
