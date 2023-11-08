const axios = require("axios");
const whatsAppMessage = async (to, body) => {
  try {
    var data = JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: {
        body,
      },
    });

    var config = {
      method: "post",
      url: `https://graph.facebook.com/v15.0/${process.env.NUMBER_ID}/messages`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.BOT_TOKEN}`,
      },
      data: data,
    };

    return await axios(config);
  } catch (error) {
    console.log(error.message);
    return null;
  }
};

module.exports = whatsAppMessage;
