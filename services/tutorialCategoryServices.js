const tutorialCategoryModel = require("../models/tutorialCategoryModel");

const tutorialCategoryServices = {
  new: async (name) => {
    const result = await tutorialCategoryModel.create({ name });
    return result;
  },
  update: async (_id, name) => {
    const result = await tutorialCategoryModel.findOneAndUpdate(
      { _id },
      { name },
      { new: true }
    );
    return result;
  },

  delete: async (_id) => {
    const result = await tutorialCategoryModel.deleteOne({ _id });
    console.log(result);
    return result;
  },

  all: async () => {
    const list = await tutorialCategoryModel
      .find({ deleted: false }, { _id: 1, name: 1 })
      .sort({ name: 1 });
    return list;
  },

  getById: async (_id) => {
    const result = await tutorialCategoryModel.findOne({ _id });
    return result;
  },
};

module.exports = tutorialCategoryServices;
