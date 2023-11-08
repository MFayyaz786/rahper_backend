const networkModel = require("../models/simProviderModel");

const simProviderServices = {
  addNew: async (name, value) => {
    const network = new networkModel({ name, value });
    const result = await network.save();
    return result;
  },
  list: async () => {
    const list = await networkModel.find({});
    return list;
  },
};

module.exports = simProviderServices;
