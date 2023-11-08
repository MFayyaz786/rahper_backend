const vehicleMakesModel = require("../models/vehicleMakesModel");

const vehicleMakeServices = {
  addNew: async (make) => {
    const data = new vehicleMakesModel({
      make,
    });
    const result = await data.save();
    return result;
  },
  update: async (_id, make) => {
    const result = await vehicleMakesModel.findOneAndUpdate(
      { _id },
      { make },
      { new: true }
    );
    return result;
  },
  isExist: async (make) => {
    const result = await vehicleMakesModel.findOneAndUpdate(
      { make },
      { isDelete: false },
      { new: true }
    );
    return result;
  },
  list: async () => {
    const list = await vehicleMakesModel.find({ isDelete: false });
    return list;
  },
  delete: async (_id) => {
    const result = await vehicleMakesModel.findOneAndUpdate(
      { _id },
      { isDelete: true },
      { new: true }
    );
    return result;
  },
};

module.exports = vehicleMakeServices;
