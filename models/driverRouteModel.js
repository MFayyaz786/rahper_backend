const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    recurringId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startPoint: {
      longitude: {
        type: Number,
        required: true,
      },
      latitude: {
        type: Number,
        required: true,
      },
      placeName: {
        type: String,
      },
    },
    endPoint: {
      longitude: {
        type: Number,
        required: true,
      },
      latitude: {
        type: Number,
        required: true,
      },
      placeName: {
        type: String,
      },
    },
    date: {
      type: Date,
    },
    isScheduled: {
      type: Boolean,
      default: true,
    },
    availableSeats: {
      type: Number,
    },
    initialSeats: {
      type: Number,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    rescheduled: {
      type: Boolean,
      default: false,
    },
    distance: {
      type: Number,
    },
    duration: {
      type: Number,
    },
    kmLeverage: {
      type: Number,
    },

    //this will contain request from passenger to drivers
    request: [
      {
        type: Schema.Types.ObjectId,
        ref: 'ScheduleRide',
      },
    ],
    cancelled: [
      {
        type: Schema.Types.ObjectId,
        ref: 'ScheduleRide',
      },
    ],
    rejected: [
      {
        type: Schema.Types.ObjectId,
        ref: 'ScheduleRide',
      },
    ],
    accepted: [
      {
        type: Schema.Types.ObjectId,
        ref: 'ScheduleRide',
      },
    ],
    completed: [
      {
        type: Schema.Types.ObjectId,
        ref: 'ScheduleRide',
      },
    ],

    //this will contain all request from driver to passenger
    myRequests: [
      {
        type: Schema.Types.ObjectId,
        ref: 'ScheduleRide',
      },
    ],
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
    gender: {
      type: String,
    },
    bounds_sw: {
      longitude: {
        type: Number,
        required: true,
      },
      latitude: {
        type: Number,
        required: true,
      },
    },
    bounds_ne: {
      longitude: {
        type: Number,
        required: true,
      },
      latitude: {
        type: Number,
        required: true,
      },
    },
    status: {
      type: String,
      default: 'active',
    },
    polyline: [],
    encodedPolyline: { type: String },
    lastLocation: [
      {
        type: Object,
      },
    ],
    corporateCode: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const driverRouteModel = new mongoose.model('DriverRoute', schema);

module.exports = driverRouteModel;
