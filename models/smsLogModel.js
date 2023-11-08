const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    phoneNumber: {
      type: String,
    },
    dateAndTime: {
      type: Date,
      default: new Date(),
    },
    message: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const smsLogModel = new mongoose.model('SMSLog', schema);
module.exports = smsLogModel;
