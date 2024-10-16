const socket = io();
let localStream;
let peerConnection;
let currentRoom = '';
let userId;
let timerInterval;

// Load or set username
function getUsername() {
    const savedUsername = localStorage.getItem('username');
    return savedUsername ? savedUsername : 'User';
}

// Save the username when set by the user
function saveUsername(username) {
    localStorage.setItem('username', username);
}

// Generate a user ID if no username is set
function getUserId() {
    return getUsername();
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

// Timer logic
function startTimer(duration) {
    let timer = duration, minutes, seconds;
    const timerDisplay = document.getElementById('timer');

    timerInterval = setInterval(() => {
        minutes = Math.floor(timer / 60);
        seconds = timer % 60;

        timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        if (--timer < 0) {
            resetChat();
            clearInterval(timerInterval);
            startTimer(1800); // Restart timer for another 30 minutes
        }
    }, 1000);
}

// Reset chat function
function resetChat() {
    localStorage.removeItem('messages');
    document.getElementById('messages').innerHTML = '';
}

// Call status indicator
function updateCallStatus(inCall) {
    const callStatus = document.getElementById('callStatus');
    if (inCall) {
        callStatus.textContent = 'In a call';
        callStatus.classList.add('in-call');
        callStatus.classList.remove('not-in-call');
    } else {
        callStatus.textContent = 'Not in a call';
        callStatus.classList.add('not-in-call');
        callStatus.classList.remove('in-call');
    }
}

// Set up the timer for 30 minutes (1800 seconds)
startTimer(1800);

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

// Start call
document.getElementById('startCallButton').onclick = () => {
    // (Setup call logic here)
    updateCallStatus(true);
};

// End call
document.getElementById('endCallButton').onclick = () => {
    // (End call logic here)
    updateCallStatus(false);
};

// Save username
document.getElementById('saveUsernameButton').onclick = () => {
    const usernameInput = document.getElementById('usernameInput').value.trim();
    if (usernameInput) {
        saveUsername(usernameInput);
        userId = getUsername();
        alert(`Username set to ${userId}`);
    } else {
        alert('Please enter a valid username or leave it as default.');
    }
};
