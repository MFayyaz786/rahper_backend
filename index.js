const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const logger = require('morgan');
const userRouter = require('./routes/userRouter');
const cookieParser = require('cookie-parser');
const socket = require('socket.io');
const vehicleRouter = require('./routes/vehicleRouter');
const vehicleTypeRouter = require('./routes/vehicleTypeRouter');
const vehicleMakeRouter = require('./routes/vehicleMakeRouter');
const vehicleModelsRouter = require('./routes/vehicleModelsRouter');
const colorRouter = require('./routes/colorRouter');
const provinceRouter = require('./routes/provinceRouter');
const cityRouter = require('./routes/cityRouter');
const scheduleRideRouter = require('./routes/scheduleRideRouter');
const acitveRiderouter = require('./routes/activeRideRouter');
const utilRouter = require('./routes/utilRouter');
const driverRouteRouter = require('./routes/driverRouteRouter');
const locatoinRouter = require('./routes/locationRouter');
const { addAnId, deleteAnId } = require('./utils/userSocketId');
const socketGeneralServices = require('./services/socketGeneralServices');
const testRouter = require('./routes/testRouter');
const ratingRouter = require('./routes/ratingRouter');
const historyRouter = require('./routes/historyRouter');
const adsRouter = require('./routes/adsRouter');
const dashboardRouter = require('./routes/dashboardRouter');
const systemNotificatinoRouter = require('./routes/systemNotificatinoRouter');
userRouterForAdmin = require('./routes/web/userRouter');
const rideRouterForAdmin = require('./routes/web/rideRouter');
const moment = require('moment');
const driverRouteServices = require('./services/driverRouteServices');
const webRouter = require('./routes/web/webRouter');
const exceptionErrorsModel = require('./models/exceptionErrorsModel');
const encryptData = require('./utils/encryptData');
const paymentGatewayRouter = require('./routes/web/paymentGatewayRouter');
const countryRouter = require('./routes/countryRouter');
const simProviderRouter = require('./routes/simProviderRouter');
const zindigiWalletRouter = require('./routes/zindigiWalletRouter');
const appVersionRouter = require('./routes/web/appVersionRouter');
const loger = require('./middlewares/loger');
const userServices = require('./services/userServices');
const socketEmitters = require('./utils/socketEmitters');
const decryptData = require('./utils/decryptData');
const socketLogsServices = require('./services/socketLogsServices');
const webDashboardRouter = require('./routes/web/webDashboardRouter');
const webDashboardRouter2 = require('./routes/web/webDashboardRouter2');
const permissionRouter = require('./routes/permissionRouter');
const roleRouter = require('./routes/roleRouter');
const fareInitialRouter = require('./routes/fareinialsRouter');
const paymentHistoryRouter = require('./routes/paymentHistoryRouter');
const corporateRouter = require('./routes/corporateRouter');
const promotionRouter = require('./routes/promotionRouter');
const setReminders = require('./utils/setReminders');
const { paymentRouter, setSocket } = require('./routes/paymentRouter');
const FAQRouter = require('./routes/FAQRouter');
const FAQCategoryRouter = require('./routes/FAQCategoryRouter');
const supportSubjectRouter = require('./routes/supportSubjectRouter');
const failedPaymentLimitRouter = require('./routes/failedPaymentLimitRouter');
const encryptResponseData = require('./middlewares/encryptResponseData');
const decryptRequestData = require('./middlewares/decryptRequestData');
const authentication = require('./middlewares/authentication');
const tutorialRouter = require('./routes/tutorialRouter');
const moduleRouter = require('./routes/moduleRouter');
const subModuleRouter = require('./routes/subModuleRouter');
const tutoialCategoryRouter = require('./routes/tutorialCategoryRouter');
const whatsAppRouter = require('./routes/whatsAppRouter');
const smsLogRouter = require('./routes/smsLogRouter');
const server = http.createServer(app);
const io = socket(server, {
  cors: { origin: '*' },
  maxHttpBufferSize: 100 * 1024 * 1024, // 100MB in bytes
});
app.set('socket', io);
setSocket(io);
dotenv.config();
require('./db/index');

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(logger('dev'));
app.use(express.json({ limit: '16mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

setReminders();
//socket server

io.on('connection', async (socket) => {
  const check = await driverRouteServices.anyActiveRide(
    socket.handshake.query.userId
  );

  const deviceId = await userServices.getDeviceId(
    socket.handshake.query.userId
  );
  if (deviceId) {
    socket.emit(
      socketEmitters.UPDATEDEVICEID,
      JSON.stringify(encryptData({ deviceId: deviceId.deviceId }))
    );
  }
  // if (check) {
  //   socket.emit(
  //     socketEmitters.LOCATIONOBSERVER,
  //     JSON.stringify({ observer: true, routeId: check._id.toString() })
  //   );
  // } else {
  //   socket.emit(socketEmitters.LOCATIONOBSERVER, JSON.stringify({ observer: false }));
  // }
  if (socket.handshake.query.userId != undefined) {
    if (check) {
      console.log({ observer: true });
      socket.emit(
        socketEmitters.LOCATIONOBSERVER,
        JSON.stringify(
          encryptData({ observer: true, routeId: check._id.toString() })
        )
      );
    } else {
      console.log({ observer: false });
      socket.emit(
        socketEmitters.LOCATIONOBSERVER,
        JSON.stringify(encryptData({ observer: false }))
      );
    }
  }
  socket.onAny((eventName, args) => {
    try {
      cipher = JSON.parse(args).cipher;
      let data = null;
      if (cipher) {
        data = decryptData(cipher);
      } else {
        data = {};
      }
      socketLogsServices.addNew(eventName, data);
    } catch (err) {
      try {
        const error = new exceptionErrorsModel({ error: err });
        error.save();
      } catch {}
    }
  });
  //socket.id = socket.handshake.query.userId;
  require('./routes/sockets/passengerSockets')(socket, io);
  require('./routes/sockets/driverSockets')(socket, io);
  require('./routes/sockets/chatSocket')(socket, io);
  require('./routes/sockets/supportSocket')(socket, io);
  require('./routes/sockets/other')(socket, io);
  require('./routes/sockets/callSockets')(socket, io);

  // console.log('new socket connection.....');
  if (socket.handshake.query.userId == undefined) {
    socket.join('admin');
  } else {
    addAnId(
      socket.handshake.query.userId,
      socket.id,
      socket.handshake.query.name
    );
    await socketGeneralServices.joinAllPassengerRooms(
      socket,
      socket.handshake.query.userId
    );
  }

  // socket.rooms.forEach((room) => {
  //   console.log(room);
  // });
  socket.emit(
    'message',
    JSON.stringify({
      msg: 'hello from server',
    })
  );

  // socket.on("test", (data, fn) => {
  //   console.log("first");
  //   // callback();

  // });
  socket.on('disconnect', () => {
    // console.log('disconnected');
    deleteAnId(socket.id);
  });
});

require('./routes/sockets/passengerSockets');
require('./routes/sockets/callSockets');

app.get('/', function (req, res) {
  res.json({ msg: 'ride share server....' });
});

if (process.env.NODE_ENV !== "local") {
  app.use(authentication);
}


//loger middleware
app.use(loger);

if (process.env.NODE_ENV !== 'local') {
  //decryption Middleware
  app.use(decryptRequestData);

  //encryption Middleware
  app.use(encryptResponseData);
}
app.use('/api/whatsApp', whatsAppRouter);
app.use('/api/newDashboard', webDashboardRouter2);
app.use('/api/test', testRouter);
app.use('/api/user', userRouter);
app.use('/api/vehicle', vehicleRouter);
app.use('/api/vehicletype', vehicleTypeRouter);
app.use('/api/vehiclemake', vehicleMakeRouter);
app.use('/api/vehiclemodel', vehicleModelsRouter);
app.use('/api/color', colorRouter);
app.use('/api/province', provinceRouter);
app.use('/api/city', cityRouter);
app.use('/api/util', utilRouter);
app.use('/api/route', driverRouteRouter);
app.use('/api/scheduleride', scheduleRideRouter);
app.use('/api/activeride', acitveRiderouter);
app.use('/api/location', locatoinRouter);
app.use('/api/rating', ratingRouter);
app.use('/api/history', historyRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/ads', adsRouter);
app.use('/api/systemnotification', systemNotificatinoRouter);
app.use('/api/zindigi', zindigiWalletRouter);

//web routes
app.use('/api/web', webRouter);
app.use('/api/web/user', userRouterForAdmin);
app.use('/api/web/rides', rideRouterForAdmin);
app.use('/api/web/appVersion', appVersionRouter);
app.use('/api/web/dashboard', webDashboardRouter);
app.use('/api/web/permission', permissionRouter);
app.use('/api/web/role', roleRouter);
app.use('/api/web/fareInials', fareInitialRouter);
app.use('/api/web/failedPaymentLimit', failedPaymentLimitRouter);
app.use('/api/web/tutorial', tutorialRouter);
app.use('/api/web/module', moduleRouter);
app.use('/api/web/subModule', subModuleRouter);
app.use('/api/web/tutorialCategory', tutoialCategoryRouter);
app.use('/api/web/smsLog', smsLogRouter);

//api for both web and mobile
app.use('/api/country', countryRouter);
app.use('/api/simProviders', simProviderRouter);
app.use('/api/paymentHistory', paymentHistoryRouter);
app.use('/api/corporate', corporateRouter);
app.use('/api/promotion', promotionRouter);
app.use('/api/FAQCategory', FAQCategoryRouter);
app.use('/api/FAQ', FAQRouter);
app.use('/api/supportSubject', supportSubjectRouter);
app.use('/api/paymentGateway', paymentGatewayRouter);

//payment apis
app.use('/api/payment', paymentRouter);
//404 handler
app.use(function (req, res, next) {
  res.status(404).send({ msg: 'Not Found' });
  return;
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

//error handler
app.use(async (err, req, res, next) => {
  console.log(err);
  res.status(500).send({ msg: err.message });
  try {
    const error = new exceptionErrorsModel({ error: err });
    await error.save();
  } catch {}
});

//http server
server.listen(process.env.PORT, () => {
  console.log(`server is running at ${process.env.PORT}`);
});

// console.log(new Date('2023-07-13 10:53:00.000Z'));
