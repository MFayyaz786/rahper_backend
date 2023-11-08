const moduleModel = require('../models/moduleModel');

const moduleServices = {
  new: async (name, route = '', icon = '', orderPosition) => {
    const result = await moduleModel.create({
      name,
      route,
      icon,
      orderPosition,
    });
    return result;
  },

  isExist: async (name) => {
    const result = await moduleModel.findOne({ name });
    return result;
  },
  getById: async (id) => {
    const result = await moduleModel.findById(id);
    return result;
  },

  isOrderPositionExist: async (orderPosition) => {
    const result = await moduleModel.findOne({ orderPosition });
    return result;
  },

  getOrderPosition: async () => {
    const result = await moduleModel.findOne({}).sort('-orderPosition');
    if (result) {
      return result.orderPosition + 1;
    }
    return 1;
  },

  getAll: async (list) => {
    if (list) {
      const result = await moduleModel.aggregate([
        {
          $match: {
            isDeleted: false,
          },
        },
        {
          $lookup: {
            from: 'submodules',
            localField: '_id',
            foreignField: 'module',
            as: 'submodule',
          },
        },
      ]);
      return result;
    } else {
      const result = await moduleModel.aggregate([
        {
          $match: {
            isDeleted: false,
            active: true,
          },
        },
        {
          $lookup: {
            from: 'submodules',
            localField: '_id',
            foreignField: 'module',
            as: 'submodule',
          },
        },
      ]);
      return result;
    }
  },

  updateById: async (id, name, route, icon, orderPosition) => {
    const result = await moduleModel.findByIdAndUpdate(
      id,
      { name, route, icon, orderPosition },
      { new: true }
    );
    return result;
  },

  activeDeActive: async (_id, active) => {
    const result = await moduleModel.findOneAndUpdate(
      { _id, active: !active },
      { active },
      { new: true }
    );
    return result;
  },

  delete: async (id) => {
    const result = await moduleModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    return result;
  },
};

module.exports = moduleServices;
