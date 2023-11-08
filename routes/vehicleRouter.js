const { json } = require('body-parser');
const express = require('express');
const vehicleRouter = express.Router();
const asyncHandler = require('express-async-handler');
const userServices = require('../services/userServices');
const vehicleServices = require('../services/vehicleServices');
const addVehicleCodes = require('../utils/addVehicleCodes');
const documentStatus = require('../utils/documentStatus');
const encryptData = require('../utils/encryptData');

const uploadFile = require('../utils/uploadFile');
const { getUserSockets } = require('../utils/userSocketId');
const mailServices = require('../services/mailServices');
const notificationServices = require('../services/notifcationServices');
//add a new vehicle api
vehicleRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const {
      userId,
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
    } = req.body;
    const io = req.app.get('socket');
    const documents = await Promise.all(
      req.body.documents.map(async (doc) => {
        let frontImage = '';
        let backImage = '';
        let vehicleImage = '';
        if (doc.frontImage) frontImage = await uploadFile(doc.frontImage);
        if (doc.backImage) backImage = await uploadFile(doc.backImage);
        if (doc.vehicleImage) vehicleImage = await uploadFile(doc.vehicleImage);
        return {
          ...doc,
          frontImage,
          backImage,
          vehicleImage,
          status: documentStatus.PENDING,
        };
      })
    );
    const validate = await vehicleServices.validateVehicle(registrationNumber);
    if (!validate) {
      const vehicle = await vehicleServices.addVehicle(
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
      );
      if (vehicle) {
        //adding vehicle in user's vehicles
        const addUserVehicle = await userServices.addVehicle(
          userId,
          vehicle._id
        );
        if (addUserVehicle) {
          const url = `${
            process.env.PENALBASEURL
          }api/verification/vehicles?vehicleId=${vehicle._id.toString()}`;
          mailServices.sentMail(
            'support@rahper.com',
            url,
            'vehicleVerification'
          );
          const count = await vehicleServices.getVehicleCountByStatus(
            'pending'
          );
          io.to('admin').emit('newVehicle', { count });
          res.status(201).send({ msg: 'Vehicle Added!', data: vehicle });
        }
      } else {
        res.status(400).send({ msg: 'Vehicle not added' });
      }
    }
    //if vehcile is already added in system
    else {
      const vehicleUser = await userServices.validateUserVehicle(validate._id);
      //validating if vehicle is already in user vehicles
      if (vehicleUser && userId === vehicleUser._id.toString()) {
        res.status(409).send({
          msg: 'Vehicle already in user vehicles',
          statusCode: addVehicleCodes.inUserVehicles,
        });
        //if vehicle is delted then adding it to the user's vehicles
      } else if (validate.deleted) {
        const recoverVehicle = await vehicleServices.recover(
          validate._id,
          minMileage,
          AC,
          heater,
          seatingCapacity,
          documents
        );
        const userVehicle = await userServices.addVehicle(
          userId,
          recoverVehicle._id.toString()
        );
        if (userVehicle) {
          res.status(201).send({
            msg: 'Vehicle registered and added',
            statusCode: addVehicleCodes.add,
            data: recoverVehicle,
          });
          const url = `${
            process.env.PENALBASEURL
          }api/verification/vehicles?vehicleId=${vehicle._id.toString()}`;
          mailServices.sentMail(
            'support@rahper.com',
            url,
            'vehicleVerification'
          );
          const count = await vehicleServices.getVehicleCountByStatus(
            'pending'
          );
          io.to('admin').emit('newVehicle', { count });
          res.status(201).send({ msg: 'Vehicle Added!', data: vehicle });
        } else {
          res.status(400).send({ msg: 'Vehicle not added' });
        }
      } else {
        const vehicle = await vehicleServices.addVehicle(
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
        );
        if (vehicle) {
          //adding vehicle in user's vehicles
          const addUserVehicle = await userServices.addVehicle(
            userId,
            vehicle._id
          );
          if (addUserVehicle) {
            res.status(201).send({ msg: 'Vehicle Added!', data: vehicle });
          }
        } else {
          res.status(400).send({ msg: 'Vehicle not added' });
        }
        // res.status(409).send({
        //   msg: "Vehicle already added with an other user",
        //   statusCode: addVehicleCodes.inAnOtherUserVehicles,
        // });
      }
    }
  })
);

