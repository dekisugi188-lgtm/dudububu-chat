const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

io.on("connection", (socket) => {
  let room = null;

  socket.on("join-room", (password) => {
    room = password;
    socket.join(room);
    socket.to(room).emit("status", "online");
  });

  socket.on("typing", () => socket.to(room).emit("typing"));
  socket.on("stop-typing", () => socket.to(room).emit("stop-typing"));

  socket.on("message", (msg) => socket.to(room).emit("message", msg));
  socket.on("media", (data) => socket.to(room).emit("media", data));

  // SIMPLE video call signaling (previous style)
  socket.on("call-offer", (data) => socket.to(room).emit("call-offer", data));
  socket.on("call-answer", (data) => socket.to(room).emit("call-answer", data));
  socket.on("ice", (data) => socket.to(room).emit("ice", data));
  socket.on("end-call", () => socket.to(room).emit("end-call"));

  socket.on("disconnect", () => {
    if (room) socket.to(room).emit("status", "offline");
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () =>
  console.log("Server running on http://localhost:" + PORT)
);
