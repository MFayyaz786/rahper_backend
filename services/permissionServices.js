const { default: mongoose } = require('mongoose');
const permissionModel = require('../models/permissionModel');
const permissionServices = {
  get: async () => {
    const result = await permissionModel.find({});
    return result;
  },
  getSubModulePermission: async (roleId, subModule) => {
    const result = await permissionModel.findOne({ roleId, subModule });
    return result;
  },
  addNew: async (roleId, subModuleId, permissions) => {
    const permission = new permissionModel({
      roleId,
      subModule: subModuleId,
      permissions,
    });
    const result = await permission.save();
    return result;
  },
  update: async (roleId, subModuleId, permissions) => {
    const result = await permissionModel.findOneAndUpdate(
      { roleId, subModule: subModuleId },
      { permissions },
      { new: true }
    );
    return result;
  },
  delete: async (_id) => {
    const result = await permissionModel.findByIdAndDelete(_id);
    return result;
  },
  getByRole: async (roleId) => {
    const result = await permissionModel.aggregate([
      {
        $match: {
          roleId: mongoose.Types.ObjectId(roleId),
        },
      },
      {
        $lookup: {
          from: 'submodules',
          localField: 'subModule',
          foreignField: '_id',
          as: 'subModule',
        },
      },
      {
        $unwind: {
          path: '$subModule',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          subModuleId: '$subModule._id',
          path: '$subModule.route',
          permissions: '$permissions',
        },
      },
    ]);
    return result;
  },
};

module.exports = permissionServices;
