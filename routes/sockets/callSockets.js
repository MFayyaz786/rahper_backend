const { getUserSocket } = require('../../utils/userSocketId');

module.exports = (socket, io) => {
  socket.emit('me', socket.id);
  socket.on('callUser', ({ userToCall, signalData, from, name }) => {
    console.log({ userToCall, signalData, from, name });
    if (userToCall == 'admin') {
      io.to(userToCall).emit('callUser', { signal: signalData, from, name });
    } else {
      const userSocket = getUserSocket(userToCall);
      io.to(userSocket?.socketId).emit('callUser', {
        signal: signalData,
        from,
        name,
      });
    }
  });

  socket.on('answerCall', (data) => {
    console.log(data);
    if (data.to == 'admin') {
      io.to(data.to).emit('callAccepted', data.signal);
    } else {
      const userSocket = getUserSocket(data.to);
      io.to(userSocket?.socketId).emit('callAccepted', data.signal);
    }
  });
  socket.on('dropCall', ({ from, userToCall }) => {
    console.log({ from, userToCall });
    if (from) {
      if (from == 'admin') {
        io.to(from).emit('dropCall');
      } else {
        const userSocket = getUserSocket(from);
        io.to(userSocket?.socketId).emit('dropCall');
      }
    } else {
      if (userToCall == 'admin') {
        io.to(userToCall).emit('dropCall');
      } else {
        const userSocket = getUserSocket(userToCall);
        io.to(userSocket?.socketId).emit('dropCall');
      }
    }
  });
};
