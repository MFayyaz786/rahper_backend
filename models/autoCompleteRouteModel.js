const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    route: {
      type: mongoose.Types.ObjectId,
      ref: 'DriverRoute',
    },
    cronJob: {
      type: Object,
    },
  },
  { timestamps: true }
);

const autoCompletedRouteModel = new mongoose.model('AutoCompleteRoute', schema);
module.exports = autoCompletedRouteModel;
