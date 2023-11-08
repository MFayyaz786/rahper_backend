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
    softSave: {
      type: Boolean,
      default: false,
    },
    deleted: { type: Boolean, default: false },
    reschedule: { type: Boolean, default: false },
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
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    isScheduled: {
      type: Boolean,
      default: true,
    },
    distance: {
      type: Number,
    },
    duration: {
      type: Number,
    },
    bookedSeats: {
      type: Number,
    },
    gender: {
      type: String,
    },

    //this will constain requests from passenger to driver
    request: [
      {
        type: Schema.Types.ObjectId,
        ref: 'DriverRoute',
      },
    ],
    rejected: [
      {
        type: Schema.Types.ObjectId,
        ref: 'DriverRoute',
      },
    ],
    cancelled: [
      {
        type: Schema.Types.ObjectId,
        ref: 'DriverRoute',
      },
    ],

    //this will constain requests from driver to passenger
    driverRequests: [
      {
        type: Schema.Types.ObjectId,
        ref: 'DriverRoute',
      },
    ],
    accepted: {
      type: Schema.Types.ObjectId,
      ref: 'DriverRoute',
      default: null,
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
    completed: {
      type: Boolean,
      default: false,
    },
    polyline: [],
    encodedPolyline: { type: String },
    status: {
      type: String,
      default: 'pending',
    },
    fare: {
      type: Number,
      default: 0,
    },
    verifyPin: {
      type: String,
      default: null,
    },
    corporateCode: {
      type: String,
      default: null,
    },
  },

  {
    timestamps: true,
  }
);

const scheduleRideModel = new mongoose.model('ScheduleRide', schema);

module.exports = scheduleRideModel;