//add a new vehicle api
vehicleRouter.put(
  '/',
  asyncHandler(async (req, res) => {
    const {
      vehicleId,
      userId,
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
    } = req.body;
    const io = req.app.get('socket');
    const documents = await Promise.all(
      req.body.documents.map(async (doc) => {
        let frontImage = doc.frontImage;
        let backImage = doc.backImage;
        let vehicleImage = doc.vehicleImage;
        let status = documentStatus.PENDING;
        if (doc.updatedFrontImage) {
          frontImage = await uploadFile(doc.updatedFrontImage);
          status = documentStatus.PENDING;
        }
        if (doc.updatedBackImage) {
          backImage = await uploadFile(doc.updatedBackImage);
        }
        if (doc.updatedVehicleImage) {
          vehicleImage = await uploadFile(doc.updatedVehicleImage);
        }
        return { ...doc, frontImage, vehicleImage, backImage, status };
      })
    );
    const validate = await vehicleServices.validateVehicle(
      registrationNumber,
      vehicleId
    );
    if (!validate) {
      const vehicle = await vehicleServices.update(
        vehicleId,
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
      );
      if (vehicle) {
        //adding vehicle in user's vehicles

        const count = await vehicleServices.getVehicleCountByStatus('pending');
        io.to('admin').emit('newVehicle', { count });
        res.status(200).send({ msg: 'Vehicle updated!', data: vehicle });
      } else {
        res.status(400).send({ msg: 'Vehicle failed to update!' });
      }
    }
    //if vehcile is already added in system
    else {
      res.status(400).send({ msg: 'Vehicle already registered' });
    }
  })
);

//update vehicle status
vehicleRouter.patch(
  '/status',
  asyncHandler(async (req, res) => {
    const { vehicleId, type, status, comment } = req.body;
    const io = req.app.get('socket');
    const result = await vehicleServices.updateStatus(
      vehicleId,
      type,
      status,
      comment
    );
    if (result) {
      res.status(200).send({ msg: 'Vehicle status updated to ' + status });
      try {
        const count = await vehicleServices.getVehicleCountByStatus('pending');
        io.to('admin').emit('newVehicle', { count });
        const user = await userServices.getUserByVehicle(vehicleId);
        if (user) {
          const userSocket = getUserSockets(user._id.toString());
          if (
            user.selectedVehicle == null &&
            status == documentStatus.VERIFIED
          ) {
            await userServices.updateSelectedVehicle(user._id, result._id);
          }
          if (userSocket[0]?.socketId) {
            io.to(userSocket[0].socketId).emit(
              'documentsStatus',
              JSON.stringify(encryptData({ flag: 'registrationCard' }))
            );
          }
        }

        notificationServices.newNotification(
          `Your vehicle documents status changed to ${status}`,
          'Document status change',
          user.fcmToken,
          {},
          null
        );
      } catch (e) {
        console.log(e);
      }
    } else {
      res.status(400).send({ msg: 'Vehicle not found' });
    }
  })
);

vehicleRouter.get(
  '/?',
  asyncHandler(async (req, res) => {
    const { status, pageNumber } = req.query;
    const [result, count] = await Promise.all([
      vehicleServices.byStatus(status, pageNumber),
      vehicleServices.totalCountByStatus(status),
    ]);
    res.status(200).send({ msg: '', data: result, count });
  })
);
//geting max seating capacity of vehicle
vehicleRouter.get(
  '/seats?',
  asyncHandler(async (req, res) => {
    const { vehicleId } = req.query;
    const result = await vehicleServices.getVehicleSeats(vehicleId);
    if (result) {
      res.status(200).send({ msg: 'Vehicle seats!', data: result });
    } else {
      res.status(400).send({ msg: 'Vehicle not found!' });
    }
  })
);

module.exports = vehicleRouter;
