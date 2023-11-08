const { default: mongoose } = require('mongoose');
const subModuleModel = require('../models/subModuleModel');

const subModuleServices = {
  new: async (module, name, route, icon = '', orderPosition) => {
    const result = await subModuleModel.create({
      module: mongoose.Types.ObjectId(module),
      name,
      route,
      icon,
      orderPosition,
    });
    return result;
  },

  getById: async (id) => {
    const result = await subModuleModel.findById(id);
    return result;
  },

  getAll: async () => {
    const result = await subModuleModel.find({});
    return result;
  },

  isExist: async (module, name) => {
    const result = await subModuleModel.findOne({ module, name });
    return result;
  },
  isOrderPositionExist: async (module, orderPosition) => {
    const result = await subModuleModel.findOne({ module, orderPosition });
    return result;
  },

  getOrderPosition: async (module) => {
    const result = await subModuleModel
      .findOne({ module })
      .sort('-orderPosition');
    if (result) {
      return result.orderPosition + 1;
    }
    return 1;
  },
  getByModule: async (module) => {
    const result = await subModuleModel.find({ module });
    return result;
  },

  updateById: async (id, module, name, route, icon, orderPosition) => {
    const result = await subModuleModel.findByIdAndUpdate(
      id,
      { module, name, route, icon, orderPosition },
      { new: true }
    );
    return result;
  },
  activeDeActive: async (_id, active) => {
    const result = await subModuleModel.findOneAndUpdate(
      { _id, active: !active },
      { active },
      { new: true }
    );
    return result;
  },
  delete: async (id) => {
    const result = await subModuleModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    return result;
  },

  //this wil update active status of all submodule in module
  activeDeActiveModule: async (module, active) => {
    const result = await subModuleModel.updateMany(
      { module },
      { active },
      { new: true }
    );

    if (result.matchedCount == 0) {
      return true;
    } else {
      if (result.modifiedCount > 0) {
        return true;
      } else {
        return false;
      }
    }
  },
  deleteModule: async (module) => {
    const result = await subModuleModel.updateMany(
      { module },
      { isDeleted: true },
      { new: true }
    );

    if (result.matchedCount == 0) {
      return true;
    } else {
      if (result.modifiedCount > 0) {
        return true;
      } else {
        return false;
      }
    }
  },
};

module.exports = subModuleServices;
