const {
  createRoom,
  newMessage,
  generateRoomId,
  seenChat,
  getCount,
  addCount,
  removeCounter,
} = require("../../utils/chats");
const userSerivces = require("../../services/userServices");
const notificationServices = require("../../services/notifcationServices");
const encryptData = require("../../utils/encryptData");
const decryptData = require("../../utils/decryptData");
const { getUserSocket } = require("../../utils/userSocketId");
const exceptionErrorsModel = require("../../models/exceptionErrorsModel");

module.exports = (socket, io) => {
  socket.on("chat", (data, callback) => {
    try {
      data = decryptData(JSON.parse(data).cipher);
      const { sender, receiver, routeId, scheduleId } = data;
      // console.log(data);
      const room = generateRoomId(sender, receiver, routeId, scheduleId);
      console.log({ room });
      socket.join(room);
      // console.log(socket.rooms);
      const chat = createRoom(sender, receiver, routeId, scheduleId);
      console.log(removeCounter(sender, receiver, routeId, scheduleId));
      // console.log(chat);
      socket.emit("chat", JSON.stringify(encryptData({ chat })));
      callback(encryptData({ msg: "Chat", chat }));
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        err.save();
      } catch {}
      console.log(error);
      socket.emit("error", JSON.stringify(decryptData({ msg: error.message })));
    }
  });
  socket.on("sendMessage", async (data, callback) => {
    try {
      data = decryptData(JSON.parse(data).cipher);
      const {
        userId,
        name,
        profileImage,
        message,
        receiver,
        date,
        routeId,
        scheduleId,
      } = data;
      const sendMessage = newMessage(
        userId,
        name,
        profileImage,
        message,
        receiver,
        date,
        routeId,
        scheduleId
      );
      const room = generateRoomId(userId, receiver, routeId, scheduleId);
      var sendToReciver = false;
      const receiverSocket = getUserSocket(receiver);
      // const rooms = io.sockets.adapter.rooms;
      // console.log(rooms)
      // console.log(rooms);
      // chatRoom = rooms.get(room);
      // chatRoom.forEach((item) => {
      //   if (item == receiverSocket.socketId) {
      //     console.log("in chat");
      //     sendToReciver = true;
      //   }
      // });
      // const sockets = io.sockets.adapter.rooms.get(room);
      // for (let i = 0; i < sockets.length; i++) {
      //   if (sockets[i][receiverSocket.socketId]) {
      //     sendToReciver = true;
      //     break;
      //   }
      // }
      // if (sendToReciver) {
      console.log({ chatRoom: room });
      io.to(room).emit(
        "newMessage",
        JSON.stringify(
          encryptData({ userId, name, profileImage, message, receiver, date })
        )
      );
      // } else {
      const count = addCount(userId, receiver, routeId, scheduleId);
      console.log({ count, receiverSocket });
      if (receiverSocket)
        io.to(receiverSocket.socketId).emit(
          "newMessageReceived",
          JSON.stringify(
            encryptData({ userId: receiver, count, sender: userId })
          )
        );
      // }
      const user = await userSerivces.getUserById(receiver);
      user.fcmToken &&
        (await notificationServices.newNotification(
          message,
          "You have a new message",
          user.fcmToken,
          {}
        ));
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        err.save();
      } catch {}
      console.log(error);
      socket.emit("error", JSON.stringify(encryptData({ msg: error.message })));
    }
  });

  socket.on("leaveChatRoom", (data, callback) => {
    try {
      data = decryptData(JSON.parse(data).cipher);
      const { sender, receiver, routeId, scheduleId } = data;
      const roomId = generateRoomId(sender, receiver, routeId, scheduleId);
      console.log(removeCounter(sender, receiver, routeId, scheduleId));
      socket.leave(roomId);
      // console.log(socket.rooms);
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        err.save();
      } catch {}
      console.log(error);
      socket.emit("error", JSON.stringify(encryptData({ msg: error.message })));
    }
  });

  // socket.on("markSeen", (data, callback) => {
  //   const { user, other } = data;
  //   seenChat(user, other);
  // });

  // socket.on("chatCount", (data, callback) => {
  //   const { user, other } = data;
  //   const count = getCount(user, other);
  //   callback({ count });
  // });
  // socket.on('deleteChat',JSON.stringify(//))
};
