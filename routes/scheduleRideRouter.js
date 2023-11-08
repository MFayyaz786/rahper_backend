const express = require('express');
const scheduleRideRouter = express.Router();
const asyncHandler = require('express-async-handler');
const driverRouteServices = require('../services/driverRouteServices');
const scheduleRideServices = require('../services/scheduleRideServices');
const zindigiWalletServerices = require('../services/zindigiWalletServices');
const encryptData = require('../utils/encryptData');
const { getUserSocket } = require('../utils/userSocketId');
const convertMobileFormate = require('../utils/convertMobileFormate');
const userServices = require('../services/userServices');
const priceCalculator = require('../utils/priceCalculator');
const notificationInfo = require('../utils/notificationsInfo');
const notificationServices = require('../services/notifcationServices');
const moment = require('moment/moment');
const paymentMethod = require('../utils/paymentMethod');
const userWalletServices = require('../services/userWalletServices');

//adding new passenger schedule
scheduleRideRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const {
      userId,
      startPoint,
      endPoint,
      date,
      startTime,
      endTime,
      distance,
      isScheduled,
      availableSeats,
      gender,
      polyline,
      bounds_sw,
      bounds_ne,
      duration,
      corporateCode,
      flag,
    } = req.body;
    const wallet = await userWalletServices.getWallet(userId);
    if (wallet.wallet < 0) {
      res
        .status(400)
        .send({ msg: 'Please pay your due amount from your wallet!' });

      return;
    }
    const scheduleRide = await scheduleRideServices.schedule(
      userId,
      startPoint,
      endPoint,
      date,
      startTime,
      endTime,
      distance,
      isScheduled,
      availableSeats,
      gender,
      polyline,
      bounds_sw,
      bounds_ne,
      duration,
      corporateCode
    );

    if (scheduleRide) {
     // console.log("scheduleRide: ", scheduleRide);
      const matchedDrivers = await scheduleRideServices.matchedDrivers(
        scheduleRide._id
        );
        console.log("matchedDrivers: ", matchedDrivers.nearestDriver);
      const io = req.app.get('socket');
      matchedDrivers.nearestDriver.forEach((item) => {
        const userSocket = getUserSocket(item.userId._id.toString());
        if (userSocket) {
          io.to(userSocket.socketId).emit('newRequest');
        }
        if (item.userId.fcmToken) {
          const data = {
            routeId: item._id.toString(),
            role: '1',
            name: 'newPassengerMatch',
          };
          //sending accept notification to passenger
          notificationServices.newNotification(
            notificationInfo.newPassengerMatch.body,
            notificationInfo.newPassengerMatch.title,
            item.userId.fcmToken,
            data,
            null
          );
        }
        //console.log("item.userId.requestAndMatch", item.userId);
        if (!item.userId.requestAndMatch) {
          console.log("called add new passenger schedule")
          //before was use it userServices.updateMatchAndRequestStatus(userId, 'request', 1, true);
          //making it 2
          userServices.updateMatchAndRequestStatus(userId, 'request', 2, true);
          userServices.updateMatchAndRequestStatus(
            item.userId._id,
            "request",
            1,
            true
          );

        }
      });
      res.status(201).send({ msg: 'Ride scheduled', id: scheduleRide._id });
    } else {
      res.status(422).send({ msg: 'Ride did not schedule' });
    }
  })
);

