const { default: mongoose } = require('mongoose');
const supportModel = require('../models/supportModel');
const supportStatuses = require('../utils/supportStatuses');

const supportServices = {
  new: async (userId, subject, subjectId, text) => {
    console.log({ userId, subject, subjectId, text });
    const message = {
      text,
      attachments: [],
      isAdmin: false,
      sendBy: mongoose.Types.ObjectId(userId),
    };
    const autoReply = {
      text: 'Our custom support representative will be with you shortly. In the meantime, kindly go through FAQS.',
      attachments: [],
      isAdmin: true,
    };
    const result = await supportModel.create({
      _id: mongoose.Types.ObjectId(),
      userId: mongoose.Types.ObjectId(userId),
      subjectId: mongoose.Types.ObjectId(subjectId),
      subject,
      chat: [message, autoReply],
    });
    console.log({ result });
    return result;
  },

  newChat: async (_id, text, isAdmin, sendBy) => {
    const result = await supportModel
      .findOneAndUpdate(
        { _id },
        {
          delete: false,
          $push: {
            chat: {
              text,
              attachments: [],
              isAdmin,
              sendBy: mongoose.Types.ObjectId(sendBy),
            },
          },
        },
        { new: true }
      )
      .populate({
        path: 'userId',
        select: 'firstName lastName profileImage active',
      });
    return result;
  },

  updateStatus: async (_id, status) => {
    const result = await supportModel.findOneAndUpdate(
      { _id },
      {
        status,
      },
      { new: true }
    );
    return result;
  },

  uploadAttachments: async (_id, messageId, attachment) => {
    const result = await supportModel.findOneAndUpdate(
      {
        _id,
        'chat._id': messageId,
      },
      {
        $push: { 'chat.$.attachments': attachment },
      },
      { new: true }
    );
    return result;
  },

  allForPanel: async (page, status, startDate, endDate) => {
    if (startDate && endDate) {
      startDate = new Date(startDate);
      endDate = new Date(endDate);
      endDate.setDate(endDate.getDate() + 1);
      const list = await supportModel
        .find(
          {
            status,
            createdAt: {
              $gte: startDate,
              $lt: endDate,
            },
          },
          { userId: 1, status: 1, subject: 1, chat: { $slice: -1 } }
        )
        .populate({
          path: 'userId',
          select: 'firstName lastName selectedUserType profileImage',
        })

        .sort({ updatedAt: -1 })
        .skip(page * 10)
        .limit(10);
      return list;
    }
    const list = await supportModel
      .find(
        { status },
        { userId: 1, status: 1, subject: 1, chat: { $slice: -1 } }
      )
      .populate({
        path: 'userId',
        select: 'firstName lastName selectedUserType profileImage',
      })

      .sort({ updatedAt: -1 })
      .skip(page * 10)
      .limit(10);
    return list;
  },

  totalCount: async (status, startDate, endDate) => {
    if (startDate && endDate) {
      startDate = new Date(startDate);
      endDate = new Date(endDate);
      endDate.setDate(endDate.getDate() + 1);
      const count = await supportModel.count({
        status,
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      });
      return count;
    }
    const count = await supportModel.count({ status });
    return count;
  },
  allForUser: async (userId, flag, page) => {
    if (flag == supportStatuses.OPEN) {
      const list = await supportModel
        .find(
          { userId, status: flag },
          { userId: 1, status: 1, subject: 1, chat: { $slice: -1 } }
        )
        .sort({ updatedAt: -1 })
        .skip(page * 10)
        .limit(10);
      return list;
    }

    const list = await supportModel
      .find(
        { userId, status: 'close' },
        { userId: 1, status: 1, subject: 1, chat: { $slice: -1 } }
      )
      .sort({ updatedAt: -1 })
      .skip(page * 10)
      .limit(10);

    return list;
  },
  byId: async (_id, isAdmin) => {
    await supportModel.findOneAndUpdate(
      {
        _id,
        'chat.isAdmin': isAdmin,
        'chat.seen': false,
      },
      {
        'chat.$.seen': true,
      },
      { new: true }
    );
    const result = await supportModel
      .findOne({
        _id,
      })
      .populate({
        path: 'userId',
        select:
          'firstName lastName profileImage active userType mobile email gender cnic totalRatingCount totalRating dob selectedUserType loginDevice',
      });
    return result;
  },

  stat: async () => {
    const result = await supportModel.aggregate([
      {
        $group: {
          _id: '$subjectId',
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'SupportSubject',
          localField: 'subjectId',
          foreignField: '_id',
          as: 'subject',
        },
      },
      {
        $unwind: '$subject',
      },
      {
        $project: {
          count: 1,
          subject: '$subject.subject',
          _id: '$subject._id',
        },
      },
    ]);
    return result;
  },
};

module.exports = supportServices;
