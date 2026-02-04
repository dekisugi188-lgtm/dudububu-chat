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
    socket.to(room).emit("user-online");
  });

  socket.on("encrypted-message", ({ room, data }) => {
    socket.to(room).emit("encrypted-message", data);
  });

  // WebRTC signaling
  socket.on("call-user", ({ room, offer }) => {
    socket.to(room).emit("incoming-call", offer);
  });

  socket.on("answer-call", ({ room, answer }) => {
    socket.to(room).emit("call-answered", answer);
  });

  socket.on("ice-candidate", ({ room, candidate }) => {
    socket.to(room).emit("ice-candidate", candidate);
  });

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
