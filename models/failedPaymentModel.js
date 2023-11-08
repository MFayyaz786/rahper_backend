const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    schedule: { type: Schema.Types.ObjectId, ref: "ScheduleRide" },
    method: {
      type: String,
      default: "zindigi",
    },
    details: Object,
  },
  { timestamps: true }
);

const FailedPaymentModel = new mongoose.model("FailedPayment", schema);

module.exports = FailedPaymentModel;
