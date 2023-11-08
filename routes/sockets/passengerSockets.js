const scheduleRideServices = require('../../services/scheduleRideServices');
const { getUserSocket } = require('../../utils/userSocketId');
const driverRouteServices = require('../../services/driverRouteServices');
const socketGeneralServices = require('../../services/socketGeneralServices');
const activeRideServices = require('../../services/activeRideServices');
const notificationServices = require('../../services/notifcationServices');
const notificationInfo = require('../../utils/notificationsInfo');
const encryptData = require('../../utils/encryptData');
const decryptData = require('../../utils/decryptData');
const { getCount } = require('../../utils/chats');
const routeStatus = require('../../utils/routeStatus');
const exceptionErrorsModel = require('../../models/exceptionErrorsModel');
const userServices = require('../../services/userServices');

module.exports = (socket, io) => {
  socket.on('test', async (data) => {
    try {
      console.log(JSON.parse(data));
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        err.save();
      } catch {}
      console.log(error);
    }
    // const scoketId = JSON.parse(data).socketId;
    // console.log("test socket end point");
    // socket.emit("locationObserver", JSON.stringify({ observer: true }));
  });

  //matched driver list against schedule socket end point

  socket.on('matcheddrivers', async (data, callback) => {
    console.log('matcheddrivers');
    try {
      data = decryptData(JSON.parse(data).cipher);
      const { scheduleId } = data;
      // console.log({ scheduleId });
      const list = await scheduleRideServices.matchedDrivers(scheduleId);
      callback(
        encryptData({
          status: true,
          data: { data: list, msg: 'Matched drivers!' },
        })
      );
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        err.save();
      } catch {}
      console.log(error);
      socket.emit('error', JSON.stringify(encryptData({ msg: error.message })));
    }
  });

  //requset to driver for ride by passenger socket end point
  socket.on('rideRequest', async (data, callback) => {
    try {
      data = decryptData(JSON.parse(data).cipher);
      console.log('rideRequest passenger side');
      const { scheduleId, routeId } = data;

      const updateRouteRequest = await driverRouteServices.newRequest(
        routeId,
        scheduleId
      );
      if (updateRouteRequest) {
        const updateScheduleRequest = await scheduleRideServices.newRequest(
          scheduleId,
          routeId
        );
        //joing room to passenger on the route requested
        socket.join(routeId);
        const list = await scheduleRideServices.matchedDrivers(scheduleId);
        callback(
          encryptData({
            status: true,
            data: { data: list, msg: 'Matched drivers list' },
          })
        );
        const userSocket = getUserSocket(
          updateRouteRequest.userId._id.toString()
        );
        if (!updateRouteRequest.userId.anyMatchAsDriver) {
          //before updateRouteRequest.userId._id.toString(),'match',1, true);
          userServices.updateMatchAndRequestStatus(
            updateRouteRequest.userId._id.toString(),
            'match',
            2,
            true
          );
        }
        if (userSocket) {
          if (updateRouteRequest.status == 'active') {
            //sending message to driver for new request to refresh route requests
            io.to(userSocket.socketId).emit(
              'newRequest',
              JSON.stringify(encryptData({ msg: 'New ride request' }))
            );
          } else if (updateRouteRequest.status == 'started') {
            // const requests = await driverRouteServices.notRespondedRequests(
            //   updateRouteRequest._id
            // );
            socket.to(userSocket.socketId).emit(
              'inRideRequest',
              JSON.stringify(
                encryptData({
                  msg: 'New ride request',
                  data: updateScheduleRequest,
                })
              )
            );
            io.to(userSocket.socketId).emit(
              'newRequest',
              JSON.stringify(encryptData({ msg: 'New ride request' }))
            );
          }
        }
        //notification data
        const data = {
          routeId,
          role: '1',
          name: 'rideRequest',
        };

        //sending notification
        await notificationServices.newNotification(
          notificationInfo.rideRequestToDriver.body +
            ` ${updateScheduleRequest.userId.firstName} ${updateScheduleRequest.userId.lastName}`,
          notificationInfo.rideRequestToDriver.title,
          updateRouteRequest.userId.fcmToken,
          data,
          process.env.STORAGEBASEURL + updateRouteRequest.userId.profileImage
        );
      } else {
        socket.emit(
          'error',
          JSON.stringify(encryptData({ msg: 'Seats not Available/Deleted!' }))
        );
        // callback({ status: false, msg: "Seats not avalible!" });
      }
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        err.save();
      } catch {}
      console.log(error.message);
      socket.emit('error', JSON.stringify(encryptData({ msg: error.message })));
    }
  });

  //reject driver from matched driver list

  socket.on('rejectedRequestByPassenger', async (data, callback) => {
    console.log('rejectedRequestByPassenger');
    try {
      data = decryptData(JSON.parse(data).cipher);
      const { scheduleId, routeId } = data;

      const rejectScheduleRequest = await scheduleRideServices.rejectRequest(
        scheduleId,
        routeId
      );
      const rejectRouteRequest = await driverRouteServices.rejectRequest(
        routeId,
        scheduleId
      );

      if (rejectScheduleRequest && rejectRouteRequest) {
        const list = await scheduleRideServices.matchedDrivers(scheduleId);

        const isDriverRequest = rejectScheduleRequest.driverRequests.find(
          (item) => {
            // console.log(item);
            return item._id.toString() == routeId;
          }
        );
        if (isDriverRequest != undefined) {
          //geting driver socket
          const userSocket = getUserSocket(isDriverRequest.userId.toString());
          console.log(userSocket);
          if (userSocket) {
            io.to(userSocket.socketId).emit(
              'newRequest',
              JSON.stringify(encryptData({ msg: 'New ride request' }))
            );
          }
        }
        //refreshing match drivers list
        callback(
          encryptData({
            data: { data: list, msg: 'Matched drivers list' },
            status: true,
          })
        );

        if (rejectRouteRequest?.userId?.fcmToken) {
          const data = { routeId: rejectRouteRequest._id };
          await notificationServices.newNotification(
            notificationInfo.rideRequestRejected.body +
              `${rejectScheduleRequest.userId.firstName} ${rejectScheduleRequest.userId.lastName}`,
            notificationInfo.rideRequestRejected.title,
            rejectRouteRequest.userId.fcmToken,
            data,
            process.env.STORAGEBASEURL +
              rejectScheduleRequest.userId.profileImage
          );
        }
      } else {
        callback(
          encryptData({
            status: false,
          })
        );
      }
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        err.save();
      } catch {}
      console.log(error);
      socket.emit('error', JSON.stringify(encryptData({ msg: error.message })));
    }
  });

  //cancel accepted ride by passenger

  socket.on('cancelRequestByPassenger', async (data, callback) => {
    console.log('cancelRequestByPassenger');
    try {
      data = decryptData(JSON.parse(data).cipher);
      const { scheduleId, routeId } = data;
      console.log(data);
      const cancelDriver = await driverRouteServices.cancelRequest(
        routeId,
        scheduleId
      );
      console.log({ cancelDriver });
      console.log('1');
      if (cancelDriver) {
        const cancelByPassenger = await scheduleRideServices.cancelRequest(
          scheduleId,
          routeId
        );
        console.log('2');

        if (cancelByPassenger) {
          const list = await scheduleRideServices.matchedDrivers(scheduleId);

          callback(
            encryptData({
              status: true,
              data: { data: list, msg: 'Matched drivers list' },
            })
          );
          const userSocket = getUserSocket(cancelDriver.userId._id.toString());
          if (userSocket) {
            // console.log(userSocket);
            //emiting to driver to refresh passengers list
            io.to(userSocket.socketId).emit(
              'newRequest',
              JSON.stringify(encryptData({ msg: 'Request canceled!' }))
            );

            io.to(userSocket.socketId).emit(
              'passengerRideCancellationListener',
              JSON.stringify(encryptData({ msg: '', passengerId: scheduleId }))
            );
          }
          io.to(routeId).emit('refresh');
          //notification data
          const data = {
            routeId,
            role: '1',
          };
          socket.emit(
            'refreshDashboard',
            JSON.stringify(encryptData({ msg: 'Refresh Dashboard' }))
          );
          //sending notification
          await notificationServices.newNotification(
            notificationInfo.passengerCancelled.body +
              ` ${cancelByPassenger.userId.firstName} ${cancelByPassenger.userId.lastName}`,
            notificationInfo.passengerCancelled.title,
            cancelDriver.userId.fcmToken,
            data,
            process.env.STORAGEBASEURL + cancelByPassenger.userId.profileImage
          );
        }
      } else {
        callback(encryptData({ status: false }));
      }
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        err.save();
      } catch {}
      console.log(error);
      socket.emit('error', JSON.stringify(encryptData({ msg: error.message })));
    }
  });

  //active ride endpoint
  socket.on('activeRide', async (data, callback) => {
    try {
      data = decryptData(JSON.parse(data).cipher);
      const { routeId, scheduleId } = data;
      const result = await activeRideServices.passenger(routeId, scheduleId);
      if (result) {
        const [schedule, route, ride] = await Promise.all([
          scheduleRideServices.getById(scheduleId),
          driverRouteServices.routeById(routeId),
          activeRideServices.activeRideByRoute(routeId),
        ]);
        const passenger = ride.passengers.filter((item) => {
          if (item.passenger.toString() === scheduleId) return true;
        });
        const count = getCount(
          schedule.userId._id.toString(),
          route.userId._id.toString()
        );
        // console.log({ count });
        callback(
          encryptData({
            status: passenger[0].status || 'pending',
            count,
            verifyPin: schedule.verifyPin,
            data: {
              schedule: {
                userId: schedule.userId,
                startPoint: schedule.startPoint,
                endPoint: schedule.endPoint,
                lastLocation: schedule.lastLocation,
                bounds_ne: schedule.bounds_ne,
                bounds_sw: schedule.bounds_sw,
                distance: schedule.distance,
                duration: schedule.duration,
                date: schedule.date,
                gender: schedule.gender,
                _id: schedule._id,
                seats: schedule.bookedSeats,
                polyline: schedule.encodedPolyline,
                fare: schedule.fare,
              },
              route: {
                userId: route.userId,
                startPoint: route.startPoint,
                endPoint: route.endPoint,
                lastLocation: route.lastLocation[route.lastLocation.length - 1],
                bounds_ne: route.bounds_ne,
                bounds_sw: route.bounds_sw,
                distance: route.distance,
                duration: route.duration,
                date: route.date,
                kmLeverage: route.kmLeverage,
                gender: route.gender,
                _id: route._id,
              },
              msg: '',
            },
          })
        );
      } else {
        callback(
          encryptData({
            status: false,
            data: { msg: 'No active ride' },
          })
        );
      }
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        err.save();
      } catch {}
      console.log(error);
      socket.emit('error', JSON.stringify(encryptData({ msg: error.message })));
    }
  });

  socket.on('deteleSchedule', async (data, callback) => {
    try {
      console.log('deleteScheulde');
      data = decryptData(JSON.parse(data).cipher);
      const { scheduleId, recurringId } = data;
      let result = null;
      if (recurringId) {
        result = await scheduleRideServices.deleteRecurring(recurringId);
      } else {
        result = await scheduleRideServices.delete(scheduleId);
      }
      if (result) {
        callback(encryptData({ msg: 'Schedule deleted!', status: true }));
        socket.emit(
          'refreshDashboard',
          JSON.stringify(encryptData({ msg: 'Refresh Dashboard' }))
        );
      } else {
        callback(encryptData({ msg: 'Schedule deleted!', status: false }));
      }
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        err.save();
      } catch {}
      console.log(error);
      socket.emit('error', JSON.stringify(encryptData({ msg: error.message })));
    }
  });

  //socket end point for passenger to cancel ride when ride is started by driver
  socket.on('cancelInRideRequestByPassenger', async (data, callback) => {
    try {
      data = decryptData(JSON.parse(data).cipher);
      console.log('cancelInRideRequestByPassenger');
      const { passengerId, routeId } = data;
      // console.log(JSON.parse(data));
      const [ride] = await Promise.all([
        activeRideServices.cancelRideByPassenger(routeId, passengerId),
      ]);
      const [schedule, route] = await Promise.all([
        scheduleRideServices.passengerCancelledInRideRequest(
          passengerId,
          routeId
        ),
        driverRouteServices.cancelRequest(routeId, passengerId),
      ]);
      if (ride) {
        callback(encryptData({ status: true }));
        const driverSocket = getUserSocket(route.userId._id.toString());
        if (driverSocket) {
          // console.log(driverSocket);
          //emiting to driver to refresh passengers list
          io.to(driverSocket.socketId).emit(
            'newRequest',
            JSON.stringify(encryptData({ msg: 'Request canceled!' }))
          );
          io.to(driverSocket.socketId).emit(
            'passengerRideCancellationListener',
            JSON.stringify(encryptData({ msg: '', passengerId }))
          );
        }
        io.to(routeId).emit('refresh');
        socket.emit(
          'refreshDashboard',
          JSON.stringify(encryptData({ msg: 'Refresh Dashboard' }))
        );

        await notificationServices.newNotification(
          notificationInfo.cancelledPassengerRide.body,
          notificationInfo.cancelledPassengerRide.title,
          route.userId.fcmToken
        );
      } else {
        socket.emit(
          'error',
          JSON.stringify(encryptData({ msg: 'Oops some thing went wrong!' }))
        );
      }
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        err.save();
      } catch {}
      console.log(error);
      socket.emit('error', JSON.stringify(encryptData({ msg: error.message })));
    }
  });

  //end point for passenger to accept driver request
  socket.on('acceptRequestByPassenger', async (data, callback) => {
    try {
      console.log('acceptRequestByPassenger');
      data = decryptData(JSON.parse(data).cipher);
      const { scheduleId, routeId } = data;

      const acceptScheduleRequest = await scheduleRideServices.acceptedRequest(
        scheduleId,
        routeId
      );
      if (acceptScheduleRequest) {
        const acceptRouteRequest = await driverRouteServices.acceptRequest(
          routeId,
          scheduleId
        );
        if (acceptRouteRequest) {
          const userSocket = getUserSocket(
            acceptRouteRequest.userId._id.toString()
          );
          //if ride is started then also add passenger in active ride
          if (acceptRouteRequest.status == routeStatus.STARTED) {
            const updateActiveRide = await activeRideServices.addPassenger(
              routeId,
              scheduleId
            );
            //acknowledgement in room for accepted request
            if (updateActiveRide) {
              //to refresh driver side macthed list

              io.to(routeId).emit(
                'refresh',
                JSON.stringify(
                  encryptData({
                    msg: '',
                    status: true,
                    rideStatus: 'accepted',
                  })
                )
              );
              socket.emit(
                'refreshDashboard',
                JSON.stringify(encryptData({ msg: 'Refresh Dashboard' }))
              );
              if (userSocket) {
                io.to(userSocket.socketId).emit('refresh');
                io.to(userSocket.socketId).emit(
                  'newRequest',
                  JSON.stringify(encryptData({ msg: 'Request accepted!' }))
                );
              }
            }
            callback(
              encryptData({
                msg: 'Request accepted',
                status: true,
                rideStatus: 'accepted',
              })
            );
          } else {
            //acknowledgement in room for accepted request
            io.to(routeId).emit(
              'refresh',
              JSON.stringify(
                encryptData({
                  msg: '',
                  status: true,
                  rideStatus: 'accepted',
                })
              )
            );
            socket.emit(
              'refreshDashboard',
              JSON.stringify(encryptData({ msg: 'Refresh Dashboard' }))
            );
            if (userSocket) {
              io.to(userSocket.socketId).emit('refreshDriverRoutes');
              //to refresh driver side macthed list
              io.to(userSocket.socketId).emit(
                'newRequest',
                JSON.stringify(encryptData({ msg: 'Request accepted!' }))
              );
            }
            callback(
              encryptData({
                msg: 'Request accepted',
                status: true,
                rideStatus: 'accepted',
              })
            );
          }

          //notification data
          const data = {
            scheduleId,
            role: '1',
            name: 'acceptedRequest',
          };

          if (acceptRouteRequest.userId.fcmToken)
            // sending accept notification to passenger
            await notificationServices.newNotification(
              notificationInfo.rideRequestAccepted.body +
                ` ${acceptScheduleRequest.userId.firstName} ${acceptScheduleRequest.userId.lastName}`,
              notificationInfo.rideRequestAccepted.title,
              acceptRouteRequest.userId.fcmToken,
              data,
              process.env.STORAGEBASEURL +
                acceptScheduleRequest.userId.profileImage
            );
        } else {
          socket.emit(
            'error',
            JSON.stringify(
              encryptData({
                msg: 'Driver has no seats left!',
              })
            )
          );
        }
      } else {
        socket.emit(
          'error',
          JSON.stringify(
            encryptData({
              msg: 'Driver has no seats left!',
            })
          )
        );
      }
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        err.save();
      } catch {}
      socket.emit('error', JSON.stringify(encryptData({ msg: error.message })));
      console.log(error);
    }
  });
};
