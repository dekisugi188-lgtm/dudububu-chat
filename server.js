const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

let onlineUsers = {}; // socket.id -> username

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  socket.on("join", (username) => {
    socket.username = username;
    onlineUsers[socket.id] = username;
    io.emit("online-users", onlineUsers);
  });

  socket.on("typing", (isTyping) => {
    socket.broadcast.emit("typing", { user: socket.username, isTyping });
  });

  socket.on("chat-message", (msg) => {
    socket.broadcast.emit("chat-message", {
      user: socket.username,
      msg,
      timestamp: new Date().getTime(),
    });
  });

  socket.on("delete-message", (msgId) => {
    socket.broadcast.emit("delete-message", msgId);
  });

  socket.on("media-message", (data) => {
    socket.broadcast.emit("media-message", { user: socket.username, ...data });
  });

  socket.on("webrtc-offer", (data) => {
    socket.to(data.to).emit("webrtc-offer", { from: socket.id, offer: data.offer });
  });

  socket.on("webrtc-answer", (data) => {
    socket.to(data.to).emit("webrtc-answer", { from: socket.id, answer: data.answer });
  });

  socket.on("webrtc-ice-candidate", (data) => {
    socket.to(data.to).emit("webrtc-ice-candidate", { from: socket.id, candidate: data.candidate });
  });

  socket.on("disconnect", () => {
    delete onlineUsers[socket.id];
    io.emit("online-users", onlineUsers);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running on http://localhost:" + PORT));
