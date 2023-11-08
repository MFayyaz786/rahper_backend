const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    name: {
      type: String,
    },
    value: {
      type: String,
      unique: true,
      uppercase: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const simProviderModel = new mongoose.model("SIMProvider", schema);

module.exports = simProviderModel;
