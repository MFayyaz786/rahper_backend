const { default: mongoose } = require("mongoose");
const FAQModel = require("../models/FAQModel");

const FAQServices = {
  new: async (question, answer, category) => {
    const result = await FAQModel.create({
      question,
      answer,
      category: mongoose.Types.ObjectId(category),
    });
    return result;
  },
  update: async (_id, question, answer, category) => {
    const result = await FAQModel.findOneAndUpdate(
      { _id },
      {
        question,
        answer,
        category: mongoose.Types.ObjectId(category),
      },
      { new: true }
    );
    return result;
  },
  all: async () => {
    const list = await FAQModel.aggregate([
      {
        $group: {
          _id: "$category",
          FAQs: {
            $addToSet: {
              _id: "$_id",
              question: "$question",
              answer: "$answer",
            },
          },
        },
      },
      {
        $lookup: {
          from: "faqcategories",
          localField: "_id",
          foreignField: "_id",
          as: "result",
        },
      },
      {
        $unwind: {
          path: "$result",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          categoryId: "$_id",
          categoryName: "$result.name",
          FAQs: "$FAQs",
        },
      },
      {
        $sort: {
          categoryName: -1,
        },
      },
    ]);
    return list;
  },
  delete: async (_id) => {
    const result = await FAQModel.findOneAndDelete({ _id });
    return result;
  },

  categoryFAQsCount: async (category) => {
    const count = await FAQModel.count({ category });
    return count;
  },
};

module.exports = FAQServices;
