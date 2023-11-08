const express = require('express');
const asyncHandler = require('express-async-handler');
const adsServices = require('../services/adsServices');
const uploadFile = require('../utils/uploadFile');
const adsRouter = express.Router();

//route for adding new ad
adsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    let { title, image, buttonText, redirectUrl } = req.body;
    imageUrl = await uploadFile(image);
    if (!imageUrl) {
      res.status(400).send({ msg: 'image should be in base46!' });
      return;
    }
    const result = await adsServices.newAd(
      title,
      imageUrl,
      buttonText,
      redirectUrl
    );
    if (result) {
      res.status(200).send({ msg: 'Ad listed!', data: result });
    }
  })
);

adsRouter.put(
  '/',
  asyncHandler(async (req, res) => {
    let { id, title, image, buttonText, redirectUrl } = req.body;
    if (image) {
      image = await uploadFile(image);
      if (!image) {
        res.status(400).send({ msg: 'image should be in base46!' });
        return;
      }
    }
    const result = await adsServices.update(
      id,
      title,
      image,
      buttonText,
      redirectUrl
    );
    if (result) {
      res.status(200).send({ msg: 'Ad updated!', data: result });
    } else {
      res.status(400).send({ msg: 'Ad not updated!' });
    }
  })
);

//for panel same as below list api
adsRouter.get(
  '/?',
  asyncHandler(async (req, res) => {
    const { pageNumber, text } = req.query;
    const [result, count] = await Promise.all([
      adsServices.getAdsWithPagination(pageNumber, text),
      adsServices.totalCount(text),
    ]);
    res.status(200).send({ msg: 'Ads list', data: result, count });
  })
);

//route to gel all posted ads for app
adsRouter.get(
  '/list',
  asyncHandler(async (req, res) => {
    const result = await adsServices.getAds();
    res.status(200).send({ msg: 'Ads list', data: result });
  })
);

adsRouter.delete(
  '/?',
  asyncHandler(async (req, res) => {
    const { id } = req.query;
    if (!id) {
      res.status(400).send({ msg: 'Ad id is missing!' });
      return;
    }
    const result = await adsServices.delete(id);
    if (result) {
      res.status(200).send({ msg: 'Ad deleted!' });
    } else {
      res.status(400).send({ msg: 'Ad not deleted!' });
    }
  })
);

module.exports = adsRouter;
