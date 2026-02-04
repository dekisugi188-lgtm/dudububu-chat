const socket = io();
let room;
let pc;


function joinChat() {
room = document.getElementById('roomInput').value;
socket.emit('join-room', room);
document.getElementById('login').hidden = true;
document.getElementById('chat').hidden = false;
}


function sendMessage() {
const msg = document.getElementById('msg').value;
socket.emit('message', { room, msg });
addMessage('You: ' + msg);
document.getElementById('msg').value = '';
}


socket.on('message', (data) => {
addMessage('GF: ' + data.msg);
socket.emit('seen', room);
});


function addMessage(text) {
const div = document.createElement('div');
div.innerText = text;
div.onclick = () => div.remove(); // delete my side
document.getElementById('messages').appendChild(div);
}


socket.on('typing', () => {
document.getElementById('typing').innerText = 'Typing...';
});


socket.on('stop-typing', () => {
document.getElementById('typing').innerText = '';
});


socket.on('user-online', () => {
document.getElementById('status').innerText = 'Online 🟢';
});


socket.on('user-offline', () => {
document.getElementById('status').innerText = 'Offline 🔴';
});


async function startCall() {
pc = new RTCPeerConnection();
const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
document.getElementById('myVideo').srcObject = stream;
stream.getTracks().forEach(track => pc.addTrack(track, stream));


pc.ontrack = e => document.getElementById('peerVideo').srcObject = e.streams[0];


pc.onicecandidate = e => e.candidate && socket.emit('signal', { room, candidate: e.candidate });


const offer = await pc.createOffer();
await pc.setLocalDescription(offer);
socket.emit('signal', { room, offer });
}


socket.on('signal', async data => {
if (!pc) pc = new RTCPeerConnection();


if (data.offer) {
await pc.setRemoteDescription(data.offer);
const answer = await pc.createAnswer();
await pc.setLocalDescription(answer);
socket.emit('signal', { room, answer });
}
if (data.answer) await pc.setRemoteDescription(data.answer);
if (data.candidate) await pc.addIceCandidate(data.candidate);
});