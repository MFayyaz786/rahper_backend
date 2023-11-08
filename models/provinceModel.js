const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  name: {
    type: String,
    required: true,
  },
});

const provinceModel = new mongoose.model("Province", schema);
module.exports = provinceModel;
