const FAQCategoryModel = require("../models/FAQCategoryModel");

const FAQCategoryServices = {
  new: async (name) => {
    const result = await FAQCategoryModel.create({ name });
    return result;
  },
  update: async (_id, name) => {
    const result = await FAQCategoryModel.findOneAndUpdate(
      { _id },
      { name },
      { new: true }
    );
    return result;
  },

  delete: async (_id) => {
    const result = await FAQCategoryModel.findOneAndUpdate(
      { _id },
      { deleted: true },
      { new: true }
    );
    return result;
  },

  all: async () => {
    const list = await FAQCategoryModel.find(
      { deleted: false },
      { _id: 1, name: 1 }
    ).sort({ name: 1 });
    return list;
  },

  getById: async (_id) => {
    const result = await FAQCategoryModel.findOne({ _id });
    return result;
  },
};

module.exports = FAQCategoryServices;
