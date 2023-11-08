const countryModel = require("../models/countryModel");

const countryServices = {
  addNew: async (name, icon, countryCode, isoCode) => {
    const country = new countryModel({ name, icon, countryCode, isoCode });
    const result = await country.save();
    return result;
  },
  list: async () => {
    const list = await countryModel.find({}).sort("-name");
    return list;
  },
};

module.exports = countryServices;
