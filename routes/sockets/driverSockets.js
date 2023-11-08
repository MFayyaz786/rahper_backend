const scheduleRideServices = require('../../services/scheduleRideServices');
const { getUserSocket } = require('../../utils/userSocketId');
const driverRouteServices = require('../../services/driverRouteServices');
const activeRideServices = require('../../services/activeRideServices');
const historyServices = require('../../services/historyServices');
const notificationInfo = require('../../utils/notificationsInfo');
const notificationServices = require('../../services/notifcationServices');
const { deleteChat } = require('../../utils/chats');
const encryptData = require('../../utils/encryptData');
const decryptData = require('../../utils/decryptData');
const PIN = require('../../utils/OTP');
const socketEmitters = require('../../utils/socketEmitters');
const userServices = require('../../services/userServices');
const OTP = require('../../utils/OTP');
const smsServices = require('../../services/smsServices');
const zindigiWalletServerices = require('../../services/zindigiWalletServices');
const exceptionErrorsModel = require('../../models/exceptionErrorsModel');
const paymentHistoryService = require('../../services/paymentHistoryServices');
const failedPaymentServices = require('../../services/failedPaymentServices');
const paymentMethod = require('../../utils/paymentMethod');
const userWalletServices = require('../../services/userWalletServices');
const walletSources = require('../../utils/walletSources');
const failedPaymentLimitServices = require('../../services/failedPaymentLimitServices');
const mailServices = require('../../services/mailServices');
const autoCompleteRoute = require('../../utils/autoCompleteRoute');
const autoCompletedRouteModel = require('../../models/autoCompleteRouteModel');

