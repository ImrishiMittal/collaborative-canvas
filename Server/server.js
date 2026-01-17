const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const { joinRoom, leaveRoom, getUsers } = require("./rooms");
const { addStroke, undo, redo, getState } = require("./drawing-state");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Collaborative Canvas Server Running");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("✅ User Connected:", socket.id);

  let currentRoomId = null;

  // ✅ cursor broadcast
  socket.on("cursor:move", ({ roomId, cursor }) => {
    socket.to(roomId).emit("cursor:move", { socketId: socket.id, cursor });
  });

  // ✅ join room
  socket.on("join-room", ({ roomId }) => {
    currentRoomId = roomId;
    socket.join(roomId);

    const user = joinRoom(roomId, socket.id);

    // ✅ send existing canvas history to newly joined user
    socket.emit("history:update", getState(roomId));

    // send assigned color to this user
    socket.emit("user:me", user);

    // broadcast users list to room
    io.to(roomId).emit("room:users", getUsers(roomId));

    console.log(`✅ ${socket.id} joined room: ${roomId}`);
  });

  // ✅ realtime move broadcast
  socket.on("draw:move", ({ roomId, from, to, settings }) => {
    socket.to(roomId).emit("draw:move", { from, to, settings });
  });

  // ✅ store full stroke in history + broadcast new history
  socket.on("stroke:end", ({ roomId, stroke }) => {
    addStroke(roomId, stroke);
    io.to(roomId).emit("history:update", getState(roomId));
  });

  // ✅ GLOBAL Undo
  socket.on("history:undo", ({ roomId }) => {
    undo(roomId);
    io.to(roomId).emit("history:update", getState(roomId));
  });

  // ✅ GLOBAL Redo
  socket.on("history:redo", ({ roomId }) => {
    redo(roomId);
    io.to(roomId).emit("history:update", getState(roomId));
  });

  // ✅ disconnect
  socket.on("disconnect", () => {
    if (currentRoomId) {
      leaveRoom(currentRoomId, socket.id);
      io.to(currentRoomId).emit("room:users", getUsers(currentRoomId));
      socket.to(currentRoomId).emit("cursor:remove", { socketId: socket.id });
    }
    console.log("❌ User Disconnected:", socket.id);
  });
  
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
