const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    type: {
      type: String,
    },
    id: {
      type: Number,
    },
  },
  { timestamps: true }
);

const userTypeModel = new mongoose.model("UserType", schema);
module.exports = userTypeModel;
