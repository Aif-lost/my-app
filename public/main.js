const socket = io();
let localStream;
let peerConnection;
let currentRoom = '';

// Handle sending messages
const sendButton = document.getElementById('sendButton');
const messageInput = document.getElementById('messageInput');
const messagesList = document.getElementById('messages');

sendButton.addEventListener('click', () => {
    const message = messageInput.value;
    socket.emit('message', message);
    messageInput.value = ''; // Clear the input
});

// Handle receiving messages
socket.on('message', (msg) => {
    const listItem = document.createElement('li');
    listItem.textContent = msg;
    messagesList.appendChild(listItem);
});

// Join room
document.getElementById('joinRoomButton').onclick = () => {
    const room = document.getElementById('roomInput').value;
    if (room) {
        currentRoom = room;
        socket.emit('join', room);
        document.getElementById('startCallButton').disabled = false; // Enable start call button
    } else {
        alert('Please enter a room name!');
    }
};

// Handle signaling for voice chat
socket.on('signal', async (data) => {
    if (!peerConnection) createPeerConnection();

    if (data.signal) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));
    }
});

// Start voice chat
document.getElementById('startCallButton').onclick = async () => {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    createPeerConnection();

    // Add local audio track
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });
};

// End voice chat
document.getElementById('endCallButton').onclick = () => {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
        document.getElementById('remoteAudio').srcObject = null;
        document.getElementById('endCallButton').disabled = true;
    }
};

// Create a new peer connection
function createPeerConnection() {
    const configuration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }, // Google STUN server
        ]
    };
    peerConnection = new RTCPeerConnection(configuration);

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('signal', {
                room: currentRoom,
                signal: {
                    type: 'ice',
                    candidate: event.candidate,
                },
            });
        }
    };

    peerConnection.ontrack = (event) => {
        const remoteAudio = document.getElementById('remoteAudio');
        remoteAudio.srcObject = event.streams[0];
        document.getElementById('endCallButton').disabled = false;
    };

    // Create offer and send to other peers
    peerConnection.createOffer().then((offer) => {
        return peerConnection.setLocalDescription(offer);
    }).then(() => {
        socket.emit('signal', {
            room: currentRoom,
            signal: peerConnection.localDescription,
        });
    });
}
