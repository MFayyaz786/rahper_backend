const express = require('express');
const expressAsyncHandler = require('express-async-handler');
const corporateServices = require('../services/corporateServices');
const corporateRouter = express.Router();

corporateRouter.post(
  '/',
  expressAsyncHandler(async (req, res) => {
    const { name, code, address, fee } = req.body;
    if (!name || !code || !address) {
      res.status(400).send({ msg: 'Please provide name and code!' });
    } else {
      const result = await corporateServices.addNew(
        name,
        code,
        address,
        fee || 0
      );
      if (result) {
        res.status(200).send({ msg: 'Corporate Added!' });
      } else {
        res.send(400).send({ msg: 'Failed to add corporate!' });
      }
    }
  })
);
corporateRouter.patch(
  '/updateStatus',
  expressAsyncHandler(async (req, res) => {
    const { corporateId, active } = req.body;
    const result = await corporateServices.updateStatus(corporateId, active);
    if (result) {
      res.status(200).send({ msg: 'Status updated' });
    } else {
      res.status(400).send({ msg: 'Status not updated' });
    }
  })
);
corporateRouter.patch(
  '/updateFee',
  expressAsyncHandler(async (req, res) => {
    const { corporateId, fee } = req.body;
    if (!corporateId || fee == undefined || fee == null) {
      res.status(400).send({ msg: 'Please provide Corporate Id and Fee!' });
    } else {
      const result = await corporateServices.updateFee(corporateId, fee);
      if (result) {
        res.status(200).send({ msg: 'Corporate fee updated!' });
      } else {
        res.send(400).send({ msg: 'Corporate fee not updated!' });
      }
    }
  })
);

corporateRouter.get(
  '/all/?',
  expressAsyncHandler(async (req, res) => {
    const { pageNumber, text } = req.query;
    const [result, count] = await Promise.all([
      corporateServices.getAll(pageNumber, text),
      corporateServices.totalCount(text),
    ]);
    res.status(200).send({ msg: 'Corporate list!', data: result, count });
  })
);

module.exports = corporateRouter;
