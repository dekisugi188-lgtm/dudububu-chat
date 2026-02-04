const socket = io();

let username = null;
let tempPassword = null;

// Elements
const loginScreen = document.getElementById("login-screen");
const passwordInput = document.getElementById("password-input");
const loginBtn = document.getElementById("login-btn");

const chatContainer = document.getElementById("chat-container");
const chatBox = document.getElementById("chat-box");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const emojiBtn = document.getElementById("emoji-btn");
const mediaInput = document.getElementById("media-input");
const onlineUsersDiv = document.getElementById("online-users");
const typingIndicator = document.getElementById("typing-indicator");
const callBtn = document.getElementById("call-btn");
const localVideo = document.getElementById("local-video");
const remoteVideo = document.getElementById("remote-video");

// Login
loginBtn.onclick = () => {
  tempPassword = passwordInput.value.trim();
  if(!tempPassword) return alert("Enter password");
  username = "User"; // temporary username
  loginScreen.classList.add("hidden");
  chatContainer.classList.remove("hidden");
  socket.emit("join", username);
};

// Send chat
sendBtn.onclick = () => {
  const msg = chatInput.value.trim();
  if(!msg) return;
  addMessage(msg, true);
  socket.emit("chat-message", msg);
  chatInput.value = "";
};

// Typing indicator
chatInput.oninput = () => {
  socket.emit("typing", chatInput.value.length > 0);
};

// Receive messages
socket.on("chat-message", data => addMessage(data.msg, false, data.user));

// Typing
socket.on("typing", data => {
  typingIndicator.innerText = data.isTyping ? `${data.user} is typing...` : "";
});

// Online users
socket.on("online-users", users => {
  onlineUsersDiv.innerText = "Online: " + Object.values(users).join(", ");
});

// Add message
function addMessage(msg, self, user="You") {
  const div = document.createElement("div");
  div.classList.add("message");
  div.classList.add(self ? "self" : "other");
  div.innerText = `${user}: ${msg}`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Media send
mediaInput.onchange = () => {
  const file = mediaInput.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    addMessage("[Media sent]", true);
    socket.emit("media-message", { type: file.type, data: reader.result });
  };
  reader.readAsDataURL(file);
};

// Receive media
socket.on("media-message", data => {
  addMessage(`[${data.type.split("/")[0]} from ${data.user}]`, false);
});

// Video call
let localStream;
let peerConnection;
const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

callBtn.onclick = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({ video:true, audio:true });
  localVideo.srcObject = localStream;
  peerConnection = new RTCPeerConnection(config);
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.ontrack = e => remoteVideo.srcObject = e.streams[0];
  peerConnection.onicecandidate = e => {
    if(e.candidate) socket.emit("webrtc-ice-candidate", { to: Object.keys(socket.connected)[0], candidate: e.candidate });
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("webrtc-offer", { to: Object.keys(socket.connected)[0], offer });
};

socket.on("webrtc-offer", async data => {
  localStream = await navigator.mediaDevices.getUserMedia({ video:true, audio:true });
  localVideo.srcObject = localStream;
  peerConnection = new RTCPeerConnection(config);
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.ontrack = e => remoteVideo.srcObject = e.streams[0];
  peerConnection.onicecandidate = e => {
    if(e.candidate) socket.emit("webrtc-ice-candidate", { to: data.from, candidate: e.candidate });
  };

  await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit("webrtc-answer", { to: data.from, answer });
});

socket.on("webrtc-answer", async data => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
});

socket.on("webrtc-ice-candidate", async data => {
  if(peerConnection) await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
});
