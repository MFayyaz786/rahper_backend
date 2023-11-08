const express = require('express');
const asyncHandler = require('express-async-handler');
const driverRouteServices = require('../services/driverRouteServices');
const notificationServices = require('../services/notifcationServices');
const scheduleRideServices = require('../services/scheduleRideServices');
const userServices = require('../services/userServices');
const encryptData = require('../utils/encryptData');

const notificationInfo = require('../utils/notificationsInfo');
const priceCalculator = require('../utils/priceCalculator');
const scheduleReminder = require('../utils/scheduleReminder');
const { getUserSocket } = require('../utils/userSocketId');
const driverRouteRouter = express.Router();

//adding a new driver scheudle route
driverRouteRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const {
      userId,
      startPoint,
      endPoint,
      date,
      time,
      isScheduled,
      availableSeats,
      gender,
      polyline,
      bounds_sw,
      bounds_ne,
      kmLeverage,
      distance,
      duration,
      vehicleId,
      corporateCode,
    } = req.body;
    /**************Zindigi wallet check**********************/

    // const isZindigiLinked = await userServices.isZindigiLinked(userId);
    // if (!isZindigiLinked) {
    //   const userSocket = getUserSocket(userId);
    //   if (userSocket) {
    //     const io = req.app.get("socket");
    //     io.to(userSocket.socketId).emit(
    //       "error",
    //       JSON.stringify(
    //         encryptData({ msg: "Please link your Zindigi Wallet!" })
    //       )
    //     );
    //   }
    //   //408 status code means that wallet is not linked with user account
    //   res.status(408).send({ msg: "Please link your Zindigi Wallet!" });
    //   return;
    // }

    if (isScheduled) {
      // const user = await userServices.getUserById(userId);
      if (vehicleId) {
        const route = await driverRouteServices.defineRoute(
          userId,
          startPoint,
          endPoint,
          date,
          isScheduled,
          availableSeats,
          vehicleId,
          gender,
          polyline,
          bounds_sw,
          bounds_ne,
          kmLeverage,
          distance,
          duration,
          corporateCode
        );
        if (route) {
          res.status(201).send({
            msg: 'Route created!',
            id: route._id,
          });

          const routeId = route._id.toString();
          const passengers = await driverRouteServices.matchedPassengers(
            routeId,
            false
          );
          console.log(passengers);
          const io = req.app.get('socket');
          passengers.forEach((passenger) => {
            const userSocket = getUserSocket(passenger.userId._id.toString());
            if (userSocket)
              io.to(userSocket.socketId).emit(
                'refresh',
                JSON.stringify(encryptData({ msg: 'New Driver' }))
              );
          });
          await Promise.all(
            passengers.map(async (passenger) => {
              const data = {
                scheduleId: passenger._id.toString(),
                role: '2',
                name: 'newDriverMatch',
              };
              if (passenger.userId.fcmToken)
                await notificationServices.newNotification(
                  notificationInfo.newDriverMatch.body,
                  notificationInfo.newDriverMatch.title,
                  passenger.userId.fcmToken,
                  data,
                  null
                );
            })
          );
          const driverSocket = getUserSocket(userId);
          if (driverSocket)
            io.to(driverSocket.socketId).emit(
              'refreshDashboard',
              JSON.stringify(encryptData({ msg: 'Refresh Dashboard' }))
            );
          const reminderTime = new Date(route.date);
          reminderTime.setMinutes(reminderTime.getMinutes() - 5);
          if (reminderTime > new Date())
            scheduleReminder(
              reminderTime,
              route._id.toString(),
              route.userId.toString()
            );
        } else {
          res.status(422).send({ msg: 'Route not define' });
        }
      } else {
        res.status(400).send({ msg: 'Add a vehicle' });
      }
    } else {
      const validateNowRoute = await driverRouteServices.validateNowRoute(
        userId
      );
      if (validateNowRoute) {
        res.status(409).send({ msg: 'You can make only one route for now!' });
      } else {
        // const user = await userServices.getUserById(userId);
        if (vehicleId) {
          const route = await driverRouteServices.defineRoute(
            userId,
            startPoint,
            endPoint,
            date,
            isScheduled,
            availableSeats,
            vehicleId,
            gender,
            polyline,
            bounds_sw,
            bounds_ne,
            kmLeverage,
            distance,
            duration,
            corporateCode
          );
          if (route) {
            res.status(201).send({
              msg: 'rotue defined',
              id: route._id,
            });
            const routeId = route._id.toString();
            const passengers = await driverRouteServices.matchedPassengers(
              routeId,
              false
            );
            const io = req.app.get('socket');
            passengers.forEach((passenger) => {
              const userSocket = getUserSocket(passenger.userId._id.toString());
              if (userSocket)
                io.to(userSocket.socketId).emit(
                  'refresh',
                  JSON.stringify(encryptData({ msg: 'New Driver' }))
                );
            });
            await Promise.all(
              passengers.map(async (passenger) => {
                const data = {
                  scheduleId: passenger._id.toString(),
                  role: '2',
                  name: 'newDriverMatch',
                };
                if (passenger.userId.fcmToken)
                  await notificationServices.newNotification(
                    notificationInfo.newDriverMatch.body,
                    notificationInfo.newDriverMatch.title,
                    passenger.userId.fcmToken,
                    data,
                    null
                  );
              })
            );
            const driverSocket = getUserSocket(userId);
            if (driverSocket)
              io.to(driverSocket.socketId).emit(
                'refreshDashboard',
                JSON.stringify(encryptData({ msg: 'Refresh Dashboard' }))
              );
            const reminderTime = new Date(route.date);
            reminderTime.setMinutes(reminderTime.getMinutes() - 5);
            if (reminderTime > new Date())
              scheduleReminder(
                reminderTime,
                route._id.toString(),
                route.userId.toString()
              );
          } else {
            res.status(422).send({ msg: 'Route not define' });
          }
        } else {
          res.status(400).send({ msg: 'Add a vehicle' });
        }
      }
    }
  })
);

