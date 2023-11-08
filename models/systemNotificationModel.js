const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const schema = new Schema(
  {
    title: String,
    body: String,
    message: String,
    topic: { type: String, default: null },
    icon: {
      type: String,
      default: "images/notification.png",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const systemNotificationModel = new mongoose.model(
  "SystemNotification",
  schema
);

module.exports = systemNotificationModel;
