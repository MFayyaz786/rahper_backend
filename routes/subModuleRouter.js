const express = require('express');
const subModuleRouter = express.Router();
const expressAsyncHandler = require('express-async-handler');
const subModuleServices = require('../services/subModuleServices');
const moduleServices = require('../services/moduleServices');

subModuleRouter.post(
  '/',
  expressAsyncHandler(async (req, res) => {
    let { module, name, route, icon, orderPosition } = req.body;
    const isExist = await subModuleServices.isExist(module, name);
    if (isExist) {
      res.status(400).send({ msg: 'SubModule with name already exist' });
      return;
    }
    if (orderPosition) {
      const isOrderPositionExist = await subModuleServices.isOrderPositionExist(
        module,
        orderPosition
      );
      if (isOrderPositionExist) {
        res.status(400).send({ msg: 'Module on this position already exist' });
        return;
      }
    } else {
      orderPosition = await subModuleServices.getOrderPosition(module);
    }
    const result = await subModuleServices.new(
      module,
      name,
      route,
      icon,
      orderPosition
    );
    if (result) {
      res.status(201).send({ msg: 'New SubModule added', data: result });
    } else {
      res.status(400).send({ msg: 'SubModule not added' });
    }
  })
);

subModuleRouter.get(
  '/',
  expressAsyncHandler(async (req, res) => {
    const result = await subModuleServices.getAll();
    res.status(200).send({ msg: 'Module list', data: result });
  })
);

subModuleRouter.put(
  '/',
  expressAsyncHandler(async (req, res) => {
    let { subModuleId, module, name, route, icon, orderPosition } = req.body;
    const isExist = await subModuleServices.isExist(module, name);
    if (isExist && isExist._id.toString() != subModuleId) {
      res.status(400).send({ msg: 'SubModule with name already exist' });
      return;
    }
    if (orderPosition) {
      const isOrderPositionExist = await subModuleServices.isOrderPositionExist(
        module,
        orderPosition
      );
      if (
        isOrderPositionExist &&
        isOrderPositionExist._id.toString() != subModuleId
      ) {
        res.status(400).send({ msg: 'Module on this position already exist' });
        return;
      }
    }
    const result = await subModuleServices.updateById(
      subModuleId,
      module,
      name,
      route,
      icon,
      orderPosition
    );
    if (result) {
      res.status(200).send({ msg: 'SubModule updated' });
    } else {
      res.status(400).send({ msg: 'SubModule not updated' });
    }
  })
);

subModuleRouter.patch(
  '/activeDeActive',
  expressAsyncHandler(async (req, res) => {
    const { subModuleId, active } = req.body;
    if (!subModuleId || active == undefined || active == null) {
      res.status(400).send({ msg: 'SubModule Id or active value is missing!' });
      return;
    }

    const submodules = await subModuleServices.activeDeActive(
      subModuleId,
      active
    );
    if (submodules) {
      if (active) {
        await moduleServices.activeDeActive(submodules.module, true);
      }
      res.status(200).send({
        msg: `SubModule status updated to ${active ? 'active' : 'deActive'}`,
      });
    } else {
      res.status(400).send({
        msg: `SubModules not ${active ? 'activated' : 'DeActivated'}`,
      });
    }
  })
);

subModuleRouter.delete(
  '/?',
  expressAsyncHandler(async (req, res) => {
    const { subModuleId } = req.query;
    if (!subModuleId) {
      res.status(400).send({ msg: 'SubModule Id is missing!' });
      return;
    }

    const submodules = await subModuleServices.delete(subModuleId);
    if (submodules) {
      res.status(200).send({
        msg: 'SubModule deleted',
      });
    } else {
      res.status(400).send({
        msg: `SubModules not deleted"}`,
      });
    }
  })
);
module.exports = subModuleRouter;
