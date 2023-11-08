const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
module.exports = {
  create: (data, expiresIn) => {
    if (process.env.NODE_ENV == "development") {
      expiresIn = "1d";
    }
    if (expiresIn)
      return jwt.sign(data, process.env.JWTKEY, { expiresIn: "365d" });
    return jwt.sign(data, process.env.JWTKEY);
  },
  authenticate: (token) => {
    return jwt.verify(token, process.env.JWTKEY);
  },
};
