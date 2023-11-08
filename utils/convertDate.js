const moment = require("moment");

module.exports = (date) => {
  if (date) {
    return moment(date).format("YYYYMMDDHHmmss");
  }
  return null;
};
