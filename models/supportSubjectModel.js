const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    subject: {
      type: String,
      required: true,
      unique: true,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const supportSubjectModel = new mongoose.model("SupportSubject", schema);

module.exports = supportSubjectModel;