driverRouteRouter.post(
  '/recursive',
  asyncHandler(async (req, res) => {
    const {
      userId,
      startPoint,
      endPoint,
      isScheduled,
      availableSeats,
      gender,
      polyline,
      bounds_sw,
      bounds_ne,
      kmLeverage,
      distance,
      duration,
      vehicleId,
      corporateCode,
      startDate,
      endDate,
      days,
    } = req.body;
    // console.log(req.body);
    if (vehicleId) {
      const routes = await driverRouteServices.defineRecurringRoutes(
        userId,
        startPoint,
        endPoint,
        isScheduled,
        availableSeats,
        vehicleId,
        gender,
        polyline,
        bounds_sw,
        bounds_ne,
        kmLeverage,
        distance,
        duration,
        corporateCode,
        startDate,
        endDate,
        days
      );
      if (routes.length > 0) {
        res.status(201).send({
          msg: 'Route created!',
        });

        for (const route of routes) {
          const routeId = route._id.toString();
          const passengers = await driverRouteServices.matchedPassengers(
            routeId,
            false
          );
          const io = req.app.get('socket');
          passengers.forEach((passenger) => {
            const userSocket = getUserSocket(passenger.userId._id.toString());
            if (userSocket) {
              io.to(userSocket.socketId).emit(
                'refresh',
                JSON.stringify(encryptData({ msg: 'New Driver' }))
              );
            }
          });
          await Promise.all(
            passengers.map(async (passenger) => {
              const data = {
                scheduleId: passenger._id.toString(),
                role: '2',
                name: 'newDriverMatch',
              };
              if (passenger.userId.fcmToken) {
                await notificationServices.newNotification(
                  notificationInfo.newDriverMatch.body,
                  notificationInfo.newDriverMatch.title,
                  passenger.userId.fcmToken,
                  data,
                  null
                );
              }
            })
          );
          const driverSocket = getUserSocket(userId);
          if (driverSocket) {
            io.to(driverSocket.socketId).emit(
              'refreshDashboard',
              JSON.stringify(encryptData({ msg: 'Refresh Dashboard' }))
            );
          }
          const reminderTime = new Date(route.date);
          reminderTime.setMinutes(reminderTime.getMinutes() - 5);
          if (reminderTime > new Date()) {
            scheduleReminder(
              reminderTime,
              route._id.toString(),
              route.userId.toString()
            );
          }
        }
      } else {
        res.status(422).send({ msg: 'Route not define' });
      }
    } else {
      res.status(400).send({ msg: 'Add a vehicle' });
    }
  })
);
//route to reschedule a driver schedule
driverRouteRouter.post(
  '/reschedule',
  asyncHandler(async (req, res) => {
    const { routeId, date, vehicleId } = req.body;
    const route = await driverRouteServices.routeById(routeId);
    if (route == null) {
      res.status(400).send({ msg: '' });
    }
    const { userId } = route;
    // const isZindigiLinked = await userServices.isZindigiLinked(userId);
    // if (!isZindigiLinked) {
    //   const userSocket = getUserSocket(userId);
    //   if (userSocket) {
    //     const io = req.app.get("socket");
    //     io.to(userSocket.socketId).emit(
    //       "error",
    //       JSON.stringify(
    //         encryptData({ msg: "Please link your Zindigi Wallet!" })
    //       )
    //     );
    //   }
    //   //408 status code means that wallet is not linked with user account
    //   res.status(408).send({ msg: "Please link your Zindigi Wallet!" });
    //   return;
    // }
    const result = await driverRouteServices.reSchedule(
      routeId,
      date,
      vehicleId
    );
    if (result) {
      res.status(200).send({ msg: 'Route re-scheduled!', data: result });

      const reRouteId = result._id.toString();
      const passengers = await driverRouteServices.matchedPassengers(
        reRouteId,
        false
      );
      const io = req.app.get('socket');
      passengers.forEach((passenger) => {
        const userSocket = getUserSocket(passenger.userId._id.toString());
        if (userSocket) {
          io.to(userSocket.socketId).emit(
            'refresh',
            JSON.stringify(encryptData({ msg: 'New Driver' }))
          );
        }
      });
      await Promise.all(
        passengers.map(async (passenger) => {
          const data = {
            scheduleId: passenger._id.toString(),
            role: '2',
            name: 'newDriverMatch',
          };
          // console.log({ passenger });
          if (passenger.userId.fcmToken)
            await notificationServices.newNotification(
              notificationInfo.newDriverMatch.body,
              notificationInfo.newDriverMatch.title,
              passenger.userId.fcmToken,
              data,
              null
            );
        })
      );
      const driverSocket = getUserSocket(userId._id.toString());
      if (driverSocket)
        io.to(driverSocket.socketId).emit(
          'refreshDashboard',
          JSON.stringify(encryptData({ msg: 'Refresh Dashboard' }))
        );
      const reminderTime = new Date(result.date);
      reminderTime.setMinutes(reminderTime.getMinutes() - 5);
      if (reminderTime > new Date())
        scheduleReminder(
          reminderTime,
          result._id.toString(),
          result.userId._id.toString()
        );
    } else {
      res.status(400).send({ msg: 'Route not re-scheudled!' });
    }
  })
);

