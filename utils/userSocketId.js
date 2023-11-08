var ids = [];

const addAnId = (userId, socketId, name) => {
  ids.push({ userId, socketId, name });
  console.log(ids);
};

const deleteAnId = (socketId) => {
  ids = ids.filter((id) => socketId !== id.socketId);
  console.log(ids);
};

const getUserSocket = (userId) => {
  return ids.find((item) => {
    return item.userId == userId;
  });
};

const getUserSockets = (userId) => {
  return ids.filter((item) => {
    return item.userId == userId;
  });
};
module.exports = { addAnId, deleteAnId, getUserSocket, getUserSockets };
