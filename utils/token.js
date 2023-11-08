const jwt = require("jsonwebtoken");
const token = async (_id, userType) => {
  const userToken = await jwt.sign(
    { userId: _id, userType },
    process.env.TOKEN_KEY,
    {
      expiresIn: "365d",
    }
  );
  return userToken;
};
module.exports = token;
