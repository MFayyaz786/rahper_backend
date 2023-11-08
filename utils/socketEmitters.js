const socketEmitters = {
  UPDATEDEVICEID: "deviceUpdate",
  LOCATIONOBSERVER: "locationObserver",
  REFRESHSCHEDULE: "refreshSchedule",
  REFRESH: "refresh",
  ERROR: "error",
  REFRESHDASHBOARD: "refreshDashboard",
  CANCELBYDRIVER: "cancelRequestByDriver",
  UPDATEPASSENGERRIDESTATUS: "updatePassengerRideStatus",
  REDIRECTPASSENGERTOACTIVERIDE: "redirectPassengerToActiveRide",
};

module.exports = socketEmitters;
