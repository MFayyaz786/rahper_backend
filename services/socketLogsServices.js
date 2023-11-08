const socketLogsModel = require("../models/socketLogsModel");

const socketLogsServices = {
  addNew: async (eventName, data) => {
    const newLog = new socketLogsModel({ eventName, data });
    const result = await newLog.save();
    return result;
  },
  addResponse: async (_id, response) => {
    await findOneAndUpdate({ _id }, { response }, { new: true });
  },
};

module.exports = socketLogsServices;
