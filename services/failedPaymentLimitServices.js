const FailedPaymentLimitModel = require("../models/failedPaymentLimitmodel");

const failedPaymentLimitServices = {
  new: async (limit) => {
    const count = await FailedPaymentLimitModel.count({});
    if (count > 0) {
      return failedPaymentLimitServices.update(limit);
    }
    const result = await FailedPaymentLimitModel.create({ limit });
    return result;
  },
  update: async (limit) => {
    const result = await FailedPaymentLimitModel.findOneAndUpdate(
      {},
      { limit },
      { new: true }
    );
    return result;
  },
  get: async () => {
    const result = await FailedPaymentLimitModel.findOne({}).lean();
    return result;
  },
};

module.exports = failedPaymentLimitServices;
