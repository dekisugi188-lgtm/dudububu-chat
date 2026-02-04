const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// serve frontend
app.use(express.static(path.join(__dirname, "public")));

// root route fix (IMPORTANT)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// socket logic
io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("encrypted-message", (data) => {
    socket.broadcast.emit("encrypted-message", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Render port
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
