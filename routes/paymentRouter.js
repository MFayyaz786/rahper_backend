const express = require('express');
const expressAsyncHandler = require('express-async-handler');
const { getIO } = require('../io');
const exceptionErrorsModel = require('../models/exceptionErrorsModel');
const activeRideServices = require('../services/activeRideServices');
const failedPaymentLimitServices = require('../services/failedPaymentLimitServices');
const failedPaymentServices = require('../services/failedPaymentServices');
const historyServices = require('../services/historyServices');
const notificationServices = require('../services/notifcationServices');
const paymentHistoryService = require('../services/paymentHistoryServices');
const scheduleRideServices = require('../services/scheduleRideServices');
const userTopUpServices = require('../services/userTopUpServices');
const userWalletServices = require('../services/userWalletServices');
const encryptData = require('../utils/encryptData');
const notificationInfo = require('../utils/notificationsInfo');
const socketEmitters = require('../utils/socketEmitters');
const { getUserSocket } = require('../utils/userSocketId');
const walletSources = require('../utils/walletSources');
const userServices = require('../services/userServices');
const mailServices = require('../services/mailServices');
const paymentRouter = express.Router();

let io = null;
const setSocket = (IO) => {
  io = IO;
};

paymentRouter.get(
  '/payfast/success?',
  expressAsyncHandler(async (req, res) => {
    // if (process.env.NODE_ENV == 'development') {
    //   const { err_code, transaction_amount } = req.query;
    //   const payFare = req.query;
    //   if (err_code == '000') {
    //     const passengerId = req.query.basket_id;
    //     const ride = await activeRideServices.rideByPassenger(passengerId);
    //     if (ride == null) {
    //       return;
    //     }

    //     const rideId = ride._id.toString();
    //     await paymentHistoryService.new(
    //       rideId,
    //       passengerId,
    //       'payfast',
    //       payFare
    //     );
    //     userWalletServices.updateWallet(
    //       ride.routeId.userId,
    //       transaction_amount,
    //       walletSources.RIDEFARE
    //     );
    //     const schedule = await scheduleRideServices.completeRequest(
    //       passengerId
    //     );
    //     const result = await activeRideServices.completeRide(
    //       rideId,
    //       passengerId,
    //       schedule.bookedSeats
    //       );
    //       console.log("result: ", result);
    //     if (result.result) {
    //       //updating ride and creating a history for passenger and driver
    //       const [updatedResult] = await Promise.all([
    //         activeRideServices.rideById(rideId),
    //         historyServices.newHistory(
    //           result.result.routeId,
    //           passengerId,
    //           true
    //         ),
    //         historyServices.newHistory(
    //           result.result.routeId,
    //           passengerId,
    //           false
    //         ),
    //       ]);
    //       const driverSocket = getUserSocket(
    //         updatedResult.routeId.userId._id.toString()
    //       );

    //       const passengerSocket = getUserSocket(schedule.userId._id.toString());
    //       console.log("passengerSocket: ", passengerSocket);
    //       if (driverSocket) {
    //         //acknowledgement for ride completion to passenger
    //         if (io) {
    //           io.to(driverSocket.socketId).emit('refreshDriverRoutes');
    //           io.to(driverSocket.socketId).emit(
    //             'driverCompleteRide',
    //             JSON.stringify(
    //               encryptData({ ride: updatedResult, finish: result.finish })
    //             )
    //           );
    //         }
    //         // callback(({ ride: updatedResult, finish: result.finish })); //TODO:
    //       }
    //       if (passengerSocket) {
    //         console.log("passengerSocket: ", passengerSocket);
    //         console.log("io: ", io);
    //         if (io) {
    //           console.log("passengerSocket: ", passengerSocket.socketId);
    //           io.to(passengerSocket.socketId).emit(
    //             socketEmitters.UPDATEPASSENGERRIDESTATUS,
    //             JSON.stringify(
    //               encryptData({
    //                 status: 'completed',
    //               })
    //             )
    //           );

    //            console.log(
    //              `Message emitted to socket ID `
    //            );
    //         }
    //       }
    //       const data = {
    //         scheduleId: passengerId,
    //         routeId: result.result.routeId.toString(),
    //         role: '1',
    //         name: 'thankYou',
    //       };
    //       try {
    //         //sending notification to passenger
    //         if (schedule && updatedResult)
    //           await notificationServices.newNotification(
    //             `Your ride with ${schedule.userId.firstName} ${schedule.userId.lastName} has been completed`,
    //             notificationInfo.completedPassengerRide.title,
    //             updatedResult.routeId.userId.fcmToken,
    //             data,
    //             process.env.STORAGEBASEURL + schedule.userId.profileImage
    //           );
    //       } catch (error) {
    //         console.log(error.message);
    //       }
    //     }
    //   } else {
    //     const schedule = await scheduleRideServices.getById(
    //       req.query.basket_id
    //     );
    //     const [failedPaymentCount, failedPaymentLimit] = await Promise.all([
    //       failedPaymentServices.new(req.query.basket_id, req.query),
    //       failedPaymentLimitServices.get(),
    //     ]);
    //     if (failedPaymentCount == failedPaymentLimit?.limit) {
    //       const passengerId = req.query.basket_id;
    //       const ride = await activeRideServices.rideByPassenger(passengerId);
    //       if (ride == null) {
    //         return;
    //       }
    //       const rideId = ride._id.toString();
    //       await paymentHistoryService.new(
    //         rideId,
    //         passengerId,
    //         'unpaid',
    //         payFare
    //       );
    //       userWalletServices.updateWallet(
    //         ride.routeId.userId,
    //         transaction_amount,
    //         walletSources.RIDEFARE
    //       );
    //       userWalletServices.updateWallet(
    //         schedule.userId._id.toString(),
    //         Number(transaction_amount) * -1,
    //         walletSources.RIDEFARE
    //       );
    //       const schedule = await scheduleRideServices.completeRequest(
    //         passengerId
    //       );
    //       const result = await activeRideServices.completeRide(
    //         rideId,
    //         passengerId,
    //         schedule.bookedSeats
    //       );
    //       if (result.result) {
    //         //updating ride and creating a history for passenger and driver
    //         const [updatedResult] = await Promise.all([
    //           activeRideServices.rideById(rideId),
    //           historyServices.newHistory(
    //             result.result.routeId,
    //             passengerId,
    //             true
    //           ),
    //           historyServices.newHistory(
    //             result.result.routeId,
    //             passengerId,
    //             false
    //           ),
    //         ]);
    //         const driverSocket = getUserSocket(
    //           updatedResult.routeId.userId._id.toString()
    //         );
    //         const passengerSocket = getUserSocket(
    //           schedule.userId._id.toString()
    //         );
    //         if (driverSocket) {
    //           //acknowledgement for ride completion to passenger
    //           if (io) {
    //             io.to(driverSocket.socketId).emit('refreshDriverRoutes');
    //             io.to(driverSocket.socketId).emit(
    //               'driverCompleteRide',
    //               JSON.stringify(
    //                 encryptData({ ride: updatedResult, finish: result.finish })
    //               )
    //             );
    //           }
    //           // callback(({ ride: updatedResult, finish: result.finish })); //TODO:
    //         }
    //         if (passengerSocket) {
    //           if (io) {
    //             io.to(passengerSocket.socketId).emit(
    //               socketEmitters.UPDATEPASSENGERRIDESTATUS,
    //               JSON.stringify(
    //                 encryptData({
    //                   status: 'completed',
    //                 })
    //               )
    //             );
    //           }
    //         }
    //         const data = {
    //           scheduleId: passengerId,
    //           routeId: result.result.routeId.toString(),
    //           role: '1',
    //           name: 'thankYou',
    //         };
    //         try {
    //           //sending notification to passenger
    //           if (schedule && updatedResult)
    //             await notificationServices.newNotification(
    //               `Your ride with ${schedule.userId.firstName} ${schedule.userId.lastName} has been completed`,
    //               notificationInfo.completedPassengerRide.title,
    //               updatedResult.routeId.userId.fcmToken,
    //               data,
    //               process.env.STORAGEBASEURL + schedule.userId.profileImage
    //             );
    //         } catch (error) {
    //           console.log(error.message);
    //         }
    //       }

    //       return;
    //     }
    //     const passengerSocket = getUserSocket(schedule.userId._id.toString());
    //     if (passengerSocket) {
    //       if (io) {
    //         io.to(passengerSocket.socketId).emit(
    //           socketEmitters.ERROR,
    //           encryptData({
    //             msg: req.query.err_msg,
    //           })
    //         );
    //       }
    //     }
    //   }

    // } else res.send(req.query);
  res.sendStatus(200);
  try {
    const { err_code, transaction_amount } = req.query;
    const payFare = req.query;
    if (err_code == "000") {
      const passengerId = req.query.basket_id;
      const ride = await activeRideServices.rideByPassenger(passengerId);
      if (ride == null) {
        return;
      }
      const rideId = ride._id.toString();
      const paymentHistory = await paymentHistoryService.new(
        rideId,
        passengerId,
        "payfast",
        payFare
      );
      userWalletServices.updateWallet(
        ride.routeId.userId,
        transaction_amount,
        walletSources.RIDEFARE
      );
      const schedule = await scheduleRideServices.completeRequest(passengerId);
      const result = await activeRideServices.completeRide(
        rideId,
        passengerId,
        schedule.bookedSeats
      );
      const userData = await userServices.getUserById(schedule.userId._id);
      mailServices.sentMail(userData.email, null, "receipt", {
        receiptId: paymentHistory._id,
        date: schedule.date,
        time: schedule.time,
        method: "unpaid",
        pickupLocation: schedule.startPoint.placeName,
        dropOffLocation: schedule.endPoint.placeName,
        fare: transaction_amount,
      });
      if (result.result) {
        //updating ride and creating a history for passenger and driver
        const [updatedResult] = await Promise.all([
          activeRideServices.rideById(rideId),
          historyServices.newHistory(result.result.routeId, passengerId, true),
          historyServices.newHistory(result.result.routeId, passengerId, false),
        ]);
        const driverSocket = getUserSocket(
          updatedResult.routeId.userId._id.toString()
        );
        const passengerSocket = getUserSocket(schedule.userId._id.toString());
        console.log("passengerSocket: ", passengerSocket);
        if (driverSocket) {
          //acknowledgement for ride completion to passenger
          if (io) {
            io.to(driverSocket.socketId).emit("refreshDriverRoutes");
            io.to(driverSocket.socketId).emit(
              "driverCompleteRide",
              JSON.stringify(
                encryptData({ ride: updatedResult, finish: result.finish })
              )
            );
          }
          // callback(({ ride: updatedResult, finish: result.finish })); //TODO:
        }
        if (passengerSocket) {
          if (io) {
            io.to(passengerSocket.socketId).emit(
              socketEmitters.UPDATEPASSENGERRIDESTATUS,
              JSON.stringify(
                encryptData({
                  status: "completed",
                })
              )
            );
            console.log("socket called");
          }
        }
        const data = {
          scheduleId: passengerId,
          routeId: result.result.routeId.toString(),
          role: "1",
          name: "thankYou",
        };
        try {
          //sending notification to passenger
          await notificationServices.newNotification(
            `Your ride with ${schedule.userId.firstName} ${schedule.userId.lastName} has been completed`,
            notificationInfo.completedPassengerRide.title,
            updatedResult.routeId.userId.fcmToken,
            data,
            process.env.BASEURL + schedule.userId.profileImage
          );
        } catch (error) {
          console.log(error.message);
        }
      }
    } else {
      const scheduleData = await scheduleRideServices.getById(
        req.query.basket_id
      );
      const [failedPaymentCount, failedPaymentLimit] = await Promise.all([
        failedPaymentServices.new(req.body.basket_id, req.body),
        failedPaymentLimitServices.get(),
      ]);
      const isHistoryExist = await paymentHistoryService.getBySchedule(
        req.body.basket_id
      );
      if (isHistoryExist) {
        return;
      }
      if (failedPaymentCount > failedPaymentLimit?.limit) {
        const passengerSocket = getUserSocket(
          scheduleData.userId._id.toString()
        );
        if (passengerSocket) {
          if (io) {
            io.to(passengerSocket.socketId).emit(
              socketEmitters.ERROR,
              encryptData({
                msg: "Ride is already completed",
              })
            );
          }
        }
        return;
      } else if (failedPaymentCount == failedPaymentLimit?.limit) {
        const passengerId = req.body.basket_id;
        const ride = await activeRideServices.rideByPassenger(passengerId);
        if (ride == null) {
          return;
        }

        const rideId = ride._id.toString();
        const paymentHistory = await paymentHistoryService.new(
          rideId,
          passengerId,
          "unpaid",
          payFare
        );
        await userWalletServices.updateWallet(
          ride.routeId.userId,
          transaction_amount,
          walletSources.RIDEFARE
        );

        await userWalletServices.updateWallet(
          scheduleData.userId._id.toString(),
          Number(transaction_amount) * -1,
          walletSources.RIDEFARE
        );

        const schedule = await scheduleRideServices.completeRequest(
          passengerId
        );

        const result = await activeRideServices.completeRide(
          rideId,
          passengerId,
          schedule.bookedSeats
        );

        const userData = await userServices.getUserById(schedule.userId._id);
        mailServices.sentMail(userData.email, null, "receipt", {
          receiptId: paymentHistory._id,
          date: schedule.date,
          time: schedule.time,
          method: "unpaid",
          pickupLocation: schedule.startPoint.placeName,
          dropOffLocation: schedule.endPoint.placeName,
          fare: transaction_amount,
        });

        if (result?.result) {
          //updating ride and creating a history for passenger and driver
          const [updatedResult] = await Promise.all([
            activeRideServices.rideById(rideId),
            historyServices.newHistory(
              result.result.routeId,
              passengerId,
              true
            ),
            historyServices.newHistory(
              result.result.routeId,
              passengerId,
              false
            ),
          ]);
          const driverSocket = getUserSocket(
            updatedResult.routeId.userId._id.toString()
          );
          const passengerSocket = getUserSocket(schedule.userId._id.toString());
          if (driverSocket) {
            //acknowledgement for ride completion to passenger
            if (io) {
              io.to(driverSocket.socketId).emit("refreshDriverRoutes");
              io.to(driverSocket.socketId).emit(
                "driverCompleteRide",
                JSON.stringify(
                  encryptData({ ride: updatedResult, finish: result.finish })
                )
              );
            }
            // callback(({ ride: updatedResult, finish: result.finish })); //TODO:
          }
          if (passengerSocket) {
            if (io) {
              io.to(passengerSocket.socketId).emit(
                socketEmitters.UPDATEPASSENGERRIDESTATUS,
                JSON.stringify(
                  encryptData({
                    status: "completed",
                  })
                )
              );
            }
          }
          const data = {
            scheduleId: passengerId,
            routeId: result.result.routeId.toString(),
            role: "1",
            name: "thankYou",
          };
          try {
            //sending notification to passenger
            if (schedule && updatedResult)
              await notificationServices.newNotification(
                `Your ride with ${schedule.userId.firstName} ${schedule.userId.lastName} has been completed`,
                notificationInfo.completedPassengerRide.title,
                updatedResult.routeId.userId.fcmToken,
                data,
                process.env.STORAGEBASEURL + schedule.userId.profileImage
              );
          } catch (error) {
            console.log(error.message);
          }
        }
        return;
      }
      console.log("scheduleData: ", scheduleData);
      const passengerSocket = getUserSocket(scheduleData.userId._id.toString());
      if (passengerSocket) {
        if (io) {
          io.to(passengerSocket.socketId).emit(
            socketEmitters.ERROR,
            encryptData({
              msg: req.body.err_msg,
            })
          );
        }
      }
    }
  } catch (error) {
    try {
      console.log(error);
      const err = new exceptionErrorsModel({ error });
      await err.save();
    } catch (e) {}
  }
  })
);

