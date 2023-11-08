const appVersionModel = require("../models/appVersionModel");

const appVersionServices = {
  addNew: async (iosVersion, androidVersion, name, forceUpdate) => {
    const newVersion = new appVersionModel({
      iosVersion,
      androidVersion,
      name,
      forceUpdate,
    });
    const result = await newVersion.save();
    return result;
  },
  list: async () => {
    const list = await appVersionModel.find({}).sort("-createdAt");
    return list;
  },
  minRequiredVersion: async () => {
    const result = await appVersionModel.find({}).sort("-createdAt").limit(1);
    if (result && result[0]) return result[0];
    return null;
  },
};

module.exports = appVersionServices;
