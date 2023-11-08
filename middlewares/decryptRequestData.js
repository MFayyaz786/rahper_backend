const decryptData = require("../utils/decryptData");
const encryptData = require("../utils/encryptData");

module.exports = (req, res, next) => {
  if (
    req.method === "GET" ||
    req.method === "DELETE" ||
    req.url.startsWith("/api/test") ||
    req.url.endsWith("livelocation") ||
    req.url.startsWith("/testDashboard") ||
    req.url.endsWith("/payfast/checkout") ||
    req.url.endsWith("/payfast/recharge/checkout") ||
    req.url.startsWith("/api/whatsApp")
  ) {
    next();
    return;
  }
  const { cipher } = req.body;
  if (cipher == undefined) {
    res.status(400).send(encryptData({ msg: "Please send data into cipher!" }));
    return;
  }
  const data = decryptData(cipher);
  if (data) {
    req.body = data;
    next();
  } else {
    res.status(401).send(encryptData({ msg: "Not authorized" }));
  }
};
