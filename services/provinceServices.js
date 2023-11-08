const provinceModel = require("../models/provinceModel");

const provinceServices = {
  list: async () => {
    const list = await provinceModel.find({});
    return list;
  },
};

module.exports = provinceServices;