scheduleRideRouter.post(
  '/recursive',
  asyncHandler(async (req, res) => {
    const {
      userId,
      startPoint,
      endPoint,
      date,
      startTime,
      endTime,
      distance,
      isScheduled,
      availableSeats,
      gender,
      polyline,
      bounds_sw,
      bounds_ne,
      duration,
      corporateCode,
      flag, // to identify payment method
      startDate,
      endDate,
      days,
    } = req.body;
    const wallet = await userWalletServices.getWallet(userId);
    if (wallet.wallet < 0) {
      res
        .status(400)
        .send({ msg: 'Please pay your due amount from your wallet!' });

      return;
    }
    const scheduleRides = await scheduleRideServices.recurringSchedule(
      userId,
      startPoint,
      endPoint,
      date,
      startTime,
      endTime,
      distance,
      isScheduled,
      availableSeats,
      gender,
      polyline,
      bounds_sw,
      bounds_ne,
      duration,
      corporateCode,
      startDate,
      endDate,
      days
    );

    if (scheduleRides.length > 0) {
      res.status(201).send({ msg: 'Ride scheduled' });
      for (const scheduleRide of scheduleRides) {
        // console.log(data);
        // console.log({ id: scheduleRide._id });
        const matchedDrivers = await scheduleRideServices.matchedDrivers(
          scheduleRide._id
        );
        const io = req.app.get('socket');
        matchedDrivers.nearestDriver.forEach((item) => {
          const userSocket = getUserSocket(item.userId._id.toString());
          if (userSocket) {
            io.to(userSocket.socketId).emit('newRequest');
          }
          if (item.userId.fcmToken) {
            const data = {
              routeId: item._id.toString(),
              role: '1',
              name: 'newPassengerMatch',
            };
            //sending accept notification to passenger
            notificationServices.newNotification(
              notificationInfo.newPassengerMatch.body,
              notificationInfo.newPassengerMatch.title,
              item.userId.fcmToken,
              data,
              null
            );
          }
          if (!item.userId.requestAndMatch) {
            userServices.updateMatchAndRequestStatus(
              userId,
              'request',
              1,
              true
            );
          }
        });
      }
    } else {
      res.status(422).send({ msg: 'Ride did not schedule' });
    }
  })
);

scheduleRideRouter.post(
  '/update',
  asyncHandler(async (req, res) => {
    res.send({ msg: 'Define update api' });
  })
);

//geting a passenger's schedule by it's id
scheduleRideRouter.post(
  '/getbyid',
  asyncHandler(async (req, res) => {
    const { rideId } = req.body;
    const ride = await scheduleRideServices.getById(rideId);
    if (ride) {
      res.status(200).send({ msg: 'Ride found', data: ride });
    } else {
      res.status(400).send({ msg: 'Ride not found' });
    }
  })
);

//deleting a passenger's schedule
scheduleRideRouter.post(
  '/deletebyid',
  asyncHandler(async (req, res) => {
    const { rideId } = req.body;
    const ride = await scheduleRideServices.delete(rideId);
    if (ride) {
      res.status(200).send({ msg: 'Ride deleted', data: ride });
    } else {
      res.status(400).send({ msg: 'Ride already deleted' });
    }
  })
);

//geting user/passengers all schedules list
scheduleRideRouter.post(
  '/getuserschedules?',
  asyncHandler(async (req, res) => {
    const { page } = req.query;
    const skip = 5;
    const { userId } = req.body;
    let [list] = await Promise.all([
      scheduleRideServices.getuserSchedules(userId),
     // userServices.updateMatchAndRequestStatus(userId, "all", 2, false),
    ]);
    list = list.slice((page || 0) * skip, skip * (page || 0) + skip);
    res.status(200).send({ data: list });
  })
);

//route to find match driver rotues for a passenger schedule
scheduleRideRouter.post(
  '/getmatcheddriver',
  asyncHandler(async (req, res) => {
    const { scheduleId, isScheduled ,userId} = req.body;
    const list = await scheduleRideServices.matchedDrivers(
      scheduleId,
      isScheduled
    );
       userServices.updateMatchAndRequestStatus(userId, "all", 2, false),
         res.status(200).send({ msg: "Matched drivers list", data: list });
    try {
      // const io = req.app.get("socket");
      // list.forEach((item) => {
      //   if (item.userId && item.userId.fcmToken) {
      //     const userSocket = getUserSocket(item.userId._id.toString());
      //     if (userSocket) {
      //       io.to(userSocket.socketId).emit("refreshPassengers");
      //     }
      //   }
      // });
    } catch (error) {
      console.log(error);
    }
  })
);

//soft save scheule route to save now's schedule for later/ as scheduled
scheduleRideRouter.post(
  '/softsave',
  asyncHandler(async (req, res) => {
    const { scheduleId } = req.body;
    const result = await scheduleRideServices.softSave(scheduleId);
    if (result) {
      res.status(200).send({ msg: 'Schedule saved', data: result });
    } else {
      res.status(400).send({ msg: 'Schedule not saved' });
    }
  })
);

