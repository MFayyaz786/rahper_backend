const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  city: {
    type: String,
    required: true,
  },
  province: {
    type: Schema.Types.ObjectId,
    ref: "Province",
  },
});

const cityModel = new mongoose.model("City", schema);
module.exports = cityModel;
