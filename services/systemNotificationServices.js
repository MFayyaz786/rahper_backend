const { default: mongoose } = require("mongoose");
const systemNotificationModel = require("../models/systemNotificationModel");

const systemNotificationServices = {
  addNew: async (title, body, message, topic, userId) => {
    let result = null;
    if (topic) {
      const notification = new systemNotificationModel({
        title,
        body,
        message,
        topic,
      });
      result = await notification.save();
    } else {
      const notification = new systemNotificationModel({
        title,
        body,
        message,
        userId: mongoose.Types.ObjectId(userId),
      });
      result = await notification.save();
    }
    return result;
  },

  update: async (_id, title, body, message, topic, userId) => {
    let result = null;
    if (topic) {
      result = await systemNotificationModel.findOneAndUpdate(
        { _id },
        { title, body, message, topic }
      );
    } else {
      result = await systemNotificationModel.findOneAndUpdate(
        { _id },
        { title, body, message, userId }
      );
    }
    return result;
  },

  delete: async (_id) => {
    const result = await systemNotificationModel.deleteOne({ _id });
    if (result) return result.deletedCount == 1;
    return false;
  },

  getByTopic: async (topic, userId, page) => {
    console.log(topic, userId);
    const list = await systemNotificationModel
      .find({
        $or: [
          { topic: { $in: [topic] } },
          { userId: mongoose.Types.ObjectId(userId) },
        ],
      })
      .skip((page - 1) * 40)
      .limit(40)
      .sort("-createdAt");
    console.log(list.length);
    return list;
  },

  all: async () => {
    const list = await systemNotificationModel.find({}).sort("-createdAt");
    return list;
  },
  getById: async (_id) => {
    const result = await systemNotificationModel.findOne({ _id });
    return result;
  },
};

module.exports = systemNotificationServices;
