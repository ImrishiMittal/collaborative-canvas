const rooms = {}; 
// rooms = { roomId: { users: { socketId: { id, color } } } }

const colors = ["#1e90ff", "#ff1744", "#00e676", "#ffc400", "#7c4dff", "#ff6d00"];

function getRandomColor() {
  return colors[Math.floor(Math.random() * colors.length)];
}

function joinRoom(roomId, socketId) {
  if (!rooms[roomId]) rooms[roomId] = { users: {} };

  const color = getRandomColor();
  rooms[roomId].users[socketId] = { id: socketId, color };

  return rooms[roomId].users[socketId];
}

function leaveRoom(roomId, socketId) {
  if (!rooms[roomId]) return;
  delete rooms[roomId].users[socketId];

  if (Object.keys(rooms[roomId].users).length === 0) {
    delete rooms[roomId];
  }
}

function getUsers(roomId) {
  if (!rooms[roomId]) return [];
  return Object.values(rooms[roomId].users);
}

module.exports = { joinRoom, leaveRoom, getUsers };