paymentRouter.get(
  '/payfast/failure?',
  expressAsyncHandler(async (req, res) => {
    res.send(req.query);
  })
);

paymentRouter.get(
  '/payfast/checkout?',
  expressAsyncHandler(async (req, res) => {
    const { err_code, transaction_amount } = req.query;
    const payFare = req.query;
    if (err_code == '000') {
      const passengerId = req.query.basket_id;
      const ride = await activeRideServices.rideByPassenger(passengerId);
      if (ride == null) {
        return;
      }
      const rideId = ride._id.toString();
      await paymentHistoryService.new(rideId, passengerId, 'payfast', payFare);
      userWalletServices.updateWallet(
        ride.routeId.userId,
        transaction_amount,
        walletSources.RIDEFARE
      );
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
        const driverSocket = getUserSocket(
          updatedResult.routeId.userId._id.toString()
        );
        const passengerSocket = getUserSocket(schedule.userId._id.toString());
        if (driverSocket) {
          //acknowledgement for ride completion to passenger
          if (io) {
            io.to(driverSocket.socketId).emit('refreshDriverRoutes');
            io.to(driverSocket.socketId).emit(
              'driverCompleteRide',
              JSON.stringify(
                encryptData({ ride: updatedResult, finish: result.finish })
              )
            );
          }
          // callback(({ ride: updatedResult, finish: result.finish })); //TODO:
        }
        if (passengerSocket) {
          if (io) {
            io.to(passengerSocket.socketId).emit(
              socketEmitters.UPDATEPASSENGERRIDESTATUS,
              JSON.stringify(
                encryptData({
                  status: 'completed',
                })
              )
            );
          }
        }
        const data = {
          scheduleId: passengerId,
          routeId: result.result.routeId.toString(),
          role: '1',
          name: 'thankYou',
        };
        try {
          //sending notification to passenger
          if (schedule && updatedResult)
            await notificationServices.newNotification(
              `Your ride with ${schedule.userId.firstName} ${schedule.userId.lastName} has been completed`,
              notificationInfo.completedPassengerRide.title,
              updatedResult.routeId.userId.fcmToken,
              data,
              process.env.STORAGEBASEURL + schedule.userId.profileImage
            );
        } catch (error) {
          console.log(error.message);
        }
      }
    } else {
      const schedule = await scheduleRideServices.getById(req.query.basket_id);
      const [failedPaymentCount, failedPaymentLimit] = await Promise.all([
        failedPaymentServices.new(req.query.basket_id, req.query),
        failedPaymentLimitServices.get(),
      ]);
      if (failedPaymentCount == failedPaymentLimit?.limit) {
        const passengerId = req.query.basket_id;
        const ride = await activeRideServices.rideByPassenger(passengerId);
        if (ride == null) {
          return;
        }
        const rideId = ride._id.toString();
        await paymentHistoryService.new(
          rideId,
          passengerId,
          'payfast',
          payFare
        );
        userWalletServices.updateWallet(
          ride.routeId.userId,
          transaction_amount,
          walletSources.RIDEFARE
        );
        userWalletServices.updateWallet(
          schedule.userId._id.toString(),
          Number(transaction_amount) * -1,
          walletSources.RIDEFARE
        );
        const schedule = await scheduleRideServices.completeRequest(
          passengerId
        );
        const result = await activeRideServices.completeRide(
          rideId,
          passengerId,
          schedule.bookedSeats
        );
        if (result.result) {
          //updating ride and creating a history for passenger and driver
          const [updatedResult] = await Promise.all([
            activeRideServices.rideById(rideId),
            historyServices.newHistory(
              result.result.routeId,
              passengerId,
              true
            ),
            historyServices.newHistory(
              result.result.routeId,
              passengerId,
              false
            ),
          ]);
          const driverSocket = getUserSocket(
            updatedResult.routeId.userId._id.toString()
          );
          const passengerSocket = getUserSocket(schedule.userId._id.toString());
          if (driverSocket) {
            //acknowledgement for ride completion to passenger
            if (io) {
              io.to(driverSocket.socketId).emit('refreshDriverRoutes');
              io.to(driverSocket.socketId).emit(
                'driverCompleteRide',
                JSON.stringify(
                  encryptData({ ride: updatedResult, finish: result.finish })
                )
              );
            }
            // callback(({ ride: updatedResult, finish: result.finish })); //TODO:
          }
          if (passengerSocket) {
            if (io) {
              io.to(passengerSocket.socketId).emit(
                socketEmitters.UPDATEPASSENGERRIDESTATUS,
                JSON.stringify(
                  encryptData({
                    status: 'completed',
                  })
                )
              );
            }
          }
          const data = {
            scheduleId: passengerId,
            routeId: result.result.routeId.toString(),
            role: '1',
            name: 'thankYou',
          };
          try {
            //sending notification to passenger
            if (schedule && updatedResult)
              await notificationServices.newNotification(
                `Your ride with ${schedule.userId.firstName} ${schedule.userId.lastName} has been completed`,
                notificationInfo.completedPassengerRide.title,
                updatedResult.routeId.userId.fcmToken,
                data,
                process.env.STORAGEBASEURL + schedule.userId.profileImage
              );
          } catch (error) {
            console.log(error.message);
          }
        }
        return;
      }
      const passengerSocket = getUserSocket(schedule.userId._id.toString());
      if (passengerSocket) {
        if (io) {
          io.to(passengerSocket.socketId).emit(
            socketEmitters.ERROR,
            encryptData({
              msg: req.query.err_msg,
            })
          );
        }
      }
    }
  })
);

