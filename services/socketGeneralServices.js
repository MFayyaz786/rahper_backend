const scheduleRideServices = require('./scheduleRideServices');

const socketGeneralServices = {
  errorEmitter: (socket, error) => {
    socket.emit('error', JSON.stringify(error));
  },

  joinAllPassengerRooms: async (socket, userId) => {
    // console.log({ userId });
    const userSchedule = await scheduleRideServices.getuserSchedules(userId);
    userSchedule?.forEach((schedule) => {
      //joining all room requested by passenger

      schedule.request.forEach((routeId) => {
        // console.log({ routeId });
        socket.join(routeId.toString());
      });
      //joining all room in driver requests
      schedule?.driverRequests?.forEach((routeId) => {
        // console.log({ routeId });
        socket.join(routeId.toString());
      });
    });
  },
};

module.exports = socketGeneralServices;
