const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    minCarCharges: {
      type: Number,
    },
    minBikeCharges: {
      type: Number,
    },
    //in %
    carMaintenance: {
      type: Number,
      default: 0,
    },
    //add new field bikemaintaince and maintaince change into car maintaince
    bikeMaintenance: {
      type: Number,
      default: 0,
    },
    fulePrice: {
      petrol: {
        type: Number,
      },
      deisel: {
        type: Number,
      },
      gasoline: {
        type: Number,
      },
    },
  },
  {
    timestamps: true,
  }
);

const fareInitialsModel = new mongoose.model("FareInitial", schema);

module.exports = fareInitialsModel;
