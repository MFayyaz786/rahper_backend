const express = require('express');
const expressAsyncHandler = require('express-async-handler');
const asyncHandler = require('express-async-handler');
const driverRouteServices = require('../../services/driverRouteServices');
const notificationServices = require('../../services/notifcationServices');
const scheduleRideServices = require('../../services/scheduleRideServices');
const userRouter = express.Router();
const userServices = require('../../services/userServices');
const encryptData = require('../../utils/encryptData');
const notificationInfo = require('../../utils/notificationsInfo');
const { getUserSocket } = require('../../utils/userSocketId');
const userModel = require('../../models/userModel');

//get endpoint to get user by type
userRouter.get(
  '/userByType?',
  asyncHandler(async (req, res) => {
    const { userType, pageNumber, text } = req.query;
    const [result, count] = await Promise.all([
      userServices.getUserByRole(userType, pageNumber, text),
      userServices.countByRole(userType, text),
    ]);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send({ msg: "User's list!", data: result, count });
  })
);

//get endpoint to get blocked user
userRouter.get(
  '/blocked',
  asyncHandler(async (req, res) => {
    const { pageNumber } = req.query;
    const [result, count] = await Promise.all([
      userServices.getBlockedUser(pageNumber),
      userServices.countBlockedUser(),
    ]);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send({ msg: "User's list!", data: result, count });
  })
);

//endpoint to change user active status
userRouter.put(
  '/activeStatus',
  asyncHandler(async (req, res) => {
    const { userId, status, comment } = req.body;
    const result = await userServices.updateActiveStatus(
      userId,
      status,
      comment
    );
    if (result) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res
        .status(200)
        .send({ msg: 'User active status updated!', data: result });
      const data = {
        userId,
        name: 'block',
        status,
        comment,
      };
       const io = req.app.get("socket");
       const userSocket = getUserSocket(userId);
       if(userSocket?.socketId){
        io.to(userSocket.socketId).emit("userCurrentStatus",JSON.stringify(encryptData({active:status?true:false})))
       }
      const title =
        notificationInfo.activeInactiveUser.title +
        (status ? 'unblocked' : 'blocked');
      const body =
        notificationInfo.activeInactiveUser.body +
        (status ? 'unblocked' : 'blocked');
      const to = result.fcmToken;
      // console.log({ body, title, to, data });
      notificationServices.newNotification(body, title, to, data, null);
      await userModel.findOneAndUpdate({_id:userId},{fcmToken:null})
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(400).send({ msg: 'User active status not updated!' });
    }
  })
);

//verify or reject document endpoint for admin
userRouter.put(
  '/documentStatus',
  asyncHandler(async (req, res) => {
    const { userId, type, status, comment } = req.body;
    const result = await userServices.updateDocument(
      userId,
      type,
      status,
      comment
    );
    if (result) {
      try {
        const io = req.app.get('socket');
        const userSocket = getUserSocket(userId);
        if (userSocket.socketId) {
          console.log(userSocket.socketId);
          io.emit(
            'documentsStatus',
            JSON.stringify(encryptData({ flag: type }))
          );
        }
      } catch (error) {}
      res
        .status(200)
        .send({ msg: 'User active status updated!', data: result });
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');

      res.status(400).send({ msg: 'Oops there is some issue!' });
    }
  })
);

userRouter.get(
  '/userProfile?',
  expressAsyncHandler(async (req, res) => {
    let { userId, isDriver } = req.query;
    isDriver = isDriver == 'true';
    if (!isDriver) {
      const [user, history, activeRide] = await Promise.all([
        userServices.getUserById(userId, 'forPanel'),
        scheduleRideServices.totalRidesForWeb(userId),
        scheduleRideServices.activeRides(userId),
      ]);
      if (user) {
        res.status(200).send({ user, history, activeRide });
      } else {
        res.status(400).send({ msg: 'user not found' });
      }
    } else {
      const [user, history, activeRide] = await Promise.all([
        userServices.getUserById(userId),
        driverRouteServices.totalRidesForWeb(userId),
        driverRouteServices.activeRides(userId),
      ]);
      if (user) {
        res.status(200).send({ user, history, activeRide });
      } else {
        res.status(400).send({ msg: 'user not found' });
      }
    }
  })
);

userRouter.get(
  '/unverifiedDrivers/?',
  expressAsyncHandler(async (req, res) => {
    const { pageNumber, flag } = req.query;
    const [result, count] = await Promise.all([
      userServices.unverifiedDrivers(pageNumber, flag),
      userServices.unverifiedDriversCount(flag),
    ]);
    res
      .status(200)
      .send({ msg: 'Unverified driver list', data: result, count });
  })
);
userRouter.get(
  '/verifiedDrivers/?',
  expressAsyncHandler(async (req, res) => {
    const { pageNumber } = req.query;
    const [result, count] = await Promise.all([
      userServices.verifiedDrivers(pageNumber),
      userServices.verifiedDriversCount(),
    ]);
    res.status(200).send({ msg: 'verified driver list', data: result, count });
  })
);

//get endpoint to get user by type
userRouter.get(
  '/referAndReferBy',
  asyncHandler(async (req, res) => {
    const result = await userServices.getReferAndReferBy();
    res.status(200).send({ msg: "User's list!", data: result });
  })
);
module.exports = userRouter;
