module.exports = (mobile) => {
  mobile = mobile.toString();
  mobile = "0" + mobile.slice(-10);
  return mobile;
};
