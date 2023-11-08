const mongoose = require('mongoose');
const fareIntialsServices = require('../services/fareIntialsServices');
const documentStatus = require('../utils/documentStatus');
const vehicleStatus = require('../utils/vehicleStatus');
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    model: {
      type: Schema.Types.ObjectId,
      ref: 'VehicleModel',
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      uppercase: true,
    },
    registrationCity: {
      type: Schema.Types.ObjectId,
      ref: 'City',
      required: true,
    },
    registrationProvince: {
      type: Schema.Types.ObjectId,
      ref: 'Province',
      required: true,
    },
    minMileage: {
      type: Number,
    },
    AC: {
      type: Boolean,
      required: true,
    },
    heater: {
      type: Boolean,
      required: true,
    },
    color: {
      type: Schema.Types.ObjectId,
      ref: 'Color',
      required: true,
    },
    seatingCapacity: {
      type: Number,
      required: true,
    },
    statusUpdatedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      default: vehicleStatus.PENDING,
    },
    comment: {
      type: String,
      default: 'You documents are being verified!',
    },
    documents: [
      {
        type: {
          type: String,
          required: true,
        },
        frontImage: {
          type: String,
        },
        backImage: {
          type: String,
        },
        vehicleImage: {
          type: String,
        },
        status: {
          type: String,
          default: vehicleStatus.PENDING,
        },
      },
    ],
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

schema.virtual('perKmCost').get(async () => {
  return (
    (await fareIntialsServices.getCurrent().fulePrice.petrol) / this.minMileage
  );
});

const vehicleModel = new mongoose.model('Vehicle', schema);

module.exports = vehicleModel;
