const smsLogModel = require('../models/smsLogModel');

const smsLogServices = {
  addLog: async (phoneNumber, dateAndTime, message) => {
    const log = new smsLogModel({
      phoneNumber,
      dateAndTime,
      message,
    });

    return log.save();
  },
  getLogsWithinDateRange: async (startDate, endDate) => {
    endDate.setDate(endDate.getDate() + 1);
    return smsLogModel
      .find({
        dateAndTime: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .sort('-createdAt');
  },
  getLogsCountWithinDateRange: async (startDate, endDate) => {
    return smsLogModel.count({
      dateAndTime: {
        $gte: startDate,
        $lte: endDate,
      },
    });
  },
};

module.exports = smsLogServices;
