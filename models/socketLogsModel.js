const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    eventName: { type: String },
    data: { type: Object },
    response: { type: Object },
  },
  {
    timestamps: true,
  }
);

const socketLogsModel = new mongoose.model("SocketLog", schema);

module.exports = socketLogsModel;
