const fareIntialsServices = require("../services/fareIntialsServices");
const corporateServices = require("../services/corporateServices");

//mileage is in Km and distance is in meters
const priceCalculator = async (mileage, distance, corporateCode) => {
  // return 4;
  // console.log(mileage, distance);
  const intials = await fareIntialsServices.getCurrent();
  // console.log(intials.fulePrice.petrol);
  const basicFare =
    perKmConsumption(mileage, intials.fulePrice.petrol) * (distance / 1000);
  // console.log(basicFare);
  const fareWithMaintaince =
    basicFare + (intials?.carMaintenance / 100) * basicFare;
  let discountedFare = fareWithMaintaince;
  if (corporateCode) {
    const corporate = await corporateServices.findByCode(corporateCode);
    if (corporate) {
      discountedFare = discountedFare + discountedFare * (corporate?.fee / 100);
    }
  }
  // const fare = fareWithMaintaince + intials.minCarCarges;
  return discountedFare < 100 ? 100 : Math.floor(discountedFare);
};

const perKmConsumption = (mileage, fulePrice) => {
  return fulePrice / mileage;
};

module.exports = priceCalculator;