paymentRouter.post('/payfast/checkout', async (req, res) => {
 res.sendStatus(200);
 try {
   const { err_code, transaction_amount } = req.body;
   const payFare = req.body;
   if (err_code == "000") {
     const passengerId = req.body.basket_id;
     const ride = await activeRideServices.rideByPassenger(passengerId);
     if (ride == null) {
       return;
     }
     const rideId = ride._id.toString();
     const paymentHistory = await paymentHistoryService.new(
       rideId,
       passengerId,
       "payfast",
       payFare
     );
     userWalletServices.updateWallet(
       ride.routeId.userId,
       transaction_amount,
       walletSources.RIDEFARE
     );
     const schedule = await scheduleRideServices.completeRequest(passengerId);
     const result = await activeRideServices.completeRide(
       rideId,
       passengerId,
       schedule.bookedSeats
     );
     const userData = await userServices.getUserById(schedule.userId._id);
     mailServices.sentMail(userData.email, null, "receipt", {
       receiptId: paymentHistory._id,
       date: schedule.date,
       time: schedule.time,
       method: "unpaid",
       pickupLocation: schedule.startPoint.placeName,
       dropOffLocation: schedule.endPoint.placeName,
       fare: transaction_amount,
     });
     if (result.result) {
       //updating ride and creating a history for passenger and driver
       const [updatedResult] = await Promise.all([
         activeRideServices.rideById(rideId),
         historyServices.newHistory(result.result.routeId, passengerId, true),
         historyServices.newHistory(result.result.routeId, passengerId, false),
       ]);
       const driverSocket = getUserSocket(
         updatedResult.routeId.userId._id.toString()
       );
       const passengerSocket = getUserSocket(schedule.userId._id.toString());
       console.log("passengerSocket: ", passengerSocket);
       if (driverSocket) {
         //acknowledgement for ride completion to passenger
         if (io) {
           io.to(driverSocket.socketId).emit("refreshDriverRoutes");
           io.to(driverSocket.socketId).emit(
             "driverCompleteRide",
             JSON.stringify(
               encryptData({ ride: updatedResult, finish: result.finish })
             )
           );
         }
         // callback(({ ride: updatedResult, finish: result.finish })); //TODO:
       }
       if (passengerSocket) {
         if (io) {
           io.to(passengerSocket.socketId).emit(
             socketEmitters.UPDATEPASSENGERRIDESTATUS,
             JSON.stringify(
               encryptData({
                 status: "completed",
               })
             )
           );
           console.log("socket called");
         }
       }
       const data = {
         scheduleId: passengerId,
         routeId: result.result.routeId.toString(),
         role: "1",
         name: "thankYou",
       };
       try {
         //sending notification to passenger
         await notificationServices.newNotification(
           `Your ride with ${schedule.userId.firstName} ${schedule.userId.lastName} has been completed`,
           notificationInfo.completedPassengerRide.title,
           updatedResult.routeId.userId.fcmToken,
           data,
           process.env.BASEURL + schedule.userId.profileImage
         );
       } catch (error) {
         console.log(error.message);
       }
     }
   } else {
     const scheduleData = await scheduleRideServices.getById(
       req.body.basket_id
     );
     const [failedPaymentCount, failedPaymentLimit] = await Promise.all([
       failedPaymentServices.new(req.body.basket_id, req.body),
       failedPaymentLimitServices.get(),
     ]);
     const isHistoryExist = await paymentHistoryService.getBySchedule(
       req.body.basket_id
     );
     if (isHistoryExist) {
       return;
     }
     if (failedPaymentCount > failedPaymentLimit?.limit) {
       const passengerSocket = getUserSocket(
         scheduleData.userId._id.toString()
       );
       if (passengerSocket) {
         if (io) {
           io.to(passengerSocket.socketId).emit(
             socketEmitters.ERROR,
             encryptData({
               msg: "Ride is already completed",
             })
           );
         }
       }
       return;
     } else if (failedPaymentCount == failedPaymentLimit?.limit) {
       const passengerId = req.body.basket_id;
       const ride = await activeRideServices.rideByPassenger(passengerId);
       if (ride == null) {
         return;
       }

       const rideId = ride._id.toString();
       const paymentHistory = await paymentHistoryService.new(
         rideId,
         passengerId,
         "unpaid",
         payFare
       );
       await userWalletServices.updateWallet(
         ride.routeId.userId,
         transaction_amount,
         walletSources.RIDEFARE
       );

       await userWalletServices.updateWallet(
         scheduleData.userId._id.toString(),
         Number(transaction_amount) * -1,
         walletSources.RIDEFARE
       );

       const schedule = await scheduleRideServices.completeRequest(passengerId);

       const result = await activeRideServices.completeRide(
         rideId,
         passengerId,
         schedule.bookedSeats
       );

       const userData = await userServices.getUserById(schedule.userId._id);
       mailServices.sentMail(userData.email, null, "receipt", {
         receiptId: paymentHistory._id,
         date: schedule.date,
         time: schedule.time,
         method: "unpaid",
         pickupLocation: schedule.startPoint.placeName,
         dropOffLocation: schedule.endPoint.placeName,
         fare: transaction_amount,
       });

       if (result?.result) {
         //updating ride and creating a history for passenger and driver
         const [updatedResult] = await Promise.all([
           activeRideServices.rideById(rideId),
           historyServices.newHistory(result.result.routeId, passengerId, true),
           historyServices.newHistory(
             result.result.routeId,
             passengerId,
             false
           ),
         ]);
         const driverSocket = getUserSocket(
           updatedResult.routeId.userId._id.toString()
         );
         const passengerSocket = getUserSocket(schedule.userId._id.toString());
         if (driverSocket) {
           //acknowledgement for ride completion to passenger
           if (io) {
             io.to(driverSocket.socketId).emit("refreshDriverRoutes");
             io.to(driverSocket.socketId).emit(
               "driverCompleteRide",
               JSON.stringify(
                 encryptData({ ride: updatedResult, finish: result.finish })
               )
             );
           }
           // callback(({ ride: updatedResult, finish: result.finish })); //TODO:
         }
         if (passengerSocket) {
           if (io) {
             io.to(passengerSocket.socketId).emit(
               socketEmitters.UPDATEPASSENGERRIDESTATUS,
               JSON.stringify(
                 encryptData({
                   status: "completed",
                 })
               )
             );
           }
         }
         const data = {
           scheduleId: passengerId,
           routeId: result.result.routeId.toString(),
           role: "1",
           name: "thankYou",
         };
         try {
           //sending notification to passenger
           if (schedule && updatedResult)
             await notificationServices.newNotification(
               `Your ride with ${schedule.userId.firstName} ${schedule.userId.lastName} has been completed`,
               notificationInfo.completedPassengerRide.title,
               updatedResult.routeId.userId.fcmToken,
               data,
               process.env.STORAGEBASEURL + schedule.userId.profileImage
             );
         } catch (error) {
           console.log(error.message);
         }
       }
       return;
     }
     const passengerSocket = getUserSocket(scheduleData.userId._id.toString());
     if (passengerSocket) {
       if (io) {
         io.to(passengerSocket.socketId).emit(
           socketEmitters.ERROR,
           encryptData({
             msg: req.body.err_msg,
           })
         );
       }
     }
   }
 } catch (error) {
   try {
     console.log(error);
     const err = new exceptionErrorsModel({ error });
     await err.save();
   } catch (e) {}
 }
});

