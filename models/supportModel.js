const mongoose = require('mongoose');
const supportStatuses = require('../utils/supportStatuses');

const Schema = mongoose.Schema;

const schema = new Schema(
  {
    userId: { type: mongoose.Types.ObjectId, ref: 'User' },
    status: { type: String, default: supportStatuses.OPEN },
    subject: { type: String, default: 'Support' },
    subjectId: { type: Schema.Types.ObjectId, ref: 'SupportSubject' },
    assignToRole: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      default: null,
    },
    deleted: {
      type: Boolean,
      default: true,
    },
    chat: [
      new Schema(
        {
          text: { type: String, default: '' },
          attachments: [String],
          isAdmin: { type: Boolean, default: false },
          sendBy: { type: mongoose.Types.ObjectId },
          seen: { type: Boolean, default: false },
        },
        { timestamps: true }
      ),
    ],
  },
  { timestamps: true }
);

const supportModel = new mongoose.model('Support', schema);

module.exports = supportModel;
