const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const schema = new Schema({
  vehicle: {
    type: Schema.Types.ObjectId,
    ref: "Vehicle",
  },
  registrationNumber: {
    type: String,
  },
  registrationProvince: {
    type: String,
  },
});

const userVehicleModel = new mongoose.model("UserVehicle", schema);

module.exports = userVehicleModel;
