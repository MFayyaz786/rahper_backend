const vehicleTypeModel = require("../models/vehicleTypeModel");

const vehicleTypeServices = {
  addNew: async (type) => {
    const data = new vehicleTypeModel({
      type,
    });
    const result = await data.save();
    return result;
  },
  update: async (_id, type) => {
    const result = await vehicleTypeModel.findOneAndUpdate(
      { _id },
      { type },
      { new: true }
    );
    return result;
  },
  list: async () => {
    const list = await vehicleTypeModel.find({ isDelete: false });
    return list;
  },
  isExist: async (type) => {
    const result = await vehicleTypeModel.findOneAndUpdate(
      { type },
      { isDelete: false },
      { new: true }
    );
    return result;
  },
  delete: async (_id) => {
    const result = await vehicleTypeModel.findOneAndUpdate(
      { _id },
      { isDelete: true },
      { new: true }
    );
    return result;
  },
};

module.exports = vehicleTypeServices;