//route for diver to update driver schedule info
driverRouteRouter.post(
  '/update',
  asyncHandler(async (req, res) => {
    const { rideId, startPoint, endPoint, date, time, availableSeats } =
      req.body;
    const check = true; //not in active ride
    if (!check) {
      const updateRoute = await driverRouteServices.updateRoute(
        rideId,
        startPoint,
        endPoint,
        date,
        time,
        availableSeats
      );
      if (updateRoute) {
        res.status(200).send({
          msg: 'Route updated',
          data: updateRoute,
        });
      } else {
        res.status(400).send({ msg: 'Route not updated' });
      }
    } else {
      res.status(400).send({ msg: 'Unable to update route' });
    }
  })
);
//route for driver to get all driver's routes
driverRouteRouter.post(
  '/driverroutes?',
  asyncHandler(async (req, res) => {
    const skip = 5;
    const { page } = req.query;
    const { userId } = req.body;
    let [list] = await Promise.all([
      driverRouteServices.driverRoutes(userId),
      //before       userServices.updateMatchAndRequestStatus(userId, 'all', 1, false),
      //userServices.updateMatchAndRequestStatus(userId, "all", 1, false),
    ]);
    list = list.slice((page || 0) * skip, skip * (page || 0) + skip);
    console.log("list",list)
    res.status(200).send({ msg: 'User routes/schedules list', data: list });
  })
);

driverRouteRouter.post(
  '/getrequests',
  asyncHandler(async (req, res) => {
    // console.log("here");
    const { routeId,ownerId } = req.body;
    console.log("ownerId: ", ownerId);
    const [list, matchedPassengers] = await Promise.all([
      driverRouteServices.getRequests(routeId),
      driverRouteServices.matchedPassengers(routeId, true),
      userServices.updateMatchAndRequestStatus(ownerId, "all", 1, false),
    ]);
    // console.log(matchedPassengers);
    //new update
     res.status(200).send({
       msg: "Passenger requests",
       data: list,
       matchedPassengers,
     });
  })
);

