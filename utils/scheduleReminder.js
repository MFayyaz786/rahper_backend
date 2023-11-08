const notificationServices = require("../services/notifcationServices");
const notificationInfo = require("./notificationsInfo");
const schedule = require("node-schedule");
const userModel = require("../models/userModel");
module.exports = (date, routeId, userId) => {
  try {
    const job = schedule.scheduleJob(
      date,
      async function (arg) {
        try {
          const userFCM = await userModel.findOne(
            { _id: arg.userId },
            { fcmToken: 1 }
          );
          if (userFCM) {
            if (userFCM.fcmToken) {
              const data = {
                routeId: arg.routeId,
                role: "1",
                name: "driverScheduleReminder",
              };
              notificationServices.newNotification(
                notificationInfo.scheduleReminder.body,
                notificationInfo.scheduleReminder.title,
                userFCM.fcmToken,
                data
              );
            }
          }
        } catch (err) {
          console.log(err);
        }
      }.bind(null, { date, routeId, userId })
    );
  } catch (err) {
    console.log(err);
  }
};
