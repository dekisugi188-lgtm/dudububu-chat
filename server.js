const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

io.on("connection", (socket) => {
  socket.on("join-room", (room) => {
    socket.join(room);
    socket.room = room;
    socket.to(room).emit("status", "online");
  });

  socket.on("message", (msg) => {
    socket.to(socket.room).emit("message", msg);
  });

  socket.on("disconnect", () => {
    if (socket.room) socket.to(socket.room).emit("status", "offline");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log("Server running on port", PORT)
);
