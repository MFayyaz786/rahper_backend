const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const schema = new Schema(
  {
    limit: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

const FailedPaymentLimitModel = mongoose.model("FailedPaymentLimit", schema);

module.exports = FailedPaymentLimitModel;
