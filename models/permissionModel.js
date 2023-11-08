const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const schema = new Schema(
  {
    roleId: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
    },
    subModule: {
      type: Schema.Types.ObjectId,
      ref: 'SubModule',
    },
    permissions: {
      view: { type: Boolean, default: false },
      add: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

const permissionModel = new mongoose.model('Permission', schema);
module.exports = permissionModel;
