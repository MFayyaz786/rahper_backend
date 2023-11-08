const express = require('express');
const smsLogServices = require('../services/smsLogServices');
const smsLogRouter = express.Router();

smsLogRouter.get('/?', async (req, res) => {
  let { startDate, endDate } = req.query;
  if (!startDate || !endDate) {
    endDate = new Date();
    startDate = new Date();
    startDate.setDate(1); // Set the start date to the first day of the month
  } else {
    endDate = new Date(endDate);
    startDate = new Date(startDate);
  }
  const todayEndDate = new Date();
  const todayStartDate = new Date();
  todayStartDate.setHours(0, 0, 0, 0);

  const thisMonthEndDate = new Date(todayStartDate); // Use today's date as the end date for this month
  const thisMonthStartDate = new Date(todayStartDate);
  thisMonthStartDate.setDate(1); // Set the start date to the first day of the month
  thisMonthStartDate.setHours(0, 0, 0, 0);

  const [list, count, today, thisMonth] = await Promise.all([
    smsLogServices.getLogsWithinDateRange(startDate, endDate),
    smsLogServices.getLogsCountWithinDateRange(startDate, endDate),
    smsLogServices.getLogsCountWithinDateRange(todayStartDate, todayEndDate),
    smsLogServices.getLogsCountWithinDateRange(
      thisMonthStartDate,
      thisMonthEndDate
    ),
  ]);
  res
    .status(200)
    .send({ msg: 'SMS Logs list!', data: list, count, today, thisMonth });
});

module.exports = smsLogRouter;
