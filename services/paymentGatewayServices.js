const paymentGatewayModel = require("../models/paymentGatewayModel");

const paymentGatewayServices = {
  addNew: async (title, identifier, icon) => {
    const paymentGateway = new paymentGatewayModel({
      title,
      identifier,
      icon,
    });
    const result = await paymentGateway.save();
    return result;
  },

  updateGatewayStatus: async (_id, status) => {
    const result = await paymentGatewayModel.findOneAndUpdate(
      { _id },
      { status },
      { new: true }
    );
    return result;
  },

  getActiveGateways: async () => {
    const list = await paymentGatewayModel.find({ status: true });
    return list;
  },
};

module.exports = paymentGatewayServices;

// paymentGatewayServices.addNew("PayFast", "payfast", "images/payfast_logo.png");
