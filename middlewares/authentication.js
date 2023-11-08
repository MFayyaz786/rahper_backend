const encryptData = require('../utils/encryptData');
const jwtServices = require('../utils/jwtServices');

module.exports = async (req, res, next) => {
  if (
    req.url.startsWith("/api/whatsApp") ||
    req.url.startsWith("/api/test") ||
    req.url.startsWith("/files") ||
    req.url.startsWith("/videos") ||
    req.url.startsWith("/images") ||
    req.url.endsWith("refreshToken") ||
    req.url.endsWith("login") ||
    req.url.endsWith("verifymobile") ||
    req.url.endsWith("register") ||
    req.url.endsWith("sendotp") ||
    req.url.endsWith("otprequest") ||
    req.url.endsWith("resetpassword") ||
    req.url.endsWith("livelocation") ||
    req.url.endsWith("user/verifymobile") ||
    req.url.endsWith("/payfast/checkout") ||
    req.url.endsWith("/payfast/recharge/checkout") ||
    req.url.endsWith("api/user/verifymobile") ||
    req.url.includes("api/payment/payfast/success")
  ) {
    console.log("if case");
    next();
    return;
  } else {
    console.log("else case");
    const authorization = req.headers.authorization;
    if (authorization) {
      try {
        const token = authorization.slice(7, authorization.length); // Bearer XXXXXX
        if (token) {
          tokenData = jwtServices.authenticate(token);
          if (tokenData) {
            next();
            return;
          } else {
            res
              .status(401)
              .send(encryptData({ msg: "Authentication failed!" }));
            return;
          }
        } else {
          res.status(401).send(encryptData({ msg: "Authentication failed!" }));
          return;
        }
      } catch (error) {
        if (error.message == "jwt expired") {
          res.status(401).send(encryptData({ msg: "Authentication failed" }));
          return;
        } else {
          res.status(401).send(encryptData({ msg: error.message }));
          return;
        }
      }
    } else {
      res.status(401).send(encryptData({ msg: "Authentication failed!" }));
      return;
    }
  }
}
