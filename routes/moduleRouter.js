const express = require('express');
const moduleRouter = express.Router();
const expressAsyncHandler = require('express-async-handler');
const moduleServices = require('../services/moduleServices');
const subModuleServices = require('../services/subModuleServices');

moduleRouter.post(
  '/',
  expressAsyncHandler(async (req, res) => {
    let { name, route, icon, orderPosition } = req.body;
    const isExist = await moduleServices.isExist(name);
    if (isExist) {
      res.status(400).send({ msg: 'Module with name already exist' });
      return;
    }
    if (orderPosition) {
      const isOrderPositionExist = await moduleServices.isOrderPositionExist(
        orderPosition
      );
      if (isOrderPositionExist) {
        res.status(400).send({ msg: 'Module on this position already exist' });
        return;
      }
    } else {
      orderPosition = await moduleServices.getOrderPosition();
    }
    const result = await moduleServices.new(name, route, icon, orderPosition);
    if (result) {
      res.status(201).send({ msg: 'New Module added', data: result });
    } else {
      res.status(400).send({ msg: 'Module not added' });
    }
  })
);

moduleRouter.get(
  '/',
  expressAsyncHandler(async (req, res) => {
    const result = await moduleServices.getAll(true);
    if (result) {
      res.status(200).send({ msg: 'Module list', data: result });
    } else {
      res.status(400).send({ msg: 'Module not added' });
    }
  })
);

moduleRouter.put(
  '/',
  expressAsyncHandler(async (req, res) => {
    let { moduleId, name, route, icon, orderPosition } = req.body;
    const isExist = await moduleServices.isExist(name);
    if (isExist && isExist?._id.toString() != moduleId) {
      res.status(400).send({ msg: 'Module with name already exist' });
      return;
    }
    if (orderPosition) {
      const isOrderPositionExist = await moduleServices.isOrderPositionExist(
        orderPosition
      );
      if (
        isOrderPositionExist &&
        isOrderPositionExist?._id.toString() != moduleId
      ) {
        res.status(400).send({ msg: 'Module on this position already exist' });
        return;
      }
    } else {
      orderPosition = await moduleServices.getOrderPosition();
    }
    const result = await moduleServices.updateById(
      moduleId,
      name,
      route,
      icon,
      orderPosition
    );
    if (result) {
      res.status(201).send({ msg: 'New Module updated', data: result });
    } else {
      res.status(400).send({ msg: 'Module not updated' });
    }
  })
);

moduleRouter.patch(
  '/activeDeActive',
  expressAsyncHandler(async (req, res) => {
    const { moduleId, active } = req.body;
    if (!moduleId || active == undefined || active == null) {
      res.status(400).send({ msg: 'Module Id or active value is missing!' });
      return;
    }
    const result = await moduleServices.activeDeActive(moduleId, active);
    if (result) {
      const submodules = await subModuleServices.activeDeActiveModule(
        moduleId,
        active
      );
      if (submodules) {
        res.status(200).send({
          msg: `Module status updated to ${active ? 'active' : 'deActive'}`,
        });
      } else {
        res.status(400).send({
          msg: `SubModules not ${active ? 'activated' : 'DeActivated'}`,
        });
      }
    } else {
      res
        .status(400)
        .send({ msg: `Module not ${active ? 'activated' : 'DeActivated'}` });
    }
  })
);

moduleRouter.delete(
  '/?',
  expressAsyncHandler(async (req, res) => {
    const { moduleId } = req.query;
    if (!moduleId) {
      res.status(400).send({ msg: 'Module Id is missing!' });
      return;
    }
    const result = await moduleServices.delete(moduleId);
    if (result) {
      const submodules = await subModuleServices.deleteModule(moduleId);
      if (submodules) {
        res.status(200).send({
          msg: 'Module deleted',
        });
      } else {
        res.status(400).send({
          msg: `SubModules not deleted"}`,
        });
      }
    } else {
      res.status(400).send({ msg: 'Module not deleted' });
    }
  })
);
module.exports = moduleRouter;
