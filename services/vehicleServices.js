const mongoose = require('mongoose');
const vehicleModel = require('../models/vehicleModel');

const vehicleServices = {
  addVehicle: async (
    model,
    year,
    registrationNumber,
    registrationCity,
    registrationProvince,
    minMileage,
    AC,
    heater,
    color,
    seatingCapacity,
    documents
  ) => {
    const vehicle = new vehicleModel({
      model: mongoose.Types.ObjectId(model),
      year,
      registrationNumber,
      registrationCity: mongoose.Types.ObjectId(registrationCity),
      registrationProvince: mongoose.Types.ObjectId(registrationProvince),
      minMileage,
      AC,
      heater,
      color: mongoose.Types.ObjectId(color),
      seatingCapacity,
      documents,
    });
    const result = await vehicle.save();
    return result;
  },

  update: async (
    _id,
    model,
    year,
    registrationNumber,
    registrationCity,
    registrationProvince,
    minMileage,
    AC,
    heater,
    color,
    seatingCapacity,
    documents
  ) => {
    const result = await vehicleModel.findOneAndUpdate(
      { _id },
      {
        model: mongoose.Types.ObjectId(model),
        year,
        registrationNumber,
        registrationCity: mongoose.Types.ObjectId(registrationCity),
        registrationProvince: mongoose.Types.ObjectId(registrationProvince),
        minMileage,
        AC,
        heater,
        color: mongoose.Types.ObjectId(color),
        seatingCapacity,
        documents,
      }
    );
    return result;
  },

  byStatus: async (status, pageNumber = 0) => {
    pageNumber = parseInt(pageNumber) + 1;
    const pageSize = 50; // Specify the number of documents per page
    const skip = (pageNumber - 1) * pageSize;
    const list = await vehicleModel
      .find({ 'documents.status': status, deleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate('model registrationCity registrationProvince color')
      .populate({
        path: 'model',
        populate: [
          {
            path: 'type',
          },
          {
            path: 'make',
          },
        ],
      });

    return list;
  },
  totalCountByStatus: async (status) => {
    const count = await vehicleModel.count({
      'documents.status': status,
      deleted: false,
    });
    return count;
  },

  updateStatus: async (_id, type, status, comment) => {
    const result = await vehicleModel.findOneAndUpdate(
      { _id, 'documents.type': type },
      {
        statusUpdatedAt: new Date(),
        $set: {
          'documents.$.status': status,
          'documents.$.comment': comment,
        },
      },
      { new: true }
    );
    return result;
  },

  validateVehicle: async (registrationNumber, _id) => {
    if (_id) {
      const validate = await vehicleModel.findOne({
        _id: { $ne: _id },
        registrationNumber,
        deleted: false,
      });
      return validate;
    }
    const validate = await vehicleModel.findOne({ registrationNumber });
    return validate;
  },

  deleteVehicle: async (_id) => {
    const result = await vehicleModel.findOneAndUpdate(
      { _id },
      { deleted: true },
      { new: true }
    );
    return result;
  },

  getVehicleSeats: async (_id) => {
    const result = await vehicleModel.findOne({ _id }, { seatingCapacity: 1 });
    return result;
  },

  getVehicleCountByStatus: async (status) => {
    const result = await vehicleModel.count({
      'documents.status': status,
      deleted: false,
    });
    return result;
  },

  recover: async (_id, minMileage, AC, heater, seatingCapacity, documents) => {
    const result = await vehicleModel.findOneAndUpdate(
      { _id },
      { deleted: false, minMileage, AC, heater, seatingCapacity, documents },
      { new: true }
    );
    return result;
  },
};

module.exports = vehicleServices;