module.exports = (socket, io) => {
  //request rejected by driver socket endpoint
  socket.on('rejectRequestByDriver', async (data, callback) => {
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
      if (rejectRouteRequest) {
        callback(
          encryptData({
            msg: 'Request rejected',
            status: true,
          })
        );
        if (rejectScheduleRequest) {
          const userSocket = getUserSocket(
            rejectScheduleRequest.userId._id.toString()
          );

          //emiting to passenger on driver rejection to refresh requested list
          if (userSocket) {
            io.to(userSocket.socketId).emit(
              socketEmitters.REFRESH,
              JSON.stringify(
                encryptData({
                  msg: '',
                  status: true,
                  rideStatus: 'rejected',
                })
              )
            );
            io.to(userSocket.socketId).emit(
              socketEmitters.REFRESHSCHEDULE,
              JSON.stringify(encryptData({ msg: 'refresh' }))
            );
          }
          if (rejectScheduleRequest?.userId?.fcmToken) {
            const data = { scheduleId: rejectScheduleRequest._id };
            await notificationServices.newNotification(
              notificationInfo.rideRequestRejected.body +
                `${rejectRouteRequest.userId.firstName} ${rejectRouteRequest.userId.lastName}`,
              notificationInfo.rideRequestRejected.title,
              rejectScheduleRequest.userId.fcmToken,
              data,
              process.env.STORAGEBASEURL +
                rejectRouteRequest.userId.profileImage
            );
          }
        }
      } else {
        callback(
          encryptData({
            msg: 'Request not rejected',
            status: false,
          })
        );
      }
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        await err.save();
      } catch {}
      socket.emit(
        socketEmitters.ERROR,
        JSON.stringify(encryptData({ msg: error.message }))
      );
      console.log(error);
    }
  });

  //end point for driver to accept passenger request
  socket.on('acceptRequest', async (data, callback) => {
    try {
      console.log('acceptRequest driver');
      data = decryptData(JSON.parse(data).cipher);
      const { scheduleId, routeId } = data;
      const acceptScheduleRequest = await scheduleRideServices.acceptedRequest(
        scheduleId,
        routeId
      );
      // console.log(acceptScheduleRequest);
      if (acceptScheduleRequest) {
        const acceptRouteRequest = await driverRouteServices.acceptRequest(
          routeId,
          scheduleId
        );

        if (acceptRouteRequest) {
          //if ride is started then also add passenger in active ride
          if (acceptRouteRequest.status == 'started') {
            const updateActiveRide = await activeRideServices.addPassenger(
              routeId,
              scheduleId
            );
            //acknowledgement in room for accepted request
            if (updateActiveRide) {
              io.to(routeId).emit(
                socketEmitters.REFRESH,
                JSON.stringify(
                  encryptData({
                    msg: '',
                    status: true,
                    rideStatus: 'accepted',
                  })
                )
              );
              // const userSocket = getUserSocket(acceptScheduleRequest.userId._id.toString());
              io.to(routeId).emit(
                socketEmitters.REFRESHDASHBOARD,
                JSON.stringify(encryptData({ msg: 'Refresh Dashboard' }))
              );
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
              socketEmitters.REFRESH,
              JSON.stringify(
                encryptData({
                  msg: '',
                  status: true,
                  rideStatus: 'accepted',
                })
              )
            );
            io.to(routeId).emit(
              socketEmitters.REFRESHDASHBOARD,
              JSON.stringify(encryptData({ msg: 'Refresh Dashboard' }))
            );
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
            role: '2',
            name: 'acceptedRequest',
          };

          //sending accept notification to passenger
          await notificationServices.newNotification(
            notificationInfo.rideRequestAccepted.body +
              ` ${acceptRouteRequest.userId.firstName} ${acceptRouteRequest.userId.lastName}`,
            notificationInfo.rideRequestAccepted.title,
            acceptScheduleRequest.userId.fcmToken,
            data,
            process.env.STORAGEBASEURL + acceptRouteRequest.userId.profileImage
          );
        } else {
          socket.emit(
            socketEmitters.ERROR,
            JSON.stringify(
              encryptData({
                msg: 'This ride is already accepted by an other driver!',
              })
            )
          );
        }
      } else {
        socket.emit(
          socketEmitters.ERROR,
          JSON.stringify(
            encryptData({
              msg: 'This ride is already accepted by an other driver!',
            })
          )
        );
      }
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        await err.save();
      } catch {}
      socket.emit(
        socketEmitters.ERROR,
        JSON.stringify(encryptData({ msg: error.message }))
      );
      console.log(error);
    }
  });

  //end point for driver to cancel accepted passenger request
  socket.on('cancelRequestByDriver', async (data, callback) => {
    try {
      console.log('cancelRequestByDriver');
      data = decryptData(JSON.parse(data).cipher);
      const { scheduleId, routeId } = data;
      const cancelDriver = await driverRouteServices.cancelRequest(
        routeId,
        scheduleId
      );
      // console.log({ cancelDriver });
      if (cancelDriver.status == 'started') {
        await activeRideServices.cancelRideByRouteId(routeId, scheduleId);
      }
      if (cancelDriver) {
        let cancelPassenger = null;
        if (cancelDriver.status == 'started') {
          cancelPassenger = await scheduleRideServices.driverCancelledRequest(
            scheduleId,
            routeId
          );
        } else {
          cancelPassenger = await scheduleRideServices.cancelRequest(
            scheduleId,
            routeId
          );
        }

        if (cancelDriver && cancelPassenger) {
          //acknowledgement to driver on success
          callback(
            encryptData({
              msg: 'Request cancelled',
              status: true,
            })
          );
          const userSocket = getUserSocket(
            cancelPassenger.userId._id.toString()
          );

          //calling passenger emitter to refresh request
          if (userSocket) {
            io.to(userSocket.socketId).emit(
              socketEmitters.CANCELBYDRIVER,
              JSON.stringify(encryptData({ msg: 'Request canceled' }))
            );
            const schdeules = await scheduleRideServices.getuserSchedules(
              cancelPassenger.userId._id.toString()
            );
            io.to(userSocket.socketId).emit(
              socketEmitters.REFRESHSCHEDULE,
              JSON.stringify(encryptData({ data: schdeules }))
            );
            io.to(userSocket.socketId).emit(
              socketEmitters.UPDATEPASSENGERRIDESTATUS,
              JSON.stringify(encryptData({ status: 'cancelled' }))
            );
            io.to(userSocket.socketId).emit(
              socketEmitters.REFRESHDASHBOARD,
              JSON.stringify(encryptData({ msg: 'Refresh Dashboard' }))
            );
          }
          io.to(routeId).emit(
            socketEmitters.REFRESH,
            JSON.stringify(encryptData({ msg: 'Ride cancelled' }))
          );

          //notification to passenger
          cancelPassenger.userId.fcmToken &&
            (await notificationServices.newNotification(
              notificationInfo.cancelledRoute.body,
              notificationInfo.cancelledRoute.title,
              cancelPassenger.userId.fcmToken,
              data,
              process.env.STORAGEBASEURL + cancelPassenger.userId.profileImage
            ));
        }
      } else {
        callback(
          encryptData({
            msg: 'Request not cancelled',
            status: false,
          })
        );
      }
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        await err.save();
      } catch {}
      console.log(error);
      socket.emit(
        socketEmitters.ERROR,
        JSON.stringify(encryptData({ msg: error.message }))
      );
    }
  });

  //endpoint for driver to ger all request on a route
  socket.on('getAllRequests', async (data, callback) => {
    try {
      console.log('getAllRequests');
      data = decryptData(JSON.parse(data).cipher);
      const { routeId } = data;
      const [list, matchedPassengers] = await Promise.all([
        driverRouteServices.getRequests(routeId),
        driverRouteServices.matchedPassengers(routeId, true),
      ]);
      // console.log(matchedPassengers);
      callback(
        encryptData({
          msg: 'Passenger requests',
          staus: true,
          data: await list,
          matchedPassengers,
        })
      );
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        await err.save();
      } catch {}
      console.log(error);
      socket.emit(
        socketEmitters.ERROR,
        JSON.stringify(encryptData({ msg: error.message }))
      );
    }
  });

  //endpoint for drive to get all accepted ride requests on a route
  socket.on('getAllAcceptedRequests', async (data, callback) => {
    try {
      const { routeId } = JSON.stringify(data);
      const list = await driverRouteServices.getAcceptedRequests(routeId);
      callback({ msg: 'Accepted requests', staus: true, data: list });
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        await err.save();
      } catch {}
      console.log(error);
      socket.emit(
        socketEmitters.ERROR,
        JSON.stringify(encryptData({ msg: error.message }))
      );
    }
  });

  //end point for driver to start own route
  socket.on('start', async (data, callback) => {
    try {
      console.log('start');
      data = decryptData(JSON.parse(data).cipher);
      const { routeId, userId } = data;
      const isTimeOver = await driverRouteServices.validateRouteTime(routeId);
      if (isTimeOver) {
        socket.emit(
          socketEmitters.ERROR,
          JSON.stringify(
            encryptData({ msg: 'You are late please cancel your schedule' })
          )
        );
        return;
      }
      const anyStartedRideByDriver =
        await driverRouteServices.validateStartedRide(userId);
      const pendingList = await driverRouteServices.notRespondedRequests(
        routeId
      );
      if (anyStartedRideByDriver) {
        const validateRide = await activeRideServices.validateRide(routeId);
        // console.log(validateRide);
        callback(encryptData({ activeRide: validateRide, pendingList }));
        validateRide
          ? console.log({ msg: 'Alreay in ride!' })
          : socket.emit(
              socketEmitters.ERROR,
              JSON.stringify(
                encryptData({
                  msg: 'You can start only one ride!',
                })
              )
            );
      } else {
        const validateRide = await activeRideServices.validateRide(routeId);
        if (validateRide) {
          callback(encryptData({ activeRide: validateRide, pendingList }));
        } else {
          const passengersFCM = [];
          const [ride] = await Promise.all([
            activeRideServices.newRide(routeId),
          ]);
          const { ride: activeRide, rideTime } = ride;
          if (activeRide) {
            socket.emit(
              socketEmitters.LOCATIONOBSERVER,
              JSON.stringify(encryptData({ observer: true, routeId }))
            );
            const autoCompleteTime = new Date();
            console.log(autoCompleteTime);
            autoCompleteTime.setMinutes(
              autoCompleteTime.getMinutes() + 360 + rideTime
            );
            console.log(autoCompleteTime);
            autoCompleteRoute(autoCompleteTime, routeId, userId, io);
          }
          activeRide?.passengers?.forEach(async function (element) {
            const schedules = await scheduleRideServices.getuserSchedules(
              element.passenger.userId._id
            );
            passengersFCM.push(element.passenger.userId.fcmToken);
            const userSocket = getUserSocket(element.passenger.userId._id);
            if (userSocket) {
              //emitting the passenger to refresh schedule
              io.to(userSocket.socketId).emit(
                socketEmitters.REFRESHSCHEDULE,
                JSON.stringify(encryptData({ data: schedules }))
              );
              io.to(userSocket.socketId).emit(
                socketEmitters.REFRESHDASHBOARD,
                JSON.stringify(encryptData({ msg: 'Refresh Dashboard' }))
              );
              //emitter will redirect passenger to the acitve ride screen
              io.to(userSocket.socketId).emit(
                socketEmitters.REDIRECTPASSENGERTOACTIVERIDE,
                JSON.stringify(
                  encryptData({
                    routeId,
                    scheduleId: element.passenger._id.toString(),
                  })
                )
              );
            }
          });

          callback(encryptData({ activeRide, pendingList }));
          socket.emit(
            socketEmitters.REFRESHDASHBOARD,
            JSON.stringify(encryptData({ msg: 'Refresh Dashboard' }))
          );
          //sending notification to all passenger accepted
          await Promise.all(
            passengersFCM.map(async (fcmToken, index) => {
              const data = {
                scheduleId: activeRide.passengers[index].passenger.toString(),
                routeId,
                role: '2',
                name: 'startedRide',
              };
              await notificationServices.newNotification(
                notificationInfo.rideStartByDriver.body,
                notificationInfo.rideStartByDriver.title,
                fcmToken,
                data,
                process.env.STORAGEBASEURL +
                  activeRide.routeId.userId.profileImage
              );
            })
          );
        }
      }
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        await err.save();
      } catch {}
      console.log(error);
      socket.emit(
        socketEmitters.ERROR,
        JSON.stringify(encryptData({ msg: error.message }))
      );
    }
  });

  //end point for driver to start toward passenger for pickup
  socket.on('onTheWay', async (data, callback) => {
    try {
      console.log('onTheWay');
      data = decryptData(JSON.parse(data).cipher);
      const { rideId, passengerId } = data;
      const [result, schedule] = await Promise.all([
        activeRideServices.onTheWay(rideId, passengerId),
        scheduleRideServices.getById(passengerId),
      ]);
      if (result) {
        const updatedResult = await activeRideServices.rideById(rideId);
        callback(encryptData(updatedResult));
        const userSocket = getUserSocket(schedule.userId._id);
        if (userSocket) {
          //acknowledgement to passenger that driver is no the way
          io.to(userSocket.socketId).emit(
            socketEmitters.UPDATEPASSENGERRIDESTATUS,
            JSON.stringify(encryptData({ status: 'active' }))
          );
        }
        const data = {
          scheduleId: passengerId,
          routeId: result.routeId.toString(),
          role: '2',
          name: 'passengerRideStatus',
        };

        //sending notifcatoin to passenger
        await notificationServices.newNotification(
          notificationInfo.onTheWayToPassenger.body,
          notificationInfo.onTheWayToPassenger.title,
          schedule.userId.fcmToken,
          data,
          process.env.STORAGEBASEURL + updatedResult.routeId.userId.profileImage
        );
      }
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        await err.save();
      } catch {}
      console.log(error);
      socket.emit(
        socketEmitters.ERROR,
        JSON.stringify(encryptData({ msg: error.message }))
      );
    }
  });

  //endpoint to update passenger request status to arrived when driver arrived on the location to pickup
  socket.on('arrived', async (data, callback) => {
    try {
      console.log('arrived');
      data = decryptData(JSON.parse(data).cipher);
      // console.log(data);
      const { rideId, passengerId } = data;
      const pin = PIN();
      const [result, schedule] = await Promise.all([
        activeRideServices.arrived(rideId, passengerId, pin),
        scheduleRideServices.updatedVerifyPin(passengerId, pin),
      ]);
      if (result) {
        const updatedResult = await activeRideServices.rideById(rideId);
        callback(encryptData(updatedResult));
        const userSocket = getUserSocket(schedule.userId._id);
        if (userSocket) {
          //acknowledgement to passenger
          io.to(userSocket.socketId).emit(
            socketEmitters.UPDATEPASSENGERRIDESTATUS,
            JSON.stringify(
              encryptData({ status: 'arrived', verifyPin: pin.toString() })
            )
          );
        }
        const data = {
          scheduleId: passengerId,
          routeId: result.routeId.toString(),
          role: '2',
          name: 'passengerRideStatus',
        };

        //nofication to passenger
        await notificationServices.newNotification(
          notificationInfo.driverArrived.body,
          notificationInfo.driverArrived.title,
          schedule.userId.fcmToken,
          data,
          process.env.STORAGEBASEURL + updatedResult.routeId.userId.profileImage
        );
      }
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        await err.save();
      } catch {}
      console.log(error);
      socket.emit(
        socketEmitters.ERROR,
        JSON.stringify(encryptData({ msg: error.message }))
      );
    }
  });

  //end point for passenger to confirm that he/she is with driver and start ride
  socket.on('confirmStartRide', async (data, callback) => {
    try {
      console.log('confirmStartRide');
      data = decryptData(JSON.parse(data).cipher);
      const { routeId, passengerId } = data;
      // console.log(data);
      const [result] = await Promise.all([
        activeRideServices.startRide(routeId, passengerId),
        // scheduleRideServices.getById(passengerId),
      ]);
      // console.log(result);
      if (result) {
        const updatedResult = await activeRideServices.rideById(
          result._id.toString()
        );
        // console.log(updatedResult);
        socket.emit(
          socketEmitters.UPDATEPASSENGERRIDESTATUS,
          JSON.stringify(encryptData({ status: 'inprogress' }))
        );
        // callback(encryptData({ status: "inprogress" }));
        const userSocket = getUserSocket(result.routeId.userId._id.toString());
        if (userSocket) {
          //acknowledgement to driver
          console.log({ userSocket });
          io.to(userSocket.socketId).emit(
            'rideConfirmByPassenger',
            JSON.stringify(encryptData(updatedResult))
          );
        }
        const data = {
          scheduleId: passengerId,
          routeId: result.routeId._id.toString(),
          role: '1',
          name: 'confirmationByPassenger',
        };

        //notification to passenger
        await notificationServices.newNotification(
          notificationInfo.startPassengerRide.body,
          notificationInfo.startPassengerRide.title,
          result.routeId.userId.fcmToken,
          data,
          process.env.STORAGEBASEURL + result.routeId.userId.profileImage
        );
      }
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        await err.save();
      } catch {}
      console.log(error);
      socket.emit(
        socketEmitters.ERROR,
        JSON.stringify(encryptData({ msg: error.message }))
      );
    }
  });

  //end point for driver to start a passenger ride
  socket.on('startRide', async (data, callback) => {
    try {
      console.log('startRide');
      data = decryptData(JSON.parse(data).cipher);
      const { rideId, passengerId } = data;
      const [result, schedule] = await Promise.all([
        activeRideServices.startRide(rideId, passengerId),
        scheduleRideServices.getById(passengerId),
      ]);
      if (result) {
        const updatedResult = await activeRideServices.rideById(rideId);
        callback(encryptData(updatedResult));
        const userSocket = getUserSocket(schedule.userId._id);
        if (userSocket) {
          //acknowledgement to passenger
          io.to(userSocket.socketId).emit(
            socketEmitters.UPDATEPASSENGERRIDESTATUS,
            JSON.stringify(encryptData({ status: 'inprogress' }))
          );
        }
        const data = {
          scheduleId: passengerId,
          routeId: result.routeId.toString(),
          role: '2',
          name: 'passengerRideStatus',
        };

        //notification to passenger
        await notificationServices.newNotification(
          notificationInfo.startPassengerRide.body,
          notificationInfo.startPassengerRide.title,
          schedule.userId.fcmToken,
          data,
          process.env.STORAGEBASEURL + updatedResult.routeId.userId.profileImage
        );
      }
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        await err.save();
      } catch {}
      console.log(error);
      socket.emit(
        socketEmitters.ERROR,
        JSON.stringify(encryptData({ msg: error.message }))
      );
    }
  });

  //end point for driver to start a passenger ride
  socket.on('pendingPayment', async (data, callback) => {
    try {
      console.log('pendingPayment');
      data = decryptData(JSON.parse(data).cipher);
      const { rideId, passengerId } = data;
      const [result, schedule] = await Promise.all([
        activeRideServices.pendingPayment(rideId, passengerId),
        scheduleRideServices.getById(passengerId),
      ]);
      if (result) {
        const updatedResult = await activeRideServices.rideById(rideId);
        callback(encryptData(updatedResult));
        const userSocket = getUserSocket(schedule.userId._id);
        if (userSocket) {
          //acknowledgement to passenger
          io.to(userSocket.socketId).emit(
            socketEmitters.UPDATEPASSENGERRIDESTATUS,
            JSON.stringify(encryptData({ status: 'pendingPayment' }))
          );
        }
        const data = {
          scheduleId: passengerId,
          routeId: result.routeId._id.toString(),
          role: '2',
          name: 'passengerRideStatus',
        };

        //notification to passenger
        await notificationServices.newNotification(
          notificationInfo.pendingPayment.body,
          notificationInfo.pendingPayment.title,
          schedule.userId.fcmToken,
          data,
          process.env.STORAGEBASEURL + updatedResult.routeId.userId.profileImage
        );
      }
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        await err.save();
      } catch {}
      console.log(error);
      socket.emit(
        socketEmitters.ERROR,
        JSON.stringify(encryptData({ msg: error.message }))
      );
    }
  });

  socket.on('sendCompleteRideOTP', async (data, callback) => {
    console.log('sendCompleteRideOTP');
    try {
      data = decryptData(JSON.parse(data).cipher);
      const { passengerId, amount } = data;
      const result = await scheduleRideServices.wallet(passengerId);
      if (result) {
        if (result.userId.zindigiWallet.linked) {
          const res = await zindigiWalletServerices.paymentInquiry(
            new Date(),
            result.userId.zindigiWallet.zindigiWalletNumber,
            result.fare
          );
          if (res.responseCode == '00') {
            callback({ msg: 'OTP sent to customer!' });
          } else {
            socket.emit(
              socketEmitters.ERROR,
              JSON.stringify(encryptData({ msg: res.responseDescription }))
            );
          }
        } else {
          socket.emit(
            socketEmitters.ERROR,
            JSON.stringify(
              encryptData({ msg: 'Customer zindigi wallet is not linked!' })
            )
          );
        }
      } else {
        socket.emit(
          socketEmitters.ERROR,
          JSON.stringify(encryptData({ msg: 'Ride not found' }))
        );
      }
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        await err.save();
      } catch {}
      console.log(error);
      socket.emit(
        socketEmitters.ERROR,
        JSON.stringify(encryptData({ msg: error.message }))
      );
    }
  });

  //complete passenger's ride end point
  socket.on('completeRide', async (data, callback) => {
    try {
      console.log('completeRide');
      data = decryptData(JSON.parse(data).cipher);
      const { passengerId, otp } = data;
      const ride = await activeRideServices.rideByPassenger(passengerId);
      if (ride == null) {
        return;
      }
      const rideId = ride._id.toString();
      const isPaid = await paymentHistoryService.getBySchedule(passengerId);
      if (!isPaid) {
        const passengerWallet = await scheduleRideServices.wallet(passengerId);
        if (passengerWallet == null) {
          socket.emit(
            socketEmitters.ERROR,
            JSON.stringify(encryptData({ msg: 'Passenger not found!' }))
          );
          return;
        }
        const payFare = await zindigiWalletServerices.payment(
          new Date(),
          passengerWallet.userId.zindigiWallet.zindigiWalletNumber,
          otp,
          passengerWallet.fare
        );

        if (payFare.responseCode != '00') {
          let callErrorEmitter = true;
          const [failedCount, failedLimit] = await Promise.all([
            failedPaymentServices.new(passengerId, payFare),
            failedPaymentLimitServices.get(),
          ]);
          if (
            payFare.responseDescription == 'mobileNumber missing or invalid'
          ) {
            socket.emit(
              socketEmitters.ERROR,
              JSON.stringify(
                encryptData({ msg: 'Passenger wallet not linked!' })
              )
            );
            return;
          }
          if (failedCount >= failedLimit?.limit) {
            const paymentHistory = await paymentHistoryService.new(
              rideId,
              passengerId,
              'unpaid',
              payFare
            );
            const schedule = await scheduleRideServices.getById(passengerId);
            mailServices.sentMail(
              passengerWallet?.userId?.email,
              null,
              'receipt',
              {
                receiptId: paymentHistory._id,
                date: schedule.date,
                time: schedule.time,
                method: 'unpaid',
                pickupLocation: schedule.startPoint.placeName,
                dropOffLocation: schedule.endPoint.placeName,
                fare: passengerWallet.fare,
              }
            );
            userWalletServices.updateWallet(
              ride.routeId.userId,
              passengerWallet.fare,
              walletSources.RIDEFARE
            );
            userWalletServices.updateWallet(
              passengerWallet.userId,
              Number(passengerWallet.fare) * -1,
              walletSources.UNPAIDRIDE
            );
            callErrorEmitter = false;
          }
          if (callErrorEmitter) {
            socket.emit(
              socketEmitters.ERROR,
              JSON.stringify(encryptData({ msg: payFare.responseDescription }))
            );
            return;
          }
        } else {
          const paymentHistory = await paymentHistoryService.new(
            rideId,
            passengerId,
            'zindigi',
            payFare
          );
          mailServices.sentMail(
            passengerWallet?.userId?.email,
            null,
            'receipt',
            {
              receiptId: paymentHistory._id,
              date: schedule.date,
              time: schedule.time,
              method: 'unpaid',
              pickupLocation: schedule.startPoint.placeName,
              dropOffLocation: schedule.endPoint.placeName,
              fare: passengerWallet.fare,
            }
          );
          userWalletServices.updateWallet(
            ride.routeId.userId,
            passengerWallet.fare,
            walletSources.RIDEFARE
          );
        }
      }

      const schedule = await scheduleRideServices.completeRequest(passengerId);
      const result = await activeRideServices.completeRide(
        rideId,
        passengerId,
        schedule.bookedSeats
      );
      if (result.result) {
        //updating ride and creating a history for passenger and driver
        const [updatedResult] = await Promise.all([
          activeRideServices.rideById(rideId),
          historyServices.newHistory(result.result.routeId, passengerId, true),
          historyServices.newHistory(result.result.routeId, passengerId, false),
        ]);
        const userSocket = getUserSocket(
          updatedResult.routeId.userId._id.toString()
        );
        if (userSocket) {
          //acknowledgement for ride completion to passenger
          io.to(userSocket.socketId).emit('refreshDriverRoutes');
          io.to(userSocket.socketId).emit(
            'driverCompleteRide',
            JSON.stringify(
              encryptData({ ride: updatedResult, finish: result.finish })
            )
          );
          // callback(encryptData({ ride: updatedResult, finish: result.finish })); //TODO:
        }
        socket.emit(
          socketEmitters.UPDATEPASSENGERRIDESTATUS,
          JSON.stringify(
            encryptData({
              status: 'completed',
            })
          )
        );
        const data = {
          scheduleId: passengerId,
          routeId: result.result.routeId.toString(),
          role: '1',
          name: 'thankYou',
        };
        //sending notification to passenger
        await notificationServices.newNotification(
          `Your ride with ${schedule.userId.firstName} ${schedule.userId.lastName} has been completed`,
          notificationInfo.completedPassengerRide.title,
          updatedResult.routeId.userId.fcmToken,
          data,
          process.env.STORAGEBASEURL + schedule.userId.profileImage
        );
      }
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        await err.save();
      } catch {}
      console.log(error);
      try {
        const error = new exceptionErrorsModel({ error });
        error.save();
      } catch {}
      socket.emit(
        socketEmitters.ERROR,
        JSON.stringify(encryptData({ msg: error.message }))
      );
    }
  });

  //endpoint for driver to cancel his route before starting it
  socket.on('cancelRoute', async (data, callback) => {
    try {
      console.log('cancelRoute');
      data = decryptData(JSON.parse(data).cipher);
      const { routeId } = data;
      const result = await driverRouteServices.cancelRoute(routeId);
      if (result) {
        const fcmTokens = [];
        await Promise.all(
          result.request.map(async (item) => {
            var schedule = await scheduleRideServices.cancelRequest(
              item,
              routeId
            );
            schedule == null &&
              (schedule = await scheduleRideServices.cancelRequest(
                item,
                routeId
              ));
            if (schedule) {
              const data = {
                routeId: result._id.toString(),
                scheduleId: schedule._id.toString(),
                role: '2',
              };
              fcmTokens.push({ fcm: schedule.userId.fcmToken, data });

              const userSocket = getUserSocket(schedule.userId._id.toString());
              if (userSocket) {
                const userSchedules =
                  await scheduleRideServices.getuserSchedules(
                    schedule.userId._id.toString()
                  );
                io.to(userSocket.socketId).emit(
                  socketEmitters.REFRESH,
                  JSON.stringify(
                    encryptData({
                      msg: 'Request cancelled!',
                      status: true,
                    })
                  )
                );
                io.to(userSocket.socketId).emit(
                  socketEmitters.REFRESHSCHEDULE,
                  JSON.stringify(
                    encryptData({
                      msg: socketEmitters.REFRESH,
                      data: userSchedules,
                    })
                  )
                );
                io.to(userSocket.socketId).emit(
                  socketEmitters.REFRESHDASHBOARD,
                  JSON.stringify(encryptData({ msg: 'Refresh Dashboard' }))
                );
              }
            }
          })
        );
        await Promise.all(
          result.myRequests.map(async (item) => {
            var schedule = await scheduleRideServices.cancelRequest(
              item,
              routeId
            );
            schedule == null &&
              (schedule = await scheduleRideServices.cancelRequest(
                item,
                routeId
              ));
            if (schedule) {
              const data = {
                routeId: result._id.toString(),
                scheduleId: schedule._id.toString(),
                role: '2',
              };
              fcmTokens.push({ fcm: schedule.userId.fcmToken, data });
              const userSocket = getUserSocket(schedule.userId._id.toString());
              if (userSocket) {
                const userSchedules =
                  await scheduleRideServices.getuserSchedules(
                    schedule.userId._id.toString()
                  );
                io.to(userSocket.socketId).emit(
                  socketEmitters.REFRESH,
                  JSON.stringify(
                    encryptData({
                      msg: 'Request cancelled!',
                      status: true,
                    })
                  )
                );

                io.to(userSocket.socketId).emit(
                  socketEmitters.REFRESHSCHEDULE,
                  JSON.stringify(
                    encryptData({
                      msg: socketEmitters.REFRESH,
                      data: userSchedules,
                    })
                  )
                );

                io.to(userSocket.socketId).emit(
                  socketEmitters.REFRESHDASHBOARD,
                  JSON.stringify(encryptData({ msg: 'Refresh Dashboard' }))
                );
              }
            }
          })
        );
        socket.emit(
          'cancelRoute',
          JSON.stringify(
            encryptData({
              msg: 'Schedule cancelled!',
              status: true,
            })
          )
        );
        callback(
          encryptData({
            msg: 'Schedule cancelled!',
            status: true,
          })
        );
        socket.emit(
          socketEmitters.REFRESHDASHBOARD,
          JSON.stringify(encryptData({ msg: 'Refresh Dashboard' }))
        );
        //notification to passenger
        await Promise.all([
          fcmTokens.map(async (fcmToken) => {
            fcmToken.fcm &&
              (await notificationServices.newNotification(
                notificationInfo.cancelledRoute.body,
                notificationInfo.cancelledRoute.title,
                fcmToken.fcm,
                fcmToken.data,
                process.env.STORAGEBASEURL + result.userId.profileImage
              ));
          }),
        ]);
      } else {
        console.log('cancelRoute2');

        callback(
          encryptData({
            msg: 'Schedule not found!',
            status: false,
          })
        );
        socket.emit(
          'cancelRoute',
          JSON.stringify(
            encryptData({
              msg: 'Schedule not found!',
              status: false,
            })
          )
        );
      }
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        await err.save();
      } catch {}
      console.log(error);
      socket.emit(
        socketEmitters.ERROR,
        JSON.stringify(encryptData({ msg: error.message }))
      );
    }
  });

  //endpoint for driver to cancel his route before starting it
  socket.on('cancelRecurringRoute', async (data, callback) => {
    try {
      console.log('cancelRecurringRoute');
      data = decryptData(JSON.parse(data).cipher);
      const { recurringId } = data;
      const cancelledRecurring = await driverRouteServices.cancelRecurring(
        recurringId
      );
      // console.log(cancelledRecurring.length);
      if (cancelledRecurring.length > 0) {
        const fcmTokens = [];
        for (result of cancelledRecurring) {
          // console.log({ result });
          await Promise.all(
            result.request.map(async (item) => {
              var schedule = await scheduleRideServices.cancelRequest(
                item,
                result._id.toString()
              );
              schedule == null &&
                (schedule = await scheduleRideServices.cancelRequest(
                  item,
                  result._id.toString()
                ));
              if (schedule) {
                const data = {
                  routeId: result._id.toString(),
                  scheduleId: schedule._id.toString(),
                  role: '2',
                };
                fcmTokens.push({ fcm: schedule.userId.fcmToken, data });

                const userSocket = getUserSocket(
                  schedule.userId._id.toString()
                );
                if (userSocket) {
                  const userSchedules =
                    await scheduleRideServices.getuserSchedules(
                      schedule.userId._id.toString()
                    );
                  io.to(userSocket.socketId).emit(
                    socketEmitters.REFRESH,
                    JSON.stringify(
                      encryptData({
                        msg: 'Request cancelled!',
                        status: true,
                      })
                    )
                  );
                  io.to(userSocket.socketId).emit(
                    socketEmitters.REFRESHSCHEDULE,
                    JSON.stringify(
                      encryptData({
                        msg: socketEmitters.REFRESH,
                        data: userSchedules,
                      })
                    )
                  );
                  io.to(userSocket.socketId).emit(
                    socketEmitters.REFRESHDASHBOARD,
                    JSON.stringify(encryptData({ msg: 'Refresh Dashboard' }))
                  );
                }
              }
            })
          );
          await Promise.all(
            result.myRequests.map(async (item) => {
              var schedule = await scheduleRideServices.cancelRequest(
                item,
                result._id.toString()
              );
              schedule == null &&
                (schedule = await scheduleRideServices.cancelRequest(
                  item,
                  result._id.toString()
                ));
              if (schedule) {
                const data = {
                  routeId: result._id.toString(),
                  scheduleId: schedule._id.toString(),
                  role: '2',
                };
                fcmTokens.push({ fcm: schedule.userId.fcmToken, data });
                const userSocket = getUserSocket(
                  schedule.userId._id.toString()
                );
                if (userSocket) {
                  const userSchedules =
                    await scheduleRideServices.getuserSchedules(
                      schedule.userId._id.toString()
                    );
                  io.to(userSocket.socketId).emit(
                    socketEmitters.REFRESH,
                    JSON.stringify(
                      encryptData({
                        msg: 'Request cancelled!',
                        status: true,
                      })
                    )
                  );

                  io.to(userSocket.socketId).emit(
                    socketEmitters.REFRESHSCHEDULE,
                    JSON.stringify(
                      encryptData({
                        msg: socketEmitters.REFRESH,
                        data: userSchedules,
                      })
                    )
                  );

                  io.to(userSocket.socketId).emit(
                    socketEmitters.REFRESHDASHBOARD,
                    JSON.stringify(encryptData({ msg: 'Refresh Dashboard' }))
                  );
                }
              }
            })
          );
        }
        socket.emit(
          'cancelRoute',
          JSON.stringify(
            encryptData({
              msg: 'Schedule cancelled!',
              status: true,
            })
          )
        );

        callback(
          encryptData({
            msg: 'Schedule cancelled!',
            status: true,
          })
        );
        socket.emit(
          socketEmitters.REFRESHDASHBOARD,
          JSON.stringify(encryptData({ msg: 'Refresh Dashboard' }))
        );
        //notification to passenger
        await Promise.all([
          fcmTokens.map(async (fcmToken) => {
            fcmToken.fcm &&
              (await notificationServices.newNotification(
                notificationInfo.cancelledRoute.body,
                notificationInfo.cancelledRoute.title,
                fcmToken.fcm,
                fcmToken.data,
                process.env.STORAGEBASEURL + result.userId.profileImage
              ));
          }),
        ]);
      } else {
        console.log('cancelRoute2');

        callback(
          encryptData({
            msg: 'Schedule not found!',
            status: false,
          })
        );
        socket.emit(
          'cancelRoute',
          JSON.stringify(
            encryptData({
              msg: 'Schedule not found!',
              status: false,
            })
          )
        );
      }
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        await err.save();
      } catch {}
      console.log(error);
      socket.emit(
        socketEmitters.ERROR,
        JSON.stringify(encryptData({ msg: error.message }))
      );
    }
  });
  //endpoint for driver to finish route after completed all accepted requests
  socket.on('finishRide', async (data, callback) => {
    try {
      console.log('finishRide');
      data = decryptData(JSON.parse(data).cipher);
      const { routeId } = data;
      const ride = await activeRideServices.finish(routeId);

      if (ride) {
        try {
          const job = await autoCompletedRouteModel.findOne({ routeId });
          if (job) {
            job.cancel();
          }
        } catch (err) {
          console.log(err);
        }
        const completedledRoute = await driverRouteServices.complete(routeId);
        if (completedledRoute) {
          callback(
            encryptData({
              msg: 'Ride finished!',
              status: true,
            })
          );
          socket.emit(
            'locationObserver',
            JSON.stringify(encryptData({ observer: false }))
          );
          completedledRoute.accepted.forEach((item) => {
            deleteChat(
              item.userId.toString(),
              completedledRoute.userId.toString(),
              item._id.toString(),
              routeId
            );
          });
          socket.emit(
            socketEmitters.REFRESHDASHBOARD,
            JSON.stringify(encryptData({ msg: 'Refresh Dashboard' }))
          );
        } else {
          console.log('inner else');

          socket.emit(
            socketEmitters.ERROR,
            JSON.stringify(encryptData({ msg: 'Oops some error occur!' }))
          );
        }
      } else {
        socket.emit(
          socketEmitters.ERROR,
          JSON.stringify(encryptData({ msg: 'Complete your trips first!' }))
        );
      }
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        await err.save();
      } catch {}
      console.log(error);
      socket.emit(
        socketEmitters.ERROR,
        JSON.stringify(encryptData({ msg: error.message }))
      );
    }
  });

  //end point for driver to accept passenger request in active ride
  socket.on('acceptInRideRequest', async (data, callback) => {
    try {
      console.log('acceptedInRideRequest');
      data = decryptData(JSON.parse(data).cipher);
      const { scheduleId, routeId, rideId } = data;
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
          //if ride is started then also add passenger in active ride
          const updateActiveRide = await activeRideServices.addPassenger(
            routeId,
            scheduleId
          );
          //acknowledgement in room for accepted request
          const passengerSocket = getUserSocket(
            acceptScheduleRequest.userId._id.toString()
          );
          if (passengerSocket) {
            io.to(passengerSocket.socketId).emit(
              socketEmitters.REFRESHDASHBOARD,
              JSON.stringify(encryptData({ msg: 'Refresh Dashboard' }))
            );
          }
          io.to(passengerSocket.socketId).emit(
            socketEmitters.REFRESHSCHEDULE,
            JSON.stringify(encryptData({ msg: 'refresh' }))
          );
          if (updateActiveRide) {
            io.to(routeId).emit(
              socketEmitters.REFRESH,
              JSON.stringify(
                encryptData({
                  msg: '',
                  status: true,
                  rideStatus: 'accepted',
                })
              )
            );
          }
          const newPassenger = await activeRideServices.newPassenger(
            rideId,
            scheduleId
          );
          // console.log(newPassenger);
          callback(
            encryptData({
              msg: 'Request accepted',
              status: true,
              rideStatus: 'accepted',
              data: newPassenger,
            })
          );
          //notification data
          const data = {
            scheduleId,
            role: '2',
            name: 'acceptedRequest',
          };
          //sending accept notification to passenger
          await notificationServices.newNotification(
            notificationInfo.rideRequestAccepted.body +
              ` ${acceptRouteRequest.userId.firstName} ${acceptRouteRequest.userId.lastName}`,
            notificationInfo.rideRequestAccepted.title,
            acceptScheduleRequest.userId.fcmToken,
            data,
            process.env.STORAGEBASEURL + acceptRouteRequest.userId.profileImage
          );
        } else {
          socket.emit(
            socketEmitters.ERROR,
            JSON.stringify(encryptData({ msg: 'Request not found/accepted' }))
          );
        }
      } else {
        socket.emit(
          socketEmitters.ERROR,
          JSON.stringify(encryptData({ msg: 'Request not found/accepted' }))
        );
      }
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        await err.save();
      } catch {}
      socket.emit(
        socketEmitters.ERROR,
        JSON.stringify(encryptData({ msg: error.message }))
      );
      console.log(error);
    }
  });

  //request rejected by driver socket endpoint in active ride
  socket.on('rejectInRideRequest', async (data, callback) => {
    console.log('rejectInRideRequest');
    try {
      data = decryptData(JSON.parse(data).cipher);
      const { scheduleId, routeId } = data;
      console.log(data);

      const rejectScheduleRequest = await scheduleRideServices.rejectRequest(
        scheduleId,
        routeId
      );
      const rejectRouteRequest = await driverRouteServices.rejectRequest(
        routeId,
        scheduleId
      );
      if (rejectRouteRequest) {
        const requsetList = await driverRouteServices.getRequests(routeId);
        callback(
          encryptData({
            msg: 'Request rejected',
            status: true,
            data: requsetList,
          })
        );
        const userSocket = getUserSocket(
          rejectScheduleRequest.userId._id.toString()
        );

        //emiting to passenger on driver rejection to refresh requested list
        if (userSocket) {
          io.to(userSocket.socketId).emit(
            socketEmitters.REFRESH,
            JSON.stringify(
              encryptData({
                msg: '',
                status: true,
                rideStatus: 'rejected',
              })
            )
          );
          io.to(userSocket.socketId).emit(
            socketEmitters.REFRESHSCHEDULE,
            JSON.stringify(encryptData({ msg: 'refresh' }))
          );
        }
        if (rejectRouteRequest?.userId?.fcmToken) {
          const data = { scheduleId: rejectScheduleRequest._id };
          await notificationServices.newNotification(
            notificationInfo.rideRequestRejected.body +
              `${rejectRouteRequest.userId.firstName} ${rejectRouteRequest.userId.lastName}`,
            notificationInfo.rideRequestRejected.title,
            rejectScheduleRequest.userId.fcmToken,
            data,
            process.env.STORAGEBASEURL + rejectRouteRequest.userId.profileImage
          );
        }
      } else {
        callback(
          encryptData({
            msg: 'Request not rejected',
            status: false,
          })
        );
      }
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        await err.save();
      } catch {}
      socket.emit(
        socketEmitters.ERROR,
        JSON.stringify(encryptData({ msg: error.message }))
      );
      console.log(error);
    }
  });

  socket.on('deleteRoute', async (data, callback) => {
    try {
      console.log('deleteRoute');
      data = decryptData(JSON.parse(data).cipher);
      const { routeId, recurringId } = data;
      if (recurringId) {
        const result = await driverRouteServices.deleteRecurringRoute(
          recurringId
        );
        if (result > 0) {
          callback(encryptData({ status: true, msg: 'Route deleted!' }));
          io.to(routeId).emit('refresh');
          // await Promise.all(result.acceptedUser.map(async (item) => {}));
        } else {
          callback(encryptData({ status: true, msg: 'Route deleted!' }));
        }
        socket.emit(
          socketEmitters.REFRESHDASHBOARD,
          JSON.stringify(encryptData({ msg: 'Refresh Dashboard' }))
        );
        return;
      }

      const result = await driverRouteServices.deleteRoute(routeId);
      if (result) {
        if (result.acceptedUser) {
          callback(encryptData({ status: true, msg: 'Route deleted!' }));
          io.to(routeId).emit('refresh');
          // await Promise.all(result.acceptedUser.map(async (item) => {}));
        } else {
          callback(encryptData({ status: true, msg: 'Route deleted!' }));
        }
        socket.emit(
          socketEmitters.REFRESHDASHBOARD,
          JSON.stringify(encryptData({ msg: 'Refresh Dashboard' }))
        );
      } else {
        callback(encryptData({ status: true, msg: 'Route not deleted!' }));
      }
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        await err.save();
      } catch {}
      socket.emit(
        socketEmitters.ERROR,
        JSON.stringify(encryptData({ msg: error.message }))
      );
      console.log(error);
    }
  });

  //socket endpoint for driver to cancel in ride passanger accepted request this will set passenger ride and scheule to cancel
  socket.on('cancelInRidePassengerRequestByDriver', async (data, callback) => {
    try {
      console.log('cancelInRidePassengerRequestByDriver');
      data = decryptData(JSON.parse(data).cipher);
      const { passengerId, rideId } = data;
      const [ride] = await Promise.all([
        activeRideServices.cancelRide(rideId, passengerId),
      ]);
      const [schedule] = await Promise.all([
        scheduleRideServices.driverCancelledRequest(
          passengerId,
          ride.routeId._id.toString()
        ),
        driverRouteServices.cancelRequest(ride.routeId, passengerId),
      ]);
      if (ride) {
        callback(encryptData({ status: true }));
        const passengerSocket = getUserSocket(schedule.userId._id.toString());
        // console.log(passengerSocket);
        const schedules = await scheduleRideServices.getuserSchedules(
          schedule.userId._id.toString()
        );
        if (passengerSocket) {
          console.log('passenger socket found');
          io.to(passengerSocket.socketId).emit(
            socketEmitters.REFRESHDASHBOARD,
            JSON.stringify(encryptData({ msg: 'Refresh Dashboard' }))
          );

          io.to(passengerSocket.socketId).emit(
            socketEmitters.UPDATEPASSENGERRIDESTATUS,
            JSON.stringify(encryptData({ status: 'cancelled' }))
          );
          io.to(passengerSocket.socketId).emit(
            socketEmitters.REFRESHSCHEDULE,
            JSON.stringify(encryptData({ data: schedules }))
          );
        }
        socket.emit('refreshDriverRoutes');
        await notificationServices.newNotification(
          notificationInfo.cancelledPassengerRide.body,
          notificationInfo.cancelledPassengerRide.title,
          schedule.userId.fcmToken
        );
      } else {
        socket.emit(
          socketEmitters.ERROR,
          JSON.stringify(encryptData({ msg: 'Oops some thing went worng!' }))
        );
      }
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        await err.save();
      } catch {}
      console.log(error);
      socket.emit(
        socketEmitters.ERROR,
        JSON.stringify(encryptData({ msg: error.message }))
      );
    }
  });

  //socket end point to get all matched pending passenger list
  socket.on('matchedPassengers', async (data, callback) => {
    console.log('matchedPassengers');
    try {
      const { routeId } = JSON.parse(data);
      const matchedPassengers = await driverRouteServices.matchedPassengers(
        routeId,
        true
      );
      if (matchedPassengers.length > 0) {
        const mileage = await driverRouteServices.getMileage(routeId);
        await Promise.all(
          matchedPassengers.map(async (item) => {
            const fare = await priceCalculator(
              mileage,
              item.distance,
              item.corporateCode
            );
            item.fare = fare;
          })
        );
      }
      callback({ msg: 'Matched passengers list!', data: matchedPassengers });
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        await err.save();
      } catch {}
      console.log(error);
      socket.emit(
        socketEmitters.ERROR,
        JSON.stringify(encryptData({ msg: error.message }))
      );
    }
  });

  // socket end point to send request to passenger
  socket.on('sendRequestToPassenger', async (data, callback) => {
    try {
      console.log('sendRequestToPassenger');
      data = decryptData(JSON.parse(data).cipher);
      const { routeId, scheduleId } = data;
      //update passenger schedule
      const requestToPassenger = await scheduleRideServices.driverRequest(
        scheduleId,
        routeId
      );
      if (requestToPassenger) {
        // console.log("1");
        //update driver route
        const driverRequestToPassenger = await driverRouteServices.sendRequest(
          routeId,
          scheduleId
        );
        if (driverRequestToPassenger) {
          // console.log("2");
          const [matchedPassengers, list] = await Promise.all([
            driverRouteServices.matchedPassengers(routeId, true),
            driverRouteServices.getRequests(routeId),
          ]);
          // console.log({
          //   msg: "Passenger requests",
          //   staus: true,
          //   data: await list,
          //   matchedPassengers,
          // });
          callback(
            encryptData({
              msg: '',
              staus: true,
              data: await list,
              matchedPassengers,
            })
          );
          //passenger socket
          const userSocket = getUserSocket(
            requestToPassenger.userId._id.toString()
          );
          if (userSocket) {
            io.to(userSocket.socketId).emit(
              socketEmitters.REFRESH,
              JSON.stringify(
                encryptData({ msg: 'New request', status: 'newRequest' })
              )
            );
          }
          //notification data
          const data = {
            scheduleId,
            role: '2',
            name: 'rideRequestByDriver',
          };
          //sending accept notification to passenger
          if (requestToPassenger.userId.fcmToken)
            await notificationServices.newNotification(
              notificationInfo.rideRequestToDriver.body +
                ` ${driverRequestToPassenger.userId.firstName} ${driverRequestToPassenger.userId.lastName}`,
              notificationInfo.rideRequestToDriver.title,
              requestToPassenger.userId.fcmToken,
              data,
              process.env.STORAGEBASEURL +
                driverRequestToPassenger.userId.profileImage
            );
        } else {
          // console.log("3");
          scheduleRideServices.pullDriverRequest(scheduleId, routeId);
          socket.emit(
            socketEmitters.ERROR,
            JSON.stringify(encryptData({ msg: 'Request not sent!' }))
          );
        }
      } else {
        socket.emit(
          socketEmitters.ERROR,
          JSON.stringify(
            encryptData({ msg: 'Already requested or accepted by some one!' })
          )
        );
      }
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        await err.save();
      } catch {}
      console.log(error);
      socket.emit(
        socketEmitters.ERROR,
        JSON.stringify(encryptData({ msg: error.message }))
      );
    }
  });
};
