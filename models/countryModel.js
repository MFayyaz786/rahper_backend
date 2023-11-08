const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    name: {
      type: String,
    },
    icon: {
      type: String,
    },
    countryCode: {
      type: Number,
      unique: true,
      required: true,
    },
    isoCode: {
      type: String,
      unique: true,
      require: true,
      uppercase: true,
    },
  },
  { timestamps: true }
);

const countryModel = new mongoose.model("Country", schema);

module.exports = countryModel;
