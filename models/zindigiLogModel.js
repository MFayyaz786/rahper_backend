const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const schema = new Schema(
  {
    path: String,
    request: Object,
    response: Object,
  },
  { timestamps: true }
);

const zindigiLogModel = new mongoose.model("ZindigiLog", schema);
module.exports = zindigiLogModel;
