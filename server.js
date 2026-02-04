const express = require('express');
const http = require('http');
const { Server } = require('socket.io');


const app = express();
const server = http.createServer(app);
const io = new Server(server);


app.use(express.static('public'));


const users = {};


io.on('connection', (socket) => {
socket.on('join-room', (room) => {
socket.join(room);
users[socket.id] = room;
socket.to(room).emit('user-online', socket.id);
});


socket.on('message', (data) => {
socket.to(data.room).emit('message', data);
});


socket.on('typing', (room) => {
socket.to(room).emit('typing');
});


socket.on('stop-typing', (room) => {
socket.to(room).emit('stop-typing');
});


socket.on('seen', (room) => {
socket.to(room).emit('seen');
});


socket.on('signal', (data) => {
socket.to(data.room).emit('signal', data);
});


socket.on('disconnect', () => {
const room = users[socket.id];
socket.to(room).emit('user-offline');
delete users[socket.id];
});
});


server.listen(10000, () => {
console.log('Server running on port 10000');
});