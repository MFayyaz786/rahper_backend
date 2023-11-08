const referralCodes = require("referral-codes");
const referralCode = () => {
  result = referralCodes.generate({
    prefix: "RHPR-",
    length: 6,
    count: 1,
  });
  return result[0];
};

module.exports = referralCode;
