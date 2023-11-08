const express = require("express");
const whatsAppRouter = express.Router();

whatsAppRouter.get("/webhook", async (req, res) => {
  let mode = req.query["hub.mode"];
  let challenge = req.query["hub.challenge"];
  let token = req.query["hub.verify_token"];
  const mytoken = "abdulmalik";
  if (mode && token) {
    if (mode == "subscribe" && token === mytoken) {
      res.status(200).send(challenge);
    } else {
      res.status(403).send();
    }
  } else {
    res.status(400).send();
  }
});

module.exports = whatsAppRouter;
