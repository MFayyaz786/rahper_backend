const supportSubjectModel = require("../models/supportSubjectModel");

const supportSubjectServices = {
  new: async (subject) => {
    const result = await supportSubjectModel.create({ subject });
    return result;
  },

  all: async () => {
    const result = await supportSubjectModel.find({ deleted: false });
    return result;
  },

  update: async (_id, subject) => {
    const result = await supportSubjectModel.findOneAndUpdate(
      { _id },
      { subject },
      { new: true }
    );
    return result;
  },

  delete: async (_id) => {
    const result = await supportSubjectModel.findOneAndUpdate(
      { _id },
      { deleted: true },
      { new: true }
    );
    return result;
  },
};

module.exports = supportSubjectServices;
