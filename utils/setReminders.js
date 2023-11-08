const { setRouteReminder } = require("../services/driverRouteServices");

module.exports = () => {
  try {
    setRouteReminder();
  } catch (error) {
    console.log(error);
  }
};
