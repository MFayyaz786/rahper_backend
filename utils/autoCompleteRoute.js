const schedule = require('node-schedule');
const { getUserSocket } = require('./userSocketId');
const socketEmitters = require('./socketEmitters');
const driverRouteServices = require('../services/driverRouteServices');
const activeRideServices = require('../services/activeRideServices');
const exceptionErrorsModel = require('../models/exceptionErrorsModel');
const encryptData = require('./encryptData');
const autoCompletedRouteModel = require('../models/autoCompleteRouteModel');
module.exports = (date, routeId, userId, io) => {
  console.log({ date, routeId, userId });
  try {
    const job = schedule.scheduleJob(
      date,
      async function (arg) {
        console.log('here we are');
        try {
          const { routeId, userId, io } = arg;
          const userSocket = getUserSocket(userId);
          const ride = await activeRideServices.finish(routeId);
          if (ride) {
            const completedledRoute = await driverRouteServices.complete(
              routeId
            );
            if (completedledRoute) {
              if (userSocket) {
                io.to(userSocket.socketId).emit('autoCompletedRoute', {});
                io.to(userSocket.socketId).emit(
                  'locationObserver',
                  JSON.stringify(encryptData({ observer: false }))
                );

                io.to(userSocket.socketId).emit(
                  socketEmitters.REFRESHDASHBOARD,
                  JSON.stringify(encryptData({ msg: 'Refresh Dashboard' }))
                );
              }

              completedledRoute.accepted.forEach((item) => {
                deleteChat(
                  item.userId.toString(),
                  completedledRoute.userId.toString(),
                  item._id.toString(),
                  routeId
                );
              });
            } else {
              if (userSocket) {
                io.to(userSocket.socketId).emit(
                  socketEmitters.ERROR,
                  JSON.stringify(encryptData({ msg: 'Oops some error occur!' }))
                );
              }
            }
          } else {
            if (userSocket) {
              io.to(userSocket.socketId).emit(
                socketEmitters.ERROR,
                JSON.stringify(
                  encryptData({ msg: 'Complete your trips first!' })
                )
              );
            }
          }
        } catch (error) {
          try {
            const err = new exceptionErrorsModel({ error });
            await err.save();
          } catch {}
          const userSocket = getUserSocket(userId);
          console.log(error);
          if (userSocket) {
            io.to(userSocket.socketId).emit(
              socketEmitters.ERROR,
              JSON.stringify(encryptData({ msg: error.message }))
            );
          }
        }
      }.bind(null, { date, routeId, userId, io })
    );
    try {
      autoCompletedRouteModel.create({
        routeId,
        cronJob: job,
      });
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
};
