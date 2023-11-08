let Sockets = null;

const setIO = (socket) => {
  // console.log(socket);
  Sockets = socket;
};

const getIO = () => {
  return Sockets;
};

module.exports = { getIO, setIO };
