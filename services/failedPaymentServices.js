const { default: mongoose } = require("mongoose");
const FailedPaymentModel = require("../models/failedPaymentModel");

const failedPaymentServices = {
  new: async (schedule, details) => {
    const result = await FailedPaymentModel.create({
      schedule: mongoose.Types.ObjectId(schedule),
      details,
    });
    const count = await FailedPaymentModel.count({ schedule });
    return count;
  },
};

module.exports = failedPaymentServices;
