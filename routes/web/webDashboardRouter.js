const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const driverRouteServices = require("../../services/driverRouteServices");
const scheduleRideServices = require("../../services/scheduleRideServices");
const userServices = require("../../services/userServices");
const webDashboardRouter = express.Router();
webDashboardRouter.get(
  "/stat",
  expressAsyncHandler(async (req, res) => {
    console.log("route called")
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
      userServices.dashboardStat(),
      scheduleRideServices.dashboardStat(),
      driverRouteServices.dashboardStat(),
      driverRouteServices.acceptedRequestsCount(),
      driverRouteServices.rejectedRequestsCount(),
      driverRouteServices.cancelledRequestsCount(),
      driverRouteServices.acceptedDriversRequestsCount(),
      driverRouteServices.rejectedDriversRequestsCount(),
      driverRouteServices.cancelledDriversRequestsCount(),
      driverRouteServices.startedRouteDriverLocation(),
    ]);
    res.status(200).send({
      msg: "",
      data: {
        userStat,
        routeStat,
        scheduleStat,
        pieChartData: {
          passengerAcceptedRequests,
          passengerRejectedRequests,
          passengerCancelledRequests,
          passengerTotal:
            passengerAcceptedRequests +
            passengerRejectedRequests +
            passengerCancelledRequests,
          driverAcceptedRequests,
          driverRejectedRequests,
          driverCancelledRequests,
          driverTotal:
            driverAcceptedRequests +
            driverRejectedRequests +
            driverCancelledRequests,
        },
        startedRoutesDriversLocations,
      },
    });
  })
);
webDashboardRouter.get(
  "/dashboardState",
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
