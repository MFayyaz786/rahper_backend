const authIdModel = require("../models/authIdModel");

const authIdServices = {
  add: async (userId, uuid) => {
    let result = await authIdModel.findOneAndUpdate(
      { userId },
      { uuid },
      { new: true }
    );
    if (result) {
      return result;
    }
    result = await authIdModel.create({ userId, uuid });
    return result;
  },

  findByUUID: async (uuid) => {
    const result = await authIdModel.findOne({ uuid });
    return result;
  },
};

module.exports = authIdServices;
