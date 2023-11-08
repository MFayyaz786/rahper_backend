const exceptionErrorsModel = require('../../models/exceptionErrorsModel');
const supportServices = require('../../services/supportServices');
const vehicleServices = require('../../services/vehicleServices');
const decryptData = require('../../utils/decryptData');
const encryptData = require('../../utils/encryptData');
const socketEmitters = require('../../utils/socketEmitters');
const supportStatuses = require('../../utils/supportStatuses');
const uploadFile = require('../../utils/uploadFile');
const { getUserSocket } = require('../../utils/userSocketId');

module.exports = (socket, io) => {
  socket.on('newTicket', async (data, callback) => {
    console.log('newTicket');
    try {
      data = decryptData(JSON.parse(data).cipher);
      //userType is the type of user who is creating this ticket (admin||null for user)
      const { userId, subject, subjectId, userType, text } = data;
      const result = await supportServices.new(
        userId,
        subject,
        subjectId,
        text
      );
      if (result) {
        if (userType == 'admin') {
          const userSocket = getUserSocket(userId);
          if (userSocket)
            io.to(userSocket.socketId).emit(
              'newTicket',
              JSON.stringify(
                encryptData({
                  msg: 'New support ticket created by admin',
                  data: result,
                })
              )
            );
        } else {
          io.to('admin').emit(
            'newTicket',
            JSON.stringify(encryptData({ msg: '', data: result }))
          );
        }
        callback(encryptData({ msg: '', data: result }));
      } else {
        socket.emit(
          socketEmitters.ERROR,
          JSON.stringify(encryptData({ msg: 'Ticket not created!' }))
        );
      }
    } catch (error) {
      try {
        console.log(error);
        const err = new exceptionErrorsModel({ error });
        err.save();
      } catch {}
      socket.emit(
        socketEmitters.ERROR,
        JSON.stringify(encryptData({ msg: error.message }))
      );
    }
  });

  socket.on('ticketChat', async (data, callback) => {
    console.log('ticketChat');
    try {
      console.log(data);
      data = decryptData(JSON.parse(data).cipher);
      const { ticketId, isAdmin } = data;
      socket.join(ticketId);
      const result = await supportServices.byId(ticketId, isAdmin);
      if (result) {
        callback(encryptData({ msg: '', data: result }));
      } else {
        socket.emit(
          socketEmitters.ERROR,
          JSON.stringify(encryptData({ msg: 'Ticket not found!' }))
        );
      }
    } catch (error) {
      try {
        console.log(error);
        const err = new exceptionErrorsModel({ error });
        err.save();
      } catch {}
      socket.emit(
        socketEmitters.ERROR,
        JSON.stringify(encryptData({ msg: error.message }))
      );
    }
  });

  socket.on('userTickets', async (data, callback) => {
    console.log('userTickets');
    try {
      data = decryptData(JSON.parse(data).cipher);
      console.log(data);

      const { userId, flag, page } = data;
      const result = await supportServices.allForUser(userId, flag, page);
      if (result) {
        callback(encryptData({ msg: '', data: result }));
      } else {
        socket.emit(
          socketEmitters.ERROR,
          JSON.stringify(encryptData({ msg: 'Ticket not found!' }))
        );
      }
    } catch (error) {
      try {
        console.log(error);
        const err = new exceptionErrorsModel({ error });
        err.save();
      } catch {}
      socket.emit(
        socketEmitters.ERROR,
        JSON.stringify(encryptData({ msg: error.message }))
      );
    }
  });

  socket.on('allTickets', async (data, callback) => {
    console.log('allTickets');
    try {
      data = decryptData(JSON.parse(data).cipher);
      const { page, flag, startDate, endDate } = data;
      const [result, count] = await Promise.all([
        supportServices.allForPanel(page, flag, startDate, endDate),
        supportServices.totalCount(flag, startDate, endDate),
      ]);
      if (result) {
        callback(encryptData({ msg: '', data: result, count }));
      } else {
        socket.emit(
          socketEmitters.ERROR,
          JSON.stringify(encryptData({ msg: 'No ticket found' }))
        );
      }
    } catch (error) {
      try {
        console.log(error);
        const err = new exceptionErrorsModel({ error });
        err.save();
      } catch {}
      socket.emit(
        socketEmitters.ERROR,
        JSON.stringify(encryptData({ msg: error.message }))
      );
    }
  });

  socket.on('newSupportMessage', async (data, callback) => {
    console.log('newSupportMessage');
    try {
      data = decryptData(JSON.parse(data).cipher);
      let { ticketId, text, isAdmin, sendBy } = data;
      const result = await supportServices.newChat(
        ticketId,
        text,
        isAdmin,
        sendBy
      );
      if (result) {
        if (result.chat.length > 0) {
          result.chat = [result.chat[result.chat.length - 1]];
          const updatedResult = {
            chat: result.chat[0],
            isAdmin: result.isAdmin,
          };
          io.to(ticketId).emit(
            'newSupportMessage',
            encryptData({
              msg: '',
              data: updatedResult,
            })
          );
          result.userId = result.userId._id;
          callback(encryptData({ msg: '', data: result.chat[0] }));
        }
      } else {
        socket.emit(
          socketEmitters.ERROR,
          JSON.stringify(encryptData({ msg: 'Ticket not found!' }))
        );
      }
    } catch (error) {
      try {
        console.log(error);
        const err = new exceptionErrorsModel({ error });
        err.save();
      } catch {}
      socket.emit(
        socketEmitters.ERROR,
        JSON.stringify(encryptData({ msg: error.message }))
      );
    }
  });

  socket.on('uploadSupportAttachments', async (data, callback) => {
    console.log('uploadSupportAttachments');
    try {
      data = decryptData(JSON.parse(data).cipher);
      let { ticketId, messageId, attachment } = data;
      console.log(ticketId, messageId);
      if (attachment) {
        attachment = await uploadFile(attachment);
      } else {
        socket.emit(
          socketEmitters.ERROR,
          JSON.stringify(encryptData({ msg: 'No attachment attached!' }))
        );
        return;
      }
      const result = await supportServices.uploadAttachments(
        ticketId,
        messageId,
        attachment
      );
      if (result) {
        callback(encryptData({ ticketId, messageId, attachment }));
        io.to(ticketId).emit(
          'newSupportAttachments',
          encryptData({
            msg: 'New Attachments',
            data: { ticketId, messageId, attachment },
          })
        );
      } else {
        socket.emit(
          socketEmitters.ERROR,
          JSON.stringify(encryptData({ msg: 'Ticket not found!' }))
        );
      }
    } catch (error) {
      try {
        console.log(error);
        const err = new exceptionErrorsModel({ error });
        err.save();
      } catch {}
      socket.emit(
        socketEmitters.ERROR,
        JSON.stringify(encryptData({ msg: error.message }))
      );
    }
  });

  socket.on('updateStatusSupportTicket', async (data, callback) => {
    console.log('updateStatusSupportTicket');
    try {
      data = decryptData(JSON.parse(data).cipher);
      const { ticketId, status } = data;
      const result = await supportServices.updateStatus(ticketId, status);

      if (result) {
        callback(encryptData({ msg: `Ticket ${status}!`, data: { ticketId } }));
        io.to(ticketId).emit(
          'updateStatusSupportTicket',
          encryptData({
            msg: `Ticket ${status}!`,
            data: { ticketId },
          })
        );
      } else {
        socket.emit(
          'error',
          JSON.stringify(encryptData({ msg: 'Ticket not found' }))
        );
      }
      if (status == supportStatuses.CLOSE) socket.leave(roomId);
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        err.save();
      } catch {}
      console.log(error);
      socket.emit('error', JSON.stringify(encryptData({ msg: error.message })));
    }
  });

  socket.on('leaveSupportRoom', (data, callback) => {
    try {
      data = decryptData(JSON.parse(data).cipher);
      const { roomId } = data;
      socket.leave(roomId);
    } catch (error) {
      try {
        const err = new exceptionErrorsModel({ error });
        err.save();
      } catch {}
      console.log(error);
      socket.emit('error', JSON.stringify(encryptData({ msg: error.message })));
    }
  });
};
