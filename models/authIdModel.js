const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    userId: String,
    uuid: String,
  },
  { timestamps: true }
);

const authIdModel = new mongoose.model("AuthId", schema);
module.exports = authIdModel;
