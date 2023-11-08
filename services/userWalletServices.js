const { default: mongoose } = require("mongoose");
const userWalletModel = require("../models/userWalletModel");

const userWalletServices = {
  newWallet: async (userId) => {
    const result = await userWalletModel.create({
      userId: mongoose.Types.ObjectId(userId),
    });
    return result;
  },

  updateWallet: async (userId, amount, source) => {
    const result = await userWalletModel.findOneAndUpdate(
      { userId },
      { $inc: { wallet: amount }, $push: { history: { amount, source } } },
      { new: true }
    );
    return result;
  },
  getWallet: async (userId) => {
    const result = await userWalletModel.findOne({ userId });
    return result;
  },
};

module.exports = userWalletServices;