paymentRouter.get(
  '/payfast/recharge/success?',
  expressAsyncHandler(async (req, res) => {
    if (process.env.NODE_ENV == 'development') {
      const { err_code, transaction_amount, basket_id } = req.query;
      if (err_code == '000') {
        await userWalletServices.updateWallet(
          basket_id,
          transaction_amount,
          'payfast'
        );
        userTopUpServices.new(basket_id, req.query, 'payfast');
      } else {
      }
      res.send();
    } else {
      res.send();
    }
  })
);

paymentRouter.get(
  '/payfast/recharge/failure?',
  expressAsyncHandler(async (req, res) => {
    res.send(req.query);
  })
);

paymentRouter.get(
  '/payfast/recharge/checkout?',
  expressAsyncHandler(async (req, res) => {
    const { err_code, transaction_amount, basket_id } = req.query;
    if (err_code == '000') {
      await userWalletServices.updateWallet(
        basket_id,
        transaction_amount,
        'payfast'
      );
      userTopUpServices.new(basket_id, req.query, 'payfast');
    } else {
    }
    res.send();
  })
);

paymentRouter.post(
  '/payfast/recharge/checkout',
  expressAsyncHandler(async (req, res) => {
    const { err_code, transaction_amount, basket_id } = req.body;
    if (err_code == '000') {
      await userWalletServices.updateWallet(
        basket_id,
        transaction_amount,
        'payfast'
      );
      userTopUpServices.new(basket_id, req.body, 'payfast');
    } else {
    }
    res.send();
  })
);

module.exports = { paymentRouter, setSocket };
