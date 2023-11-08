const OTP = () => {
  // return 4153;
  const otp = Math.floor(1000 + Math.random() * 9000);
  return otp;
};

module.exports = OTP;
