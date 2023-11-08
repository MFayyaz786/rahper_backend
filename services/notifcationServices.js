const axios = require("axios");
const notificationServices = {
  newNotification: async (body, title, to, data, image) => {
     console.log({ body, title, to, data, image });
    try{
    const result = await axios.post(
      "https://fcm.googleapis.com/fcm/send",
      {
        notification: {
          body,
          title,
          image,
        },
        priority: "high",
        data: {
          clickaction: "FLUTTERNOTIFICATIONCLICK",
          ...data,
        },
        to,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: process.env.FCMKEY,
        },
      }
    );
     //console.log(result);
    return result.data;
    }catch(error){
      console.log("error: ", error);

    }
  },
  systemNotification: async (body, title, to, data) => {
    const result = await axios.post(
      "https://fcm.googleapis.com/fcm/send",
      {
        notification: {
          body,
          title,
        },
        priority: "high",
        data: {
          clickaction: "FLUTTERNOTIFICATIONCLICK",
          ...data,
        },
        to,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: process.env.FCMKEY,
        },
      }
    );
    // console.log(result.data);
    return result;
  },
};

module.exports = notificationServices;
