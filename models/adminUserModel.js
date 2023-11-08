const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    mobile: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
    },
    token: {
      type: String,
      default: null,
    },
    refreshToken: {
      type: String,
      default: null,
    },
    fcmToken: {
      type: String,
      default: null,
    },
    otp: {
      type: Number,
      default: null,
    },
    status: {
      type: Boolean,
      default: true,
    },
    menu: [
      {
        lable: {
          type: String,
        },
        to: {
          type: String,
        },
      },
    ],
  },
  { timestamps: true }
);

const adminUserModel = new mongoose.model("AdminUser", schema);

module.exports = adminUserModel;
