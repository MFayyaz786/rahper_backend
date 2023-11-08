const adsServices = require('./adsServices');
const appVersionServices = require('./appVersionServices');
const driverRouteServices = require('./driverRouteServices');
const historyServices = require('./historyServices');
const scheduleRideServices = require('./scheduleRideServices');
const userServices = require('./userServices');
const dashboardServices = {
  initials: async (userId, isDriver) => {
    const appVersion = await appVersionServices.minRequiredVersion();
    if (isDriver) {
      const [
        ads,
        upcoming,
        active,
        totalRides,
        completedRides,
        cancelledRides,
        upcomingRides,
        requestAndMatch,
      ] = await Promise.all([
        adsServices.getAds(),
        driverRouteServices.upcoming(userId),
        driverRouteServices.active(userId),
        driverRouteServices.totalCount(userId),
        driverRouteServices.completedRidesCount(userId),
        driverRouteServices.cancelledRidesCount(userId),
        driverRouteServices.upcomingCount(userId),
        userServices.getMatchAndRequestStatus(userId),
      ]);
      return {
        ads,
        upcoming,
        active,
        totalRides,
        completedRides,
        cancelledRides,
        upcomingRides,
        appVersion,
        requestAndMatch,
      };
    } else {
      const [
        ads,
        upcoming,
        active,
        totalRides,
        completedRides,
        cancelledRides,
        upcomingRides,
        requestAndMatch,
      ] = await Promise.all([
        adsServices.getAds(),
        scheduleRideServices.upcoming(userId),
        scheduleRideServices.currentActive(userId),
        scheduleRideServices.totalRidesCount(userId),
        scheduleRideServices.completedRidesCount(userId),
        scheduleRideServices.cancelledRidesCount(userId),
        scheduleRideServices.acceptedRequestsCounts(userId),
        userServices.getMatchAndRequestStatus(userId),
      ]);
      return {
        ads,
        upcoming,
        active,
        totalRides,
        completedRides,
        cancelledRides,
        upcomingRides,
        appVersion,
        requestAndMatch,
      };
    }
  },
};

module.exports = dashboardServices;
