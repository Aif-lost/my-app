const socket = io();
const joinRoomButton = document.getElementById('join-room');
const roomIdInput = document.getElementById('room-id');
const remoteAudio = document.getElementById('remote-audio');

let peerConnections = {}; // Store connections by user ID

// Join a room when the button is clicked
joinRoomButton.onclick = () => {
    const roomId = roomIdInput.value;
    if (roomId) {
        socket.emit('join-room', roomId);
    }
};

// Handle user joining the room
socket.on('user-joined', async (userId) => {
    console.log(`User ${userId} joined the room`);

    // Create a new peer connection for each new user
    const peerConnection = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
        ],
    });

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', {
                roomId: roomIdInput.value,
                candidate: event.candidate,
                to: userId,
            });
        }
    };

    // Handle remote audio stream
    peerConnection.ontrack = (event) => {
        remoteAudio.srcObject = event.streams[0];
    };

    // Add local audio stream
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

    // Create and send an offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', {
        roomId: roomIdInput.value,
        offer: offer,
        to: userId,
    });

    peerConnections[userId] = peerConnection;
});

// Handle receiving an offer
socket.on('offer', async (data) => {
    const { offer, sender } = data;

    const peerConnection = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
        ],
    });

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', {
                roomId: roomIdInput.value,
                candidate: event.candidate,
                to: sender,
            });
        }
    };

    // Handle remote audio stream
    peerConnection.ontrack = (event) => {
        remoteAudio.srcObject = event.streams[0];
    };

    // Add local audio stream
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('answer', {
        roomId: roomIdInput.value,
        answer: answer,
        to: sender,
    });

    peerConnections[sender] = peerConnection;
});

// Handle receiving an answer
socket.on('answer', async (data) => {
    const { answer, sender } = data;
    const peerConnection = peerConnections[sender];
    if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
});

// Handle ICE candidates
socket.on('ice-candidate', async (data) => {
    const { candidate, sender } = data;
    const peerConnection = peerConnections[sender];
    if (peerConnection) {
        try {
            await peerConnection.addIceCandidate(candidate);
        } catch (e) {
            console.error('Error adding received ICE candidate', e);
        }
    }
});
