const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: "FAQCategory" },
  },
  { timestamps: true }
);

const FAQModel = new mongoose.model("FAQ", schema);
module.exports = FAQModel;
