const express = require("express");
const systemNotificatinoRouter = express.Router();
const asyncHandler = require("express-async-handler");
const notificationServices = require("../services/notifcationServices");
const systemNotificationServices = require("../services/systemNotificationServices");

//adding a new system notificaion
systemNotificatinoRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const { title, body, message, topic, userId } = req.body;
    if (!userId && !topic) {
      return res.status(400).send({ msg: "user id or topic is required" });
    }
    const result = await systemNotificationServices.addNew(
      title,
      body,
      message,
      topic,
      userId
    );
    if (result) {
      //sending notification to user with that topic
      if (topic == "all") {
        notificationServices.systemNotification(body, title, "drivers", {
          message,
          name: "System Notification",
          id: result._id.toString(),
        });
        notificationServices.systemNotification(body, title, "passengers", {
          message,
          name: "System Notification",
          id: result._id.toString(),
        });
      } else {
        notificationServices.systemNotification(body, title, topic, {
          message,
          name: "System Notification",
          id: result._id.toString(),
        });
      }
      res.status(200).send({ msg: "success" });
    } else {
      res.status(400).send({ msg: "success" });
    }
  })
);

systemNotificatinoRouter.put(
  "/",
  asyncHandler(async (req, res) => {
    const { notificationId, title, body, message, topic, userId } = req.body;
    if (!notificationId || !title || !body || !message) {
      res.status(400).send({ msg: "Some fields are missing!" });
      return;
    }
    if (!userId && !topic) {
      return res.status(400).send({ msg: "user id or topic is required" });
    }
    const result = await systemNotificationServices.update(
      notificationId,
      title,
      body,
      message,
      topic,
      userId
    );
    if (result) {
      res.status(200).send({ msg: "success" });
    } else {
      res.status(400).send({ msg: "success" });
    }
  })
);

//geting notification with topic route
systemNotificatinoRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const result = await systemNotificationServices.all();
    res.status(200).send({ msg: "Notifications", data: result });
  })
);

//geting notification with topic route
systemNotificatinoRouter.get(
  "/topic?",
  asyncHandler(async (req, res) => {
    const { topic, userId, page } = req.query;
    const result = await systemNotificationServices.getByTopic(
      topic,
      userId,
      page
    );
    res.status(200).send({ msg: "Notifications", data: result });
  })
);

systemNotificatinoRouter.get(
  "/byId?",
  asyncHandler(async (req, res) => {
    const { notificationId } = req.query;
    const result = await systemNotificationServices.getById(notificationId);
    if (result) {
      res.status(200).send({ msg: "Notifications", data: result });
    } else {
      res.status(400).send({ msg: "Notification not found!" });
    }
  })
);

systemNotificatinoRouter.delete(
  "/?",
  asyncHandler(async (req, res) => {
    const { notificationId } = req.query;
    const result = await systemNotificationServices.delete(notificationId);

    if (result) {
      res.status(200).send({ msg: "Notifications", data: result });
    } else {
      res.status(400).send({ msg: "Notification not found!" });
    }
  })
);

module.exports = systemNotificatinoRouter;
