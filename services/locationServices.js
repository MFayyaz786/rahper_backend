const geolib = require("geolib");

const isNear = (point, polyline, km) => {
  polyline = arrayOfArrayToArrayOfObject(polyline);
  const nearestPoint = findNearestPoint(point, polyline);
  const distance = distanceOfTwoPoint(nearestPoint, point);

  return isNearCheck(distance, km);
};

const findNearestPoint = (point, points) => {
  let result = geolib.findNearest(
    { latitude: point.latitude, longitude: point.longitude },
    points
  );
  return result;
};

const distanceOfTwoPoint = (point1, point2) => {
  console.log(point1, point2);
  const distance = geolib.getDistance(point1, {
    latitude: point2.latitude,
    longitude: point2.longitude,
  });
  // console.log({ distance });
  return distance;
};

const isNearCheck = (distance, km) => {
  // console.log(distance);
  if (distance < km * 1000) {
    return true;
  } else {
    return false;
  }
};

const arrayOfArrayToArrayOfObject = (array) => {
  const result = array.map((item) => {
    return { latitude: item[0], longitude: item[1] };
  });
  return result;
};

module.exports = { isNear, distanceOfTwoPoint };
