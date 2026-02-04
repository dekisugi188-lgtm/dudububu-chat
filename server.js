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
    socket.to(room).emit("user-online");
  });

  socket.on("typing", () => {
    socket.to(room).emit("typing");
  });

  socket.on("stop-typing", () => {
    socket.to(room).emit("stop-typing");
  });

  socket.on("message", (msg) => {
    socket.to(room).emit("message", msg);
  });

  socket.on("media", (data) => {
    socket.to(room).emit("media", data);
  });

  // WebRTC signaling
  socket.on("offer", (data) => socket.to(room).emit("offer", data));
  socket.on("answer", (data) => socket.to(room).emit("answer", data));
  socket.on("ice-candidate", (data) =>
    socket.to(room).emit("ice-candidate", data)
  );

  socket.on("disconnect", () => {
    if (room) socket.to(room).emit("user-offline");
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () =>
  console.log("Server running on http://localhost:" + PORT)
);
