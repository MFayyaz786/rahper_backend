const roleModel = require('../models/roleModel');
const mongoose = require('mongoose');

const roleServices = {
  get: async () => {
    const result = await roleModel
      .find({ role: { $nin: 'Super_Admin' } })
      .populate({
        path: 'permissions',
        select: { _id: 1, name: 1 },
      });
    return result;
  },
  getRoleByID: async (_id) => {
    var _id = mongoose.Types.ObjectId(_id);
    const result = await roleModel.findById({ _id }).populate({
      path: 'permissions',
      select: { _id: 1, name: 1 },
    });
    return result;
  },
  addNew: async (permissions, perm_value, role, description) => {
    const newRole = new roleModel({
      permissions,
      perm_value,
      role,
      description,
    });
    const result = await newRole.save();
    return result;
  },
  update: async (_id, permissions, perm_value, role, description) => {
    permissions = permissions.map((item) => {
      return mongoose.Types.ObjectId(item);
    });
    var _id = mongoose.Types.ObjectId(_id);
    const result = await roleModel.findOneAndUpdate(
      { _id },
      { permissions, role, perm_value, description },
      { new: true }
    );
    return result;
  },

  updatePermissions: async (_id, permissions, perm_value) => {
    permissions = permissions.map((item) => {
      return mongoose.Types.ObjectId(item);
    });
    const result = await roleModel.findOneAndUpdate(
      { _id },
      { permissions, perm_value },
      {
        new: true,
      }
    );
    return result;
  },

  delete: async (_id) => {
    //const filter = { _id: _id };
    var _id = mongoose.Types.ObjectId(_id);
    const result = await roleModel.deleteOne({ _id });
    return result;
  },
  menu: async (_id) => {
    const result = await roleModel.aggregate([
      {
        $match:
          /**
           * query: The query in MQL.
           */
          {
            _id: mongoose.Types.ObjectId(_id),
          },
      },
      {
        $lookup:
          /**
           * from: The target collection.
           * localField: The local join field.
           * foreignField: The target join field.
           * as: The name for the results.
           * pipeline: Optional pipeline to run on the foreign collection.
           * let: Optional variables to use in the pipeline field stages.
           */
          {
            from: 'submodules',
            localField: 'permissions',
            foreignField: '_id',
            as: 'permissions',
          },
      },
      {
        $project:
          /**
           * specifications: The fields to
           *   include or exclude.
           */
          {
            permissions: 1,
          },
      },
      {
        $unwind:
          /**
           * path: Path to the array field.
           * includeArrayIndex: Optional name for index.
           * preserveNullAndEmptyArrays: Optional
           *   toggle to unwind null and empty values.
           */
          {
            path: '$permissions',
            preserveNullAndEmptyArrays: true,
          },
      },
      {
        $sort:
          /**
           * Provide any number of field/order pairs.
           */
          {
            'permissions.orderPosition': 1,
          },
      },
      {
        $lookup:
          /**
           * from: The target collection.
           * localField: The local join field.
           * foreignField: The target join field.
           * as: The name for the results.
           * pipeline: Optional pipeline to run on the foreign collection.
           * let: Optional variables to use in the pipeline field stages.
           */
          {
            from: 'modules',
            localField: 'permissions.module',
            foreignField: '_id',
            as: 'permissions.module',
          },
      },
      {
        $unwind:
          /**
           * path: Path to the array field.
           * includeArrayIndex: Optional name for index.
           * preserveNullAndEmptyArrays: Optional
           *   toggle to unwind null and empty values.
           */
          {
            path: '$permissions.module',
            preserveNullAndEmptyArrays: true,
          },
      },
      {
        $group:
          /**
           * _id: The id of the group.
           * fieldN: The first field name.
           */
          {
            _id: '$permissions.module',
            subModules: {
              $push: '$permissions',
            },
          },
      },
      {
        $sort:
          /**
           * Provide any number of field/order pairs.
           */
          {
            '_id.orderPosition': 1,
          },
      },
      {
        $project:
          /**
           * specifications: The fields to
           *   include or exclude.
           */
          {
            _id: '$_id._id',
            label: '$_id.name',
            icon: '$_id.icon',
            position: '$_id.orderPosition',
            items: {
              $map: {
                input: '$subModules',
                as: 'subModule',
                in: {
                  _id: '$$subModule._id',
                  label: '$$subModule.name',
                  icon: '$$subModule.icon',
                  to: '$$subModule.route',
                  position: '$$subModule.orderPosition',
                  badge: '',
                },
              },
            },
          },
      },
    ]);
    return result;
  },
};

module.exports = roleServices;
