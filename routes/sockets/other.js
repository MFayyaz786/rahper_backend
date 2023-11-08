const exceptionErrorsModel = require('../../models/exceptionErrorsModel');
const roleServices = require('../../services/roleServices');
const userServices = require('../../services/userServices');
const vehicleServices = require('../../services/vehicleServices');
const encryptData = require('../../utils/encryptData');

module.exports = (socket, io) => {
  socket.on('pendingVehicleCount', async (data, callback) => {
    console.log('pendingVehicleCount');
    try {
      const count = await vehicleServices.getVehicleCountByStatus('pending');
      callback({ count });
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        err.save();
      } catch {}
      console.log(error);
      socket.emit('error', JSON.stringify(encryptData({ msg: error.message })));
    }
  });

  socket.on('unverifiedDriversCount', async (data, callback) => {
    console.log('unverifiedDriversCount');
    try {
      const count = await userServices.unverifiedDriversCount();
      callback({ count });
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        err.save();
      } catch {}
      console.log(error);
      socket.emit('error', JSON.stringify(encryptData({ msg: error.message })));
    }
  });

  socket.on('getModulesByRole', async (data, callback) => {
    console.log('getModulesByRole');
    try {
      const { roleId } = data;
      console.log(roleId);
      const [menu, role] = await Promise.all([
        roleServices.menu(roleId),
        roleServices.getRoleByID(roleId),
      ]);
      socket.emit('moduleUpdate', { menu, role });
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        err.save();
      } catch {}
      console.log(error);
      socket.emit('error', JSON.stringify(encryptData({ msg: error.message })));
    }
  });
};
