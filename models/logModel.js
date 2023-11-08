const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    log: { type: Object },
  },
  { timestamps: true }
);

const logModel = new mongoose.model("Log", schema);

module.exports = logModel;
