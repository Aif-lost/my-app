// Import required modules
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the index.html file on the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle socket connections
io.on('connection', (socket) => {
    console.log('A user connected');

    // Relay messages and signaling for WebRTC
    socket.on('message', (msg) => {
        console.log('Message received: ' + msg);
        io.emit('message', msg); // Broadcast message to all clients
    });

    // Handle signaling data
    socket.on('signal', (data) => {
        socket.to(data.room).emit('signal', {
            sender: socket.id,
            signal: data.signal,
        });
    });

    // Handle joining a room
    socket.on('join', (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room ${room}`);
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Start the server
const PORT = process.env.PORT || 10000; // Use the environment port or fallback to 10000
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
