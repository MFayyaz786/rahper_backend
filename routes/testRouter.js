const { default: axios } = require('axios');
const express = require('express');
const testRouter = express.Router();
const expressAsyncHandler = require('express-async-handler');
const fetch = require('node-fetch');
const https = require('https');
const fs = require('fs');
const zindigiWalletServerices = require('../services/zindigiWalletServices');
const driverRouteServices = require('../services/driverRouteServices');
const historyModel = require('../models/historyModel');
const smsServices = require('../services/smsServices');
const mailServices = require('../services/mailServices');
const userServices = require('../services/userServices');
const scheduleRideServices = require('../services/scheduleRideServices');
const decryptData = require('../utils/decryptData');
const encryptData = require('../utils/encryptData');
const userModel = require('../models/userModel');
const userWalletModel = require('../models/userWalletModel');
const { default: mongoose } = require('mongoose');
const uploadFile = require('../utils/uploadFile');
const notificationServices = require('../services/notifcationServices');
const whatsAppMessage = require('../utils/whatsAppMessage');
testRouter.post(
  '/',
  expressAsyncHandler(async (req, res) => {
    res.send({ mag: 'post test' });
  })
);

testRouter.get(
  '/',
  expressAsyncHandler(async (req, res) => {
    res.status(200).send({ msg: 'get test' });
  })
);

testRouter.post(
  '/smsTest',
  expressAsyncHandler(async (req, res) => {
    const { mobile, message, smsSource } = req.body;
    const result = await smsServices.sendSMS(mobile, null, message, smsSource);
    res.status(200).send({ result: result.data });
  })
);

testRouter.post(
  '/whatsAppTest',
  expressAsyncHandler(async (req, res) => {
    const { to, message } = req.body;
    const result = await whatsAppMessage(to, message);
    res.status(200).send({ result: result?.data });
  })
);

testRouter.post(
  '/mailTest',
  expressAsyncHandler(async (req, res) => {
    const { email, testOTP } = req.body;
    const result = await mailServices.sentOTP(email, testOTP);
    res.status(200).send({ result: result.data });
  })
);

testRouter.post(
  '/dataToCipher',
  expressAsyncHandler((req, res) => {
    const data = encryptData(req.body);
    res.send(data);
  })
);

testRouter.post(
  '/cipherToData',
  expressAsyncHandler((req, res) => {
    const data = decryptData(req.body.cipher);
    res.send(data);
  })
);

testRouter.post(
  '/fileUpload',
  expressAsyncHandler(async (req, res) => {
    const { file } = req.body;
    const path = await uploadFile(file);
    res.send({ path });
  })
);

testRouter.post(
  '/notification',
  expressAsyncHandler(async (req, res) => {
    const { to } = req.body;
    const result = await notificationServices.newNotification(
      'test Notification',
      'test',
      to,
      {},
      null
    );
    res.send(result);
  })
);

testRouter.get(
  '/socket',
  expressAsyncHandler(async (req, res) => {
    const io = req.app.get('socket');
    io.to('admin').emit('test', { msg: 'testing socket...' });
    res.send({ msg: 'socket test endpoint' });
  })
);
module.exports = testRouter;