//routes for socket's alternate
{
  driverRouteRouter.post(
    '/getroutematched',
    asyncHandler(async (req, res) => {
      const { routeId } = req.body;
      const result = await driverRouteServices.getPassengerSchedules(routeId);
      res.status(200).send({
        msg: 'Pessenger schedules list',
        data: result.matchedPassengers,
      });
    })
  );

  driverRouteRouter.post(
    '/rejectrequest',
    asyncHandler(async (req, res) => {
      const { routeId, scheduleId } = req.body;
      const rejectedByDriver = await driverRouteServices.rejectRequest(
        routeId,
        scheduleId
      );

      const rejectedPassenger = await scheduleRideServices.rejectRequest(
        scheduleId,
        routeId
      );

      if (rejectedByDriver && rejectedPassenger) {
        const socket = req.app.get('socket');
        const passengerSocketId = getUserSocket(
          rejectedPassenger.userId.toString()
        );
        //  console.log(passengerSocketId);
        socket
          .to(passengerSocketId.socketId)
          .emit(
            'requestrejected',
            JSON.stringify(
              encryptData({ rejectedByDriver: rejectedByDriver.userId })
            )
          );
        res.status(200).send({ msg: 'Request rjected' });
      } else {
        res.status(400).send({ msg: 'Reqest already rejected' });
      }
    })
  );

  driverRouteRouter.post(
    '/acceptrequest',
    asyncHandler(async (req, res) => {
      const { routeId, scheduleId } = req.body;
      const acceptedByDriver = await driverRouteServices.acceptRequest(
        routeId,
        scheduleId
      );
      if (acceptedByDriver) {
        const acceptedPassenger = await scheduleRideServices.acceptedRequest(
          scheduleId,
          routeId
        );

        if (acceptedByDriver && acceptedPassenger) {
          const socket = req.app.get('socket');
          const passengerSocketId = getUserSocket(
            acceptedPassenger.userId.toString()
          );
          //console.log(passengerSocketId);
          passengerSocketId &&
            socket
              .to(passengerSocketId.socketId)
              .emit(
                'requestaccepted',
                JSON.stringify(
                  encryptData({ acceptedByDriver: acceptedByDriver.userId })
                )
              );
          res.status(200).send({ msg: 'Request accepted' });
        }
      } else {
        res
          .status(400)
          .send({ msg: 'Unable to accept request/already accepted' });
      }
    })
  );

  driverRouteRouter.post(
    '/cancelrequest',
    asyncHandler(async (req, res) => {
      const { routeId, scheduleId } = req.body;
      const cancelByDriver = await driverRouteServices.cancelRequest(
        routeId,
        scheduleId
      );
      if (cancelByDriver) {
        const cancelledPassenger = await scheduleRideServices.cancelRequest(
          scheduleId,
          routeId
        );

        if (cancelByDriver && cancelledPassenger) {
          const socket = req.app.get('socket');
          const passengerSocketId = getUserSocket(
            cancelledPassenger.userId.toString()
          );
          //console.log(passengerSocketId);
          passengerSocketId &&
            socket
              .to(passengerSocketId.socketId)
              .emit(
                'requestcancelled',
                JSON.stringify(
                  encryptData({ cancelByDriver: cancelByDriver.userId })
                )
              );
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

//api endpoint for any acitve ride
driverRouteRouter.post(
  '/anyactiveRide',
  asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const check = await driverRouteServices.anyActiveRide(userId);
    if (check) {
      res.status(200).send({ msg: 'One active ride' });
    } else {
      res.status(400).send({ msg: 'No acitve ride' });
    }
  })
);

driverRouteRouter.get(
  '/schedules?',
  asyncHandler(async (req, res) => {
    const { userId, check } = req.query;
    var result = [];
    if (check === 'total') {
      result = await driverRouteServices.totalRides(userId);
    } else if (check === 'completed') {
      result = await driverRouteServices.completedRides(userId);
    } else if (check === 'cancelled') {
      result = await driverRouteServices.cancelledRides(userId);
    } else if (check === 'upcoming') {
      result = await driverRouteServices.upcomingSchedules(userId);
    }
    res.send({ msg: 'rides list', data: result });
    // const [completed, cancelled, total, upcoming] = await Promise.all([
    //   driverRouteServices.completedRides(userId),
    //   driverRouteServices.cancelledRides(userId),
    //   driverRouteServices.totalRides(userId),
    //   driverRouteServices.upcoming(userId),
    // ]);
    // res.send({ data: { completed, cancelled, total, upcoming } });
  })
);

driverRouteRouter.post(
  '/livelocation',
  asyncHandler(async (req, res) => {
    const { userId, routeId, location } = req.body;
    // console.log({ routeId, location });
    const io = req.app.get('socket');
    //broadcasting to room
    io.to(routeId).emit(
      'refreshLiveLocation',
      JSON.stringify(encryptData(location))
    );
    io.to('admin').emit(
      'liveLocationAdminPanel',
      JSON.stringify({ userId, routeId, location })
    );
    await driverRouteServices.updateLastLocation(routeId, location);
    res.status(200).send();
  })
);

//end to get matched passenger with driver route
driverRouteRouter.get(
  '/matchedPassengers?',
  asyncHandler(async (req, res) => {
    const { routeId } = req.query;
    const matchedPassengers = await driverRouteServices.matchedPassengers(
      routeId,
      true
    );

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
    res
      .status(200)
      .send({ msg: 'Matched passengers list!', data: matchedPassengers });
  })
);

module.exports = driverRouteRouter;
