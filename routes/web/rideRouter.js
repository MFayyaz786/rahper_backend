const express = require('express');
const expressAsyncHandler = require('express-async-handler');
const asyncHandler = require('express-async-handler');
const activeRideServices = require('../../services/activeRideServices');
const driverRouteServices = require('../../services/driverRouteServices');
const scheduleRideServices = require('../../services/scheduleRideServices');
const rideRouter = express.Router();
rideRouter.get(
  '/?',
  asyncHandler(async (req, res) => {
    const { userId, userType, flag } = req.query;
    if (userType == 1) {
      if (flag == 'active') {
        let result = await driverRouteServices.activeRides(userId);
        result = result.map((item) => {
          return {
            _id: item._id,
            startPoint: item.startPoint,
            endPoint: item.endPoint,
            date: item.date,
            availableSeats: item.availableSeats,
            initialSeats: item.initialSeats,
            kmLeverage: item.kmLeverage,
            corporateCode: item.corporateCode,
            gender: item.gender,
            status: item.status,
          };
        });
        res.status(200).send({ msg: "Driver's active rides!", data: result });
      } else if (flag == 'history') {
        let result = await driverRouteServices.historyRidesForPanel(userId);
        result = result.map((item) => {
          return {
            _id: item._id,
            startPoint: item.startPoint,
            endPoint: item.endPoint,
            date: item.date,
            availableSeats: item.availableSeats,
            initialSeats: item.initialSeats,
            kmLeverage: item.kmLeverage,
            corporateCode: item.corporateCode,
            gender: item.gender,
            status: item.status,
          };
        });
        res.status(200).send({ msg: "Driver's active rides!", data: result });
      } else {
        let result = await driverRouteServices.userOtherRides(userId);
        result = result.map((item) => {
          return {
            _id: item._id,
            startPoint: item.startPoint,
            endPoint: item.endPoint,
            date: item.date,
            availableSeats: item.availableSeats,
            initialSeats: item.initialSeats,
            kmLeverage: item.kmLeverage,
            corporateCode: item.corporateCode,
            gender: item.gender,
            status: item.status,
          };
        });
        res.status(200).send({ msg: "Driver's active rides!", data: result });
      }
    } else if (userType == 2) {
      if (flag == 'active') {
        let result = await scheduleRideServices.activeRides(userId);
        result = result.map((item) => {
          return {
            _id: item._id,
            startPoint: item.startPoint,
            endPoint: item.endPoint,
            date: item.date,
            startTime: item.startTime,
            endTime: item.endTime,
            bookedSeats: item.bookedSeats,
            corporateCode: item.corporateCode,
            gender: item.gender,
            status: item.status,
          };
        });
        res
          .status(200)
          .send({ msg: "Passenger's active rides!", data: result });
      } else if (flag == 'history') {
        let result = await scheduleRideServices.historyRidesForPanel(userId);
        result = result.map((item) => {
          return {
            _id: item._id,
            startPoint: item.startPoint,
            endPoint: item.endPoint,
            date: item.date,
            startTime: item.startTime,
            endTime: item.endTime,
            bookedSeats: item.bookedSeats,
            corporateCode: item.corporateCode,
            gender: item.gender,
            status: item.status,
          };
        });
        res
          .status(200)
          .send({ msg: "Passenger's active rides!", data: result });
      } else {
        let result = await scheduleRideServices.userOtherRides(userId);
        result = result.map((item) => {
          return {
            _id: item._id,
            startPoint: item.startPoint,
            endPoint: item.endPoint,
            date: item.date,
            startTime: item.startTime,
            endTime: item.endTime,
            bookedSeats: item.bookedSeats,
            corporateCode: item.corporateCode,
            gender: item.gender,
            status: item.status,
          };
        });
        res
          .status(200)
          .send({ msg: "Passenger's active rides!", data: result });
      }
    } else {
      res.status(400).send({ msg: 'Invalid user type!' });
    }
  })
);

