const { default: mongoose } = require('mongoose');
const paymentModel = require('../models/paymentModel');
const { schedule } = require('./scheduleRideServices');

const paymentHistoryService = {
  new: async (ride, schedule, method, paymentDetails) => {
    const newPayment = new paymentModel({
      ride: mongoose.Types.ObjectId(ride),
      schedule: mongoose.Types.ObjectId(schedule),
      method: method || 'zindigi',
      paymentDetails,
    });
    const result = await newPayment.save();
    return result;
  },
  getBySchedule: async (schedule) => {
    const result = await paymentModel
      .findOne({ schedule })
      .populate({
        path: 'schedule',
        select: 'startPoint endPoint accepted userId',
        populate: { path: 'userId', select: 'firstName lastName' },
      })
      .populate({
        path: 'schedule',
        select: 'startPoint endPoint accepted userId',
        populate: {
          path: 'accepted',
          select: 'userId',
          populate: { path: 'userId', select: 'firstName lastName' },
        },
      })
      .lean();
    return result;
  },

  paymentDetails: async (status, text) => {
    const list = await paymentModel.aggregate([
      {
        $match: {
          status: {
            $in: status,
          },
        },
      },
      {
        $lookup: {
          from: 'activerides',
          localField: 'ride',
          foreignField: '_id',
          as: 'ride',
        },
      },
      {
        $unwind: {
          path: '$ride',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'driverroutes',
          localField: 'ride.routeId',
          foreignField: '_id',
          as: 'route',
        },
      },
      {
        $unwind: {
          path: '$route',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'schedulerides',
          localField: 'schedule',
          foreignField: '_id',
          as: 'schedule',
        },
      },
      {
        $unwind: {
          path: '$schedule',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'schedule.userId',
          foreignField: '_id',
          as: 'passenger',
        },
      },
      {
        $unwind: {
          path: '$passenger',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          'passenger.firstName': 1,
          'passenger.lastName': 1,
          'passenger.mobile': 1,
          'passenger.email': 1,
          driver: '$route.userId',
          fare: '$schedule.fare',
          'route.startPoint': 1,
          'route.endPoint': 1,
          'route.date': 1,
          'schedule.startPoint': 1,
          'schedule.endPoint': 1,
          'schedule.startTime': 1,
          method: 1,
          paidToDriver: 1,
          createdAt: 1,
        },
      },
      {
        $group: {
          _id: '$driver',
          history: {
            $push: '$$ROOT',
          },
          total: {
            $sum: '$fare',
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'driver',
        },
      },
      {
        $unwind: {
          path: '$driver',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          'driver.firstName': 1,
          'driver.lastName': 1,
          'driver.mobile': 1,
          'driver.email': 1,
          'driver.cnic': 1,
          'driver.zindigiWallet': 1,
          total: 1,
          history: 1,
        },
      },
    ]);
    return list;
  },

  driverPaymentsHistory: async (userId, pageNumber) => {
    const pageLimit = 10; // Number of records per page
    const skipCount = (pageNumber - 1) * pageLimit; // Calculate the number of records to skip

    const result = await paymentModel.aggregate([
      {
        $lookup: {
          from: 'activerides',
          localField: 'ride',
          foreignField: '_id',
          as: 'ride',
        },
      },
      {
        $lookup: {
          from: 'driverroutes',
          localField: 'ride.routeId',
          foreignField: '_id',
          as: 'route',
        },
      },
      {
        $match: {
          'route.userId': mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: 'schedulerides',
          localField: 'schedule',
          foreignField: '_id',
          as: 'schedule',
        },
      },
      {
        $unwind: {
          path: '$schedule',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: '$route',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'schedule.userId',
          foreignField: '_id',
          as: 'passengerInfo',
        },
      },
      {
        $unwind: {
          path: '$passengerInfo',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          passengerFirstName: '$passengerInfo.firstName',
          passengerLastName: '$passengerInfo.lastName',
          method: '$method',
          driverStartPoint: '$route.startPoint',
          driverEndPoint: '$route.endPoint',
          startPoint: '$schedule.startPoint',
          sendPoint: '$schedule.endPoint',
          fare: '$schedule.fare',
          status: '$status',
          createdAt: '$createdAt',
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $skip: skipCount,
      },
      {
        $limit: pageLimit,
      },
    ]);

    return result;
  },
};

module.exports = paymentHistoryService;
