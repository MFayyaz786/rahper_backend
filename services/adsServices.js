const adsModel = require('../models/adsModel');
const uploadFile = require('../utils/uploadFile');

const adsServices = {
  //adding new ad service
  newAd: async (title, imageUrl, buttonText, redirectUrl) => {
    // imageUrl = await uploadFile(imageUrl);
    const ad = new adsModel({
      title,
      imageUrl,
      buttonText,
      redirectUrl,
      // deleted: false,
    });
    const result = await ad.save();
    return result;
  },
  update: async (adsId, title, imageUrl, buttonText, redirectUrl) => {
    if (imageUrl) {
      const result = await adsModel.findOneAndUpdate(
        { _id: adsId },
        { title, imageUrl, buttonText, redirectUrl },
        { new: true }
      );
      return result;
    } else {
      const result = await adsModel.findOneAndUpdate(
        { _id: adsId },
        { title, buttonText, redirectUrl },
        { new: true }
      );
      return result;
    }
  },

  //will return ads list with date sorted
  getAds: async () => {
    const list = await adsModel.find({ deleted: false }).sort('-createdAt');
    return list;
  },

  getAdsWithPagination: async (pageNumber = 0, text) => {
    pageNumber = parseInt(pageNumber) + 1;
    const pageSize = 50; // Specify the number of documents per page
    const skip = (pageNumber - 1) * pageSize;
    console.log(text == 'undefined');
    if (text) {
      const list = await adsModel
        .find({ deleted: false, $text: { $search: text } })
        .sort('-createdAt')
        .skip(skip)
        .limit(pageSize);
      return list;
    }

    const list = await adsModel
      .find({ deleted: false })
      .sort('-createdAt')
      .skip(skip)
      .limit(pageSize);
    return list;
  },

  totalCount: async (text) => {
    if (text) {
      const count = await adsModel.count({
        deleted: false,
        $text: { $search: text },
      });
      return count;
    }
    const count = await adsModel.count({ deleted: false });
    return count;
  },

  delete: async (_id) => {
    const result = await adsModel.findOneAndUpdate({ _id }, { deleted: true });
    return result;
  },
};

module.exports = adsServices;
