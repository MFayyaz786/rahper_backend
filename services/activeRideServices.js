const activeRideModel = require('../models/activeRideModel');
const scheduleRideServices = require('../services/scheduleRideServices');
const priceCalculator = require('../utils/priceCalculator');
const driverRouteServices = require('./driverRouteServices');
const mongoose = require('mongoose');
const driverRouteModel = require('../models/driverRouteModel');
const { distanceOfTwoPoint } = require('./locationServices');
const PIN = require('../utils/OTP');
const { getCount } = require('../utils/chats');
const activeRideServices = {
  //new active ride service will create a new ride
  newRide: async (routeId) => {
    const route = await driverRouteServices.updateStatus(routeId);
    const { accepted } = route;
    const passengers = await Promise.all(
      accepted.map(async (item) => {
        const schedule = await scheduleRideServices.active(item);
        const distance = distanceOfTwoPoint(route.endPoint, schedule.endPoint);
        const fare = await priceCalculator(
          route.vehicleId.minMileage,
          schedule.distance,
          schedule.corporateCode
        );
        scheduleRideServices.addFare(item, fare);
        return {
          passenger: item,
          fare,
          sortDistance: distance,
        };
      })
    );
    const activeRide = new activeRideModel({ routeId, passengers });
    const result = await activeRide.save();
    const ride = await activeRideServices.rideById(result._id.toString());
    const rideTime = route.duration / 60;

    return { ride, rideTime };
  },

  //geting a active ride with routeId if it is started
  activeRideByRoute: async (routeId) => {
    const result = await activeRideModel.findOne({
      routeId,
      status: 'started',
    });
    return result;
  },

  //geting active ride by id
  rideById: async (_id) => {
    let result = await activeRideModel
      .findOne({
        _id,
      })
      .populate({
        path: 'routeId',
        select:
          'startPoint endPoint bounds_ne bounds_sw encodedPolyline bookedSeats distance',
        populate: {
          path: 'userId',
          select:
            ' firstName lastName mobile profileImage totalRating totalRatingCount fcmToken',
        },
      })
      .populate({
        path: 'passengers.passenger',
        select: '-polyline',
        populate: {
          path: 'userId',
          select:
            ' firstName lastName mobile profileImage totalRating totalRatingCount fcmToken',
        },
      });

    result.passengers = result.passengers.filter((item) => {
      if (item.status === 'cancelled') {
        return false;
      }
      return true;
    });

    // result.passengers = result.passengers.sort(
    //   (a, b) => b.sortDistance - a.sortDistance
    // );

    result.passengers = result.passengers.map((item) => {
      const count = getCount(
        result.routeId.userId._id.toString(),
        item.passenger.userId._id.toString()
      );
      // console.log({ count });
      item.count = count;
      return item;
    });

    return result;
  },

  //geting active ride by id
  rideByPassenger: async (passenger) => {
    let result = await activeRideModel
      .findOne(
        {
          'passengers.passenger': passenger,
        },
        { _id: 1 }
      )
      .populate({ path: 'routeId', select: 'userId' });
    return result;
  },

  //validating that if route is already active or not
  validateRide: async (routeId) => {
    // console.log({ routeId });
    var result = await activeRideModel
      .findOne({
        routeId,
        status: 'started',
      })
      .populate({
        path: 'routeId',
        select: 'startPoint endPoint bounds_ne bounds_sw encodedPolyline',
        populate: {
          path: 'userId',
          select:
            ' firstName lastName mobile profileImage totalRating totalRatingCount',
        },
      })
      .populate({
        path: 'passengers.passenger',
        select:
          'startPoint endPoint bounds_ne bounds_sw userId bookedSeats encodedPolyline bookedSeats distance',
        populate: {
          path: 'userId',
          select:
            ' firstName lastName mobile profileImage totalRating totalRatingCount fcmToken',
        },
      });
    result &&
      (result.passengers = result.passengers.filter((item) => {
        if (item.status === 'cancelled') {
          return false;
        }
        return true;
      }));
    // result &&
    //   (result.passenger = result.passenger.sort(
    //     (a, b) => b.sortDistance - a.sortDistance
    //   ));

    // for (var i = 0; i < result.passengers; i++) {
    //   const count = getCount(
    //     result.routeId.userId._id.toString(),
    //     result.passengers[i].passenger.userId._id.toString()
    //   );
    //   result.passengers[i].count = 9;
    // }
    result &&
      (result.passengers = result.passengers.map((item) => {
        const count = getCount(
          result.routeId.userId._id.toString(),
          item.passenger.userId._id.toString()
        );
        item.count = count;
        // console.log(item);
        return item;
      }));
    // console.log(result.passengers);
    return result;
  },

  //adding passenger in acitve ride
  addPassenger: async (routeId, passenger) => {
    const [schedule, route] = await Promise.all([
      scheduleRideServices.active(passenger),
      driverRouteServices.routeById(routeId),
    ]);
    const fare = await priceCalculator(
      route.vehicleId.minMileage,
      schedule.distance,
      schedule.corporateCode
    );
    scheduleRideServices.addFare(passenger, fare);
    const distance = distanceOfTwoPoint(schedule.endPoint, route.endPoint);
    const result = await activeRideModel.findOneAndUpdate(
      {
        routeId,
        status: 'started',
      },
      {
        $push: {
          passengers: {
            fare,
            passenger: mongoose.Types.ObjectId(passenger),
            sortDistance: distance,
          },
        },
      }
    );
    if (result) {
      return activeRideServices.rideById(result._id);
    }
    return result;
  },

  //updating a passenger ride status to onTheWay
  onTheWay: async (_id, passengerId) => {
    const result = await activeRideModel.findOneAndUpdate(
      {
        _id,
        'passengers.passenger': passengerId,
      },
      {
        $set: { 'passengers.$.status': 'active' },
      },
      { new: true }
    );
    return result;
  },

  //updating a passenger ride status to arrived

  arrived: async (_id, passengerId, pin) => {
    const result = await activeRideModel.findOneAndUpdate(
      {
        _id,
        'passengers.passenger': passengerId,
      },
      {
        $set: {
          'passengers.$.status': 'arrived',
          'passengers.$.verifyPin': pin,
        },
      },
      { new: true }
    );
    return result;
  },

  //updating a passenger ride status to inprogress when ride started

  startRide: async (_id, passengerId) => {
    // console.log(_id, passengerId);
    const result = await activeRideModel
      .findOneAndUpdate(
        {
          $or: [{ _id }, { routeId: _id }],
          'passengers.passenger': passengerId,
        },
        {
          $set: { 'passengers.$.status': 'inprogress' },
        },
        { new: true }
      )
      .populate({
        path: 'routeId',
        select: 'userId',
        populate: { path: 'userId', select: 'fcmToken profileImage' },
      });
    // console.log(result);
    return result;
  },

  pendingPayment: async (_id, passengerId) => {
    // console.log(_id, passengerId);
    const result = await activeRideModel
      .findOneAndUpdate(
        {
          $or: [{ _id }, { routeId: _id }],
          'passengers.passenger': passengerId,
        },
        {
          $set: { 'passengers.$.status': 'pendingPayment' },
        },
        { new: true }
      )
      .populate({
        path: 'routeId',
        select: 'userId',
        populate: { path: 'userId', select: 'fcmToken profileImage' },
      });
    // console.log(result);
    return result;
  },

  //updating a passenger ride status to completed

  completeRide: async (_id, passengerId, bookedSeats) => {
    const result = await activeRideModel.findOneAndUpdate(
      {
        _id,
        'passengers.passenger': passengerId,
      },
      {
        $set: { 'passengers.$.status': 'completed' },
      },
      { new: true }
    );

    const driverRoute = await driverRouteModel.findOneAndUpdate(
      { _id: result.routeId },
      { $inc: { availableSeats: bookedSeats } },
      { new: true }
    );
    for (var i = 0; i < result.passengers.length; i++) {
      if (
        result.passengers[i].status !== 'completed' &&
        result.passengers[i].status !== 'cancelled'
      ) {
        return { result, finish: false };
      }
    }
    // for (var i = 0; i < result.passengers.length; i++) {
    //   if (result.passengers[i].passenger.toString() == passengerId) {
    //     scheduleRideServices.addFare(passengerId, result.passengers[i].fare);
    //     break;
    //   }
    // }
    const distance = distanceOfTwoPoint(
      driverRoute.endPoint,
      driverRoute.lastLocation[driverRoute.lastLocation.length - 1]
    );
    if (distance / 1000 < driverRoute.kmLeverage) {
      return { result, finish: true };
    }
    return { result, finish: false };
  },

  //updating a passenger ride status to completed

  requestPaymentPending: async (_id, passengerId, bookedSeats) => {
    const result = await activeRideModel.findOneAndUpdate(
      {
        _id,
        'passengers.passenger': passengerId,
      },
      {
        $set: { 'passengers.$.status': 'completed' },
      },
      { new: true }
    );

    const driverRoute = await driverRouteModel.findOneAndUpdate(
      { _id: result.routeId },
      { $inc: { availableSeats: bookedSeats } },
      { new: true }
    );
    for (var i = 0; i < result.passengers.length; i++) {
      if (
        result.passengers[i].status !== 'completed' &&
        result.passengers[i].status !== 'cancelled'
      ) {
        return { result, finish: false };
      }
    }
    // for (var i = 0; i < result.passengers.length; i++) {
    //   if (result.passengers[i].passenger.toString() == passengerId) {
    //     scheduleRideServices.addFare(passengerId, result.passengers[i].fare);
    //     break;
    //   }
    // }
    const distance = distanceOfTwoPoint(
      driverRoute.endPoint,
      driverRoute.lastLocation[driverRoute.lastLocation.length - 1]
    );
    if (distance / 1000 < driverRoute.kmLeverage) {
      return { result, finish: true };
    }
    return { result, finish: false };
  },

  //updating a passenger ride status to canceled
  cancelRide: async (_id, passengerId) => {
    const result = await activeRideModel.findOneAndUpdate(
      {
        _id,
        'passengers.passenger': passengerId,
      },
      {
        $set: { 'passengers.$.status': 'cancelled' },
      },
      { new: true }
    );
    return result;
  },

  cancelRideByRouteId: async (routeId, passengerId) => {
    const result = await activeRideModel.findOneAndUpdate(
      {
        routeId,
        'passengers.passenger': passengerId,
      },
      {
        $set: { 'passengers.$.status': 'cancelled' },
      },
      { new: true }
    );
    return result;
  },

  //cancel service for inride cancellation by passenger
  cancelRideByPassenger: async (routeId, passengerId) => {
    const result = await activeRideModel.findOneAndUpdate(
      {
        routeId,
        'passengers.passenger': passengerId,
      },
      {
        $set: { 'passengers.$.status': 'cancelled' },
      },
      {
        new: true,
      }
    );
    return result;
  },

  //geting a passenger in acitve ride
  passenger: async (routeId, passengerId) => {
    const result = await activeRideModel.findOne({
      routeId,
      'passengers.passenger': passengerId,
      status: 'started',
    });
    return result;
  },

  //finishing activeride service
  finish: async (routeId) => {
    let result = await activeRideModel.findOne({
      routeId,
      status: 'started',
    });
    if (result) {
      result.status = 'completed';
      for (let i = 0; i < result.passengers.length; i++) {
        if (
          result.passengers[i].status !== 'completed' &&
          result.passengers[i].status !== 'cancelled'
        ) {
          result = null;
          break;
        }
      }
      if (result) {
        return await result.save();
      } else {
        return null;
      }
    } else {
      return null;
    }
  },
  newPassenger: async (_id, passenger) => {
    const result = await activeRideModel
      .findOne({
        _id,
        'passengers.passenger': passenger,
      })
      .populate({
        path: 'passengers.passenger',
        select: '-polyline',
        populate: {
          path: 'userId',
          select:
            ' firstName lastName mobile profileImage totalRating totalRatingCount fcmToken',
        },
      });
    const newPassenger = result.passengers.filter((item) => {
      if (item.passenger._id.toString() == passenger) {
        return true;
      }
      return false;
    });
    return newPassenger[0];
  },

  /****************
   *
   *
   *
   *
   *
   * services for admin panel
   *
   *
   *
   *
   *
   *
   *
   *******************/

  //this will return an array of acitve ride which are active now
  allActiveRides: async () => {
    const list = await activeRideModel
      .find({ status: 'started' })
      .populate({
        path: 'routeId',
        select: 'startPoint endPoint lastLocation userId',
        populate: { path: 'userId', select: 'firstName lastName mobile' },
      })
      .populate({
        path: 'passengers.passenger',
        select: 'startPoint endPoint userId',
        populate: { path: 'userId', select: 'firstName lastName mobile' },
      })
      .sort('-createdAt');
    return list;
  },
  wallet: async (_id) => {
    const result = await activeRideModel
      .findOne({ _id }, { routeId: 1 })
      .populate({
        path: 'routeId',
        select: 'userId',
        populate: { path: 'userId', select: 'zindigiWallet' },
      });
    return result;
  },
};

module.exports = activeRideServices;
