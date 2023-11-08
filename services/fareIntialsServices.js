const fareInitialsModel = require("../models/fareInitialsModel");

const fareIntialsServices = {
  update: async (
    initialFareId,
    minCarCharges,
    minBikeCharges,
    carMaintenance,
    bikeMaintenance,
    petrol,
    deisel,
    gasoline
  ) => {
    const fareInitials = await fareInitialsModel.findOneAndUpdate(
      { _id: initialFareId },
      {
        minCarCharges,
        minBikeCharges,
        carMaintenance,
        bikeMaintenance,
        fulePrice: { petrol, deisel, gasoline },
      },
      { new: true }
    );
    return fareInitials;
  },
  getCurrent: async () => {
    const intial = await fareInitialsModel
      .findOne({})
      .sort("-createdAt")
      .limit(1);
    return intial;
  },
};

module.exports = fareIntialsServices;
