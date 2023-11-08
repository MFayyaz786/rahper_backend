const { default: mongoose } = require("mongoose");
const userTopUpModel = require("../models/userTopUpModel.js");

const userTopUpServices = {
  new: async (userId, details, method) => {
    const result = await userTopUpModel.create({
      userId: mongoose.Types.ObjectId(userId),
      details,
      method,
    });
    return result;
  },
};

module.exports = userTopUpServices;
