const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  color: { type: String },
  code: {
    rgba: [],
    hex: String,
  },
});

const colorModel = new mongoose.model("Color", schema);
module.exports = colorModel;
