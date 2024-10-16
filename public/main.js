const socket = io();
let localStream;
let peerConnection;
let currentRoom = '';
let userId;
const peers = {};

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

// Initialize user ID
userId = getUserId();

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

// Timer logic
function startTimer(endTime) {
    const timerDisplay = document.getElementById('timer');
    const timerInterval = setInterval(() => {
        const remainingTime = endTime - Date.now();
        if (remainingTime > 0) {
            const minutes = Math.floor(remainingTime / 60000);
            const seconds = Math.floor((remainingTime % 60000) / 1000);
            timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        } else {
            clearInterval(timerInterval);
            resetChat();
        }
    }, 1000);
}

// Reset chat function
function resetChat() {
    localStorage.removeItem('messages');
    document.getElementById('messages').innerHTML = '';
    socket.emit('resetTimer');
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

// Event listeners for the buttons
document.getElementById('sendButton').addEventListener('click', () => {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value;
    if (message) {
        socket.emit('message', { user: userId, text: message });
        messageInput.value = '';
    }
});

document.getElementById('joinChannelButton').onclick = () => {
    currentRoom = 'channel1';
    socket.emit('join', currentRoom);
    document.getElementById('startCallButton').disabled = false;
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

// Start the timer based on the server's end time
socket.on('timer', (data) => {
    startTimer(data.endTime);
});

// Receive message
socket.on('message', (msg) => {
    appendMessage(msg.user, msg.text);
    saveMessage(msg.user, msg.text);
});

// Voice call handling (simplified setup)
document.getElementById('startCallButton').onclick = async () => {
    if (!localStream) {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            socket.emit('ready', currentRoom);

            // Set up peer connections for each user
            socket.on('offer', async (id, description) => {
                peerConnection = new RTCPeerConnection();
                peers[id] = peerConnection;
                await peerConnection.setRemoteDescription(description);
                localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                socket.emit('answer', id, peerConnection.localDescription);

                peerConnection.ontrack = event => {
                    const remoteAudio = document.getElementById('remoteAudio');
                    remoteAudio.srcObject = event.streams[0];
                };
            });

            socket.on('answer', (id, description) => {
                peers[id].setRemoteDescription(description);
            });

            socket.on('ready', id => {
                peerConnection = new RTCPeerConnection();
                peers[id] = peerConnection;
                localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

                peerConnection.onicecandidate = event => {
                    if (event.candidate) {
                        socket.emit('candidate', id, event.candidate);
                    }
                };

                peerConnection.ontrack = event => {
                    const remoteAudio = document.getElementById('remoteAudio');
                    remoteAudio.srcObject = event.streams[0];
                };

                peerConnection.createOffer().then(offer => {
                    peerConnection.setLocalDescription(offer);
                    socket.emit('offer', id, offer);
                });
            });

            socket.on('candidate', (id, candidate) => {
                peers[id].addIceCandidate(new RTCIceCandidate(candidate));
            });

            document.getElementById('startCallButton').disabled = true;
            document.getElementById('endCallButton').disabled = false;
            updateCallStatus(true);
        } catch (error) {
            console.error('Error accessing microphone:', error);
        }
    }
};

document.getElementById('endCallButton').onclick = () => {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
        socket.emit('leave', currentRoom);
        document.getElementById('startCallButton').disabled = false;
        document.getElementById('endCallButton').disabled = true;
        updateCallStatus(false);
    }
};

// Load messages on page load
loadMessages();
