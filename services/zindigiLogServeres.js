const zindigiLogModel = require("../models/zindigiLogModel");

const zindigiLogServices = {
  new: async (path, request) => {
    const result = await zindigiLogModel.create({ path, request });
    return result;
  },
  updateResponse: async (_id, response) => {
    const result = await zindigiLogModel.findOneAndUpdate(
      { _id },
      { response },
      { new: true }
    );
    return result;
  },
};
module.exports = zindigiLogServices;
