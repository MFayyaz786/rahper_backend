const express = require('express');
const expressAsyncHandler = require('express-async-handler');
const paymentHistoryService = require('../services/paymentHistoryServices');
const paymentHistoryRouter = express.Router();

paymentHistoryRouter.get(
  '/receiptBySchedule?',
  expressAsyncHandler(async (req, res) => {
    const { scheduleId } = req.query;
    if (!scheduleId) {
      res.status(400).send({ msg: 'Provide schedule Id!' });
    }
    const result = await paymentHistoryService.getBySchedule(scheduleId);
    if (result) {
      if (result.method == 'zindigi') {
        result.amount = result.paymentDetails.totalTransactionAmount;
        result.transactionId = result.paymentDetails.transactioId;
        res.status(200).send({ msg: 'Receipt', data: result });
      } else if (result.method == 'payfast') {
        result.amount = result.paymentDetails.transaction_amount;
        result.transactionId = result.paymentDetails.transaction_id;
        res.status(200).send({ msg: 'Receipt', data: result });
      } else if (result.method == 'unpaid') {
        res.status(400).send({ msg: 'No receipt found due to unpaid ride' });
      }
    } else {
      res.status(400).send({ msg: 'Receipt not found' });
    }
  })
);

paymentHistoryRouter.get(
  '/?',
  expressAsyncHandler(async (req, res) => {
    const { status, startDate, endDate, text } = req.query;
    const result = await paymentHistoryService.paymentDetails([status], text);
    res.status(200).send({ msg: '', data: result });
  })
);
paymentHistoryRouter.get(
  '/driverHistory?',
  expressAsyncHandler(async (req, res) => {
    const { userId, pageNumber } = req.query;
    const result = await paymentHistoryService.driverPaymentsHistory(
      userId,
      pageNumber
    );
    res.status(200).send({ msg: 'Owner payment history!', data: result });
  })
);

module.exports = paymentHistoryRouter;
