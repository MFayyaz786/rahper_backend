const { default: mongoose } = require("mongoose");
const vehicleModelsModel = require("../models/vehicleModelsModel");

const vehicleModelsServices = {
  addNew: async (type, make, model, seatingCapacity) => {
    const data = new vehicleModelsModel({
      type: mongoose.Types.ObjectId(type),
      make: mongoose.Types.ObjectId(make),
      model,
      seatingCapacity,
    });
    const result = await data.save();
    return result;
  },
  update: async (_id, type, make, model, seatingCapacity) => {
    const data = await vehicleModelsModel.findOneAndUpdate(
      { _id },
      {
        type: mongoose.Types.ObjectId(type),
        make: mongoose.Types.ObjectId(make),
        model,
        seatingCapacity,
      },
      { new: true }
    );

    return data;
  },
  listByTypeAndMake: async (type, make) => {
    const list = await vehicleModelsModel.find(
      { type, make, isDelete: false },
      { model: 1, seatingCapacity: 1 }
    );
    return list;
  },

  getById: async (_id) => {
    const data = await vehicleModelsModel.findOne({ _id });
    return data;
  },
  isExist: async (type, make, model, seatingCapacity) => {
    const result = await vehicleModelsModel.findOneAndUpdate(
      { model },
      {
        type: mongoose.Types.ObjectId(type),
        make: mongoose.Types.ObjectId(make),
        seatingCapacity,
        isDelete: false,
      },
      { new: true }
    );
    return result;
  },
  delete: async (_id) => {
    const result = await vehicleModelsModel.findOneAndUpdate(
      { _id },
      { isDelete: true },
      { new: true }
    );
    return result;
  },
};

module.exports = vehicleModelsServices;