rideRouter.get(
  '/all?',
  asyncHandler(async (req, res) => {
    const { userType, flag, pageNumber } = req.query;
    if (userType == 1) {
      if (flag == 'active') {
        let [result, count] = await Promise.all([
          driverRouteServices.allActiveRides(pageNumber),
          driverRouteServices.allActiveRidesCount(),
        ]);
        result = result.map((item) => {
          return {
            _id: item._id,
            startPoint: item.startPoint,
            endPoint: item.endPoint,
            date: item.date,
            availableSeats: item.availableSeats,
            initialSeats: item.initialSeats,
            kmLeverage: item.kmLeverage,
            corporateCode: item.corporateCode,
            gender: item.gender,
            status: item.status,
            user: item.userId,
          };
        });
        res
          .status(200)
          .send({ msg: "Driver's active rides!", data: result, count });
      } else if (flag === 'upcoming') {
        let [result, count] = await Promise.all([
          driverRouteServices.allUpcomingRides(pageNumber),
          driverRouteServices.allUpcomingRidesCount(),
        ]);
        result = result.map((item) => {
          return {
            _id: item._id,
            startPoint: item.startPoint,
            endPoint: item.endPoint,
            date: item.date,
            availableSeats: item.availableSeats,
            initialSeats: item.initialSeats,
            kmLeverage: item.kmLeverage,
            corporateCode: item.corporateCode,
            gender: item.gender,
            status: item.status,
            user: item.userId,
          };
        });
        res
          .status(200)
          .send({ msg: "Driver's active rides!", data: result, count });
      } else if (flag === 'history') {
        let [result, count] = await Promise.all([
          driverRouteServices.allCompletedRides(pageNumber),
          driverRouteServices.allCompletedRidesCount(),
        ]);
        result = result.map((item) => {
          return {
            _id: item._id,
            startPoint: item.startPoint,
            endPoint: item.endPoint,
            date: item.date,
            availableSeats: item.availableSeats,
            initialSeats: item.initialSeats,
            kmLeverage: item.kmLeverage,
            corporateCode: item.corporateCode,
            gender: item.gender,
            status: item.status,
            user: item.userId,
          };
        });
        res
          .status(200)
          .send({ msg: "Driver's completed rides!", data: result, count });
      } else {
        return res.status(400).send({ msg: 'Invalid flag!' });
      }
    } else if (userType == 2) {
      if (flag == 'active') {
        let [result, count] = await Promise.all([
          scheduleRideServices.allActiveRides(pageNumber),
          scheduleRideServices.allActiveRidesCount(),
        ]);
        result = result.map((item) => {
          return {
            _id: item._id,
            startPoint: item.startPoint,
            endPoint: item.endPoint,
            date: item.date,
            startTime: item.startTime,
            endTime: item.endTime,
            bookedSeats: item.bookedSeats,
            corporateCode: item.corporateCode,
            gender: item.gender,
            status: item.status,
            user: item.userId,
          };
        });
        res
          .status(200)
          .send({ msg: "Passenger's active rides!", data: result, count });
      } else if (flag === 'upcoming') {
        let [result, count] = await Promise.all([
          scheduleRideServices.allOtherRides(pageNumber),
          scheduleRideServices.allOtherRidesCount(),
        ]);
        result = result.map((item) => {
          return {
            _id: item._id,
            startPoint: item.startPoint,
            endPoint: item.endPoint,
            date: item.date,
            startTime: item.startTime,
            endTime: item.endTime,
            bookedSeats: item.bookedSeats,
            corporateCode: item.corporateCode,
            gender: item.gender,
            status: item.status,
            user: item.userId,
          };
        });
        res
          .status(200)
          .send({ msg: "Passenger's active rides!", data: result, count });
      } else if (flag === 'history') {
        let [result, count] = await Promise.all([
          scheduleRideServices.allCompletedRides(pageNumber),
          scheduleRideServices.allCompletedRidesCount(),
        ]);
        result = result.map((item) => {
          return {
            _id: item._id,
            startPoint: item.startPoint,
            endPoint: item.endPoint,
            date: item.date,
            startTime: item.startTime,
            endTime: item.endTime,
            bookedSeats: item.bookedSeats,
            corporateCode: item.corporateCode,
            gender: item.gender,
            status: item.status,
            user: item.userId,
          };
        });
        res
          .status(200)
          .send({ msg: "Passenger's active rides!", data: result, count });
      } else {
        return res.status(400).send({ msg: 'Invalid flag!' });
      }
    } else {
      res.status(400).send({ msg: 'Invalid user type!' });
    }
  })
);

rideRouter.get(
  '/userHistory?',
  asyncHandler(async (req, res) => {
    let { userId, isDriver } = req.query;
    isDriver = isDriver == 'true';
    if (isDriver) {
      const result = await driverRouteServices.totalRides(userId);
      res.status(200).send({ msg: 'Driver Routes!', data: result });
    } else {
      const result = await scheduleRideServices.totalRides(userId);
      res.status(200).send({ msg: 'Driver Routes!', data: result });
    }
  })
);

rideRouter.get(
  '/rideById?',
  expressAsyncHandler(async (req, res) => {
    const { id, flag } = req.query;
    if (flag == 'driver') {
      const result = await driverRouteServices.routeByIdForPanel(id);
      if (result) {
        res.status(200).send({ msg: 'Ride details!', data: result });
      } else {
        res.status(400).send({ msg: 'Record not found!' });
      }
    } else if (flag == 'passenger') {
      const result = await scheduleRideServices.getByIdForPanel(id);
      if (result) {
        res.status(200).send({ msg: 'Ride details!', data: result });
      } else {
        res.status(400).send({ msg: 'Record not found!' });
      }
    } else {
      res.status(400).send({ msg: 'Invalid flag!' });
    }
  })
);

rideRouter.get(
  '/startedRoutesLastLocations',
  asyncHandler(async (req, res) => {
    const result = await driverRouteServices.startedRouteDriverLocation();
    res.status(200).send({ msg: "Driver's last location", data: result });
  })
);
module.exports = rideRouter;