//route for rescheduling a completed passenger schedule
scheduleRideRouter.post(
  '/reschedule',
  asyncHandler(async (req, res) => {
    const { scheduleId, date, startTime, endTime, flag } = req.body;
    const schedule = await scheduleRideServices.getById(scheduleId);
    const { userId } = schedule;

    const wallet = await userWalletServices.getWallet(userId);
    if (wallet.wallet < 0) {
      res
        .status(400)
        .send({ msg: 'Please pay your due amount from your Wallet!' });
      return;
    }
    const result = await scheduleRideServices.reSchedule(
      scheduleId,
      date,
      startTime,
      endTime
    );
    if (result) {
      const matchedDrivers = await scheduleRideServices.matchedDrivers(
        result._id
      );
      const io = req.app.get('socket');
      matchedDrivers.nearestDriver.forEach((item) => {
        const userSocket = getUserSocket(item.userId._id.toString());
        if (userSocket) {
          io.to(userSocket.socketId).emit('newRequest');
        }
        if (item.userId.fcmToken) {
          const data = {
            routeId: item._id.toString(),
            role: '1',
            name: 'newPassengerMatch',
          };

          //sending accept notification to passenger
          notificationServices.newNotification(
            notificationInfo.newPassengerMatch.body,
            notificationInfo.newPassengerMatch.title,
            item.userId.fcmToken,
            data,
            null
          );
        }
        if (!item.userId.requestAndMatch) {
          userServices.updateMatchAndRequestStatus(userId, 'request', 1, true);
        }
      });
      res.status(200).send({ msg: 'Rescheduled!', data: result });
    } else {
      res.status(400).send({ msg: 'Failed to reschedule!' });
    }
  })
);

//sokcet's alternate routes
{
  scheduleRideRouter.post(
    '/requestforride',
    asyncHandler(async (req, res) => {
      const { scheduleId, routeId } = req.body;
      const updateScheduleRequest = await scheduleRideServices.newRequest(
        scheduleId,
        routeId
      );
      const updateRouteRequest = await driverRouteServices.newRequest(
        routeId,
        scheduleId
      );

      if (updateScheduleRequest && updateRouteRequest) {
        const socket = req.app.get('socket');
        const userSocketId = getUserSocket(
          updateRouteRequest.userId.toString()
        );
        // console.log(userSocketId);
        socket
          .to(userSocketId.socketId)
          .emit(
            'newrequest',
            JSON.stringify(encryptData({ request: updateScheduleRequest }))
          );
        res.status(200).send({ msg: 'Request sent' });
      } else {
        res.status(400).send({ msg: 'Request not sent' });
      }
    })
  );

  scheduleRideRouter.post(
    '/cancelrequest',
    asyncHandler(async (req, res) => {
      const { routeId, scheduleId } = req.body;
      const cancelDriver = await driverRouteServices.cancelRequest(
        routeId,
        scheduleId
      );
      if (cancelDriver) {
        const cancelByPassenger = await scheduleRideServices.cancelRequest(
          scheduleId,
          routeId
        );

        if (cancelDriver && cancelByPassenger) {
          const socket = req.app.get('socket');
          const driverSocketId = getUserSocket(cancelDriver.userId.toString());

          if (driverSocketId) {
            socket
              .to(driverSocketId.socketId)
              .emit(
                'requestcancelled',
                JSON.stringify(
                  encryptData({ cancelByPassenger: cancelByPassenger.userId })
                )
              );
          }
          res.status(200).send({ msg: 'Request cancelled' });
        }
      } else {
        res
          .status(400)
          .send({ msg: 'Unable to cancel request/already cancelled' });
      }
    })
  );
}

scheduleRideRouter.get(
  '/schedules?',
  asyncHandler(async (req, res) => {
    const { userId, check } = req.query;
    var result = [];
    if (check === 'total') {
      result = await scheduleRideServices.totalRides(userId);
    } else if (check === 'completed') {
      result = await scheduleRideServices.completedRides(userId);
    } else if (check === 'cancelled') {
      result = await scheduleRideServices.cancelledRides(userId);
    } else if (check === 'upcoming') {
      result = await scheduleRideServices.upcomingSchedules(userId);
    }
    res.send({ msg: 'rides list', data: result });
  })
);

scheduleRideRouter.get(
  '/estimatedFare?',
  asyncHandler(async (req, res) => {
    const { distance, corporateCode } = req.query;
    const estimatedFare = await priceCalculator(10, distance, corporateCode);
    res.send({ msg: 'Fare estimation', data: { estimatedFare } });
  })
);
module.exports = scheduleRideRouter;
