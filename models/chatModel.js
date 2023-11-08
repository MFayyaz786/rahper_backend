const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  passenger: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  driver: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  route: {
    type: Schema.Types.ObjectId,
    ref: "DriverRoute",
  },
  schedule: {
    type: Schema.Types.ObjectId,
    ref: "ScheduleRide",
  },
  roomId: {
    type: String,
  },
  chat: [],
});

const chatModel = new mongoose.model("Chat", schema);

module.exports = chatModel;
