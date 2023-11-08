const corporateModel = require('../models/corporateModel');

const corporateServices = {
  addNew: async (name, code, address, fee) => {
    const corporate = new corporateModel({ name, code, address, fee });
    const result = await corporate.save();
    return result;
  },
  getAll: async (pageNumber = 0, text) => {
    pageNumber = parseInt(pageNumber) + 1;
    const pageSize = 50; // Specify the number of documents per page
    const skip = (pageNumber - 1) * pageSize;
    if (text) {
      const list = await corporateModel
        .find({ $text: { $search: text } })
        .sort('-createdAt')
        .skip(skip)
        .limit(pageSize);
      return list;
    }
    const list = await corporateModel
      .find({})
      .sort('-createdAt')
      .skip(skip)
      .limit(pageSize);
    return list;
  },
  totalCount: async (text) => {
    if (text) {
      const count = await corporateModel.count({ $text: { $search: text } });
      return count;
    }
    const count = await corporateModel.count({});
    return count;
  },
  updateFee: async (_id, fee) => {
    const result = await corporateModel.findOneAndUpdate(
      { _id },
      { fee },
      { new: true }
    );
    return result;
  },
  updateStatus: async (corporateId, active) => {
    const result = await corporateModel.findOneAndUpdate(
      { corporateId },
      { active: active },
      { new: true }
    );
    return result;
  },
  findByCode: async (code) => {
    const result = await corporateModel.findOne({
      code,
      active: true,
    });
    return result;
  },
};

module.exports = corporateServices;
