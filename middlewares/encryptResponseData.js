const encryptData = require("../utils/encryptData");

module.exports = (req, res, next) => {
  if (
    req.url.startsWith("/api/test") ||
    req.url.startsWith("/testDashboard") ||
    req.url.endsWith("/payfast/checkout") ||
    req.url.startsWith("/api/whatsApp") ||
    req.url.endsWith("/payfast/recharge/checkout")
  ) {
    next();
    return;
  }
  const send = res.send;
  res.send = function (body) {
    send.call(this, JSON.stringify(encryptData(body)));
  };
  next();
};
