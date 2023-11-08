const cityModel = require("../models/cityModel");

const cityServices = {
  listByProvince: async (province) => {
    const list = await cityModel
      .find({ province }, { city: 1 })
      .sort({ city: 1 });
    return list;
  },
};

module.exports = cityServices;
