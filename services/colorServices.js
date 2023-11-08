const colorModel = require("../models/colorModel");

const colorServices = {
  list: async () => {
    const list = await colorModel.find({});
    return list;
  },
};

module.exports = colorServices;
