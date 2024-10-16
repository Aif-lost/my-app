const socket = io();
let localStream;
let peerConnection;
let currentRoom = '';
let userId;

// Generate and save a user ID
function getUserId() {
    if (!localStorage.getItem('userId')) {
        const id = `User ${Math.floor(Math.random() * 1000)}`;
        localStorage.setItem('userId', id);
    }
    return localStorage.getItem('userId');
}

// Load stored messages on page load
function loadMessages() {
    const savedMessages = JSON.parse(localStorage.getItem('messages')) || [];
    savedMessages.forEach((msg) => {
        appendMessage(msg.user, msg.text);
    });
}

// Save messages to local storage
function saveMessage(user, text) {
    const savedMessages = JSON.parse(localStorage.getItem('messages')) || [];
    savedMessages.push({ user, text });
    localStorage.setItem('messages', JSON.stringify(savedMessages));
}

// Add message to the chat UI
function appendMessage(user, message) {
    const messagesList = document.getElementById('messages');
    const listItem = document.createElement('li');
    listItem.textContent = `${user}: ${message}`;
    messagesList.appendChild(listItem);
}

// Initialize user ID
userId = getUserId();
loadMessages();

// Send message
document.getElementById('sendButton').addEventListener('click', () => {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value;
    if (message) {
        socket.emit('message', { user: userId, text: message });
        messageInput.value = '';
    }
});

// Receive message
socket.on('message', (msg) => {
    appendMessage(msg.user, msg.text);
    saveMessage(msg.user, msg.text);
});

// Join room for voice chat
document.getElementById('joinRoomButton').onclick = () => {
    const room = document.getElementById('roomInput').value;
    if (room) {
        currentRoom = room;
        socket.emit('join', room);
        document.getElementById('startCallButton').disabled = false;
    } else {
        alert('Please enter a room name!');
    }
};

// Voice chat signaling code remains unchanged
