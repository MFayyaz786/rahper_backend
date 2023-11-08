const mongoose = require('mongoose');
const documentStatus = require('../utils/documentStatus');
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    userType: {
      type: Number,
    },
    mobile: {
      type: Number,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      lowercase: true,
    },
    cnic: {
      type: Number,
      default: 0,
    },
    SMSOTP: {
      type: Number,
      default: null,
    },
    emailOTP: {
      type: Number,
      default: null,
    },
    token: {
      type: String,
    },
    selectedVehicle: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
    totalRating: {
      type: Number,
      default: 0,
    },
    totalRatingCount: {
      type: Number,
      default: 0,
    },
    userVehicle: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Vehicle',
      },
    ],
    emailVerified: {
      type: Boolean,
      default: false,
    },
    mobileVerified: {
      type: Boolean,
      default: false,
    },
    fcmToken: {
      type: String,
    },
    profileStatus: {
      type: Boolean,
      default: false,
    },
    profileImage: {
      type: String,
      default: 'images/defaultprofile.jpg',
    },
    dob: {
      type: String,
      default: null,
    },
    otpExpiry: {
      type: Date,
    },
    userType: {
      type: String,
    },
    deviceId: {
      type: String,
      default: null,
    },
    selectedUserType: {
      type: String,
    },
    inviteCode: { type: String },
    inviteAcceptedCount: { type: Number },
    referBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    active: {
      status: {
        type: Boolean,
        default: true,
      },
      comment: {
        type: String,
        default: '',
      },
    },
    wallet: {
      balance: {
        type: Number,
        default: 0,
      },
    },
    zindigiWallet: {
      zindigiWalletNumber: {
        type: String,
        default: null,
      },
      title: { type: String, default: null },
      linked: {
        type: Boolean,
        default: false,
      },
    },
    activeCorporateCode: {
      type: Boolean,
      default: false,
    },
    corporateCode: {
      type: String,
      default: null,
    },
    smsSource: {
      type: String,
      default: 'sms',
      enum: ['sms', 'whatsApp'],
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
        status: {
          type: String,
          default: documentStatus.PENDING,
        },
        comment: {
          type: String,
          default: 'We will let you know when any action is taken!',
        },
      },
    ],
    signupDevice: {
      type: String,
      default: '',
    },
    loginDevice: { type: String, default: '' },
    signupAs: { type: Number, default: null },
    anyRequestAsDriver: {
      type: Boolean,
      default: false,
    },
    anyRequestAsPassenger: {
      type: Boolean,
      default: false,
    },
    anyMatchAsDriver: {
      type: Boolean,
      default: false,
    },
    anyMatchAsPassenger: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const userModel = new mongoose.model('User', schema);
module.exports = userModel;
