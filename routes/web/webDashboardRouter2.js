const express = require('express');
const expressAsyncHandler = require('express-async-handler');
const driverRouteServices = require('../../services/driverRouteServices2');
const scheduleRideServices = require('../../services/scheduleRideServices2');
const userServices = require('../../services/userServices2');
const webDashboardRouter = express.Router();

webDashboardRouter.get(
  '/stat?',
  expressAsyncHandler(async (req, res) => {
    let { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date(startDate);
      endDate = new Date(endDate);
    }

    const [
      userStat,
      scheduleStat,
      routeStat,
      passengerAcceptedRequests,
      passengerRejectedRequests,
      passengerCancelledRequests,
      driverAcceptedRequests,
      driverRejectedRequests,
      driverCancelledRequests,
      startedRoutesDriversLocations,
    ] = await Promise.all([
      userServices.dashboardStat(startDate, endDate),
      scheduleRideServices.dashboardStat(startDate, endDate),
      driverRouteServices.dashboardStat(startDate, endDate),
      driverRouteServices.acceptedRequestsCount(startDate, endDate),
      driverRouteServices.rejectedRequestsCount(startDate, endDate),
      driverRouteServices.cancelledRequestsCount(startDate, endDate),
      driverRouteServices.acceptedDriversRequestsCount(startDate, endDate),
      driverRouteServices.rejectedDriversRequestsCount(startDate, endDate),
      driverRouteServices.cancelledDriversRequestsCount(startDate, endDate),
      driverRouteServices.startedRouteDriverLocation(),
    ]);
    res.status(200).send({
      msg: '',
      data: {
        userStat,
        routeStat,
        scheduleStat,
        pieChartData: {
          passengerAcceptedRequests,
          passengerRejectedRequests,
          passengerCancelledRequests,
          passengerTotal:
            passengerAcceptedRequests.total +
            passengerRejectedRequests.total +
            passengerCancelledRequests.total,
          passengerTotalMale:
            passengerAcceptedRequests.male +
            passengerRejectedRequests.male +
            passengerCancelledRequests.male,
          passengerTotalFemale:
            passengerAcceptedRequests.female +
            passengerRejectedRequests.female +
            passengerCancelledRequests.female,
          driverAcceptedRequests,
          driverRejectedRequests,
          driverCancelledRequests,
          driverTotal:
            driverAcceptedRequests.total +
            driverRejectedRequests.total +
            driverCancelledRequests.total,
          driverTotalMale:
            driverAcceptedRequests.male +
            driverRejectedRequests.male +
            driverCancelledRequests.male,
          driverTotalFemale:
            driverAcceptedRequests.female +
            driverRejectedRequests.female +
            driverCancelledRequests.female,
        },
        startedRoutesDriversLocations,
      },
    });
  })
);
webDashboardRouter.get(
  '/dashboardState',
  expressAsyncHandler(async (req, res) => {
    const result = await userServices.dashboardState();
    if (result) {
      res.status(200).send({
        data: result,
      });
    }
  })
);

module.exports = webDashboardRouter;
