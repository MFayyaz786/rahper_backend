const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    identifier: {
      type: String,
      required: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
    icon: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const paymentGatewayModel = new mongoose.model("PaymentGateway", schema);

module.exports = paymentGatewayModel;
