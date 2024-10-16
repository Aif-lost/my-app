const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let endTime;

// Timer duration (30 minutes in milliseconds)
const TIMER_DURATION = 1800 * 1000;

// Function to start/reset the timer
function startTimer() {
    endTime = Date.now() + TIMER_DURATION;
}

// Start the timer when the server starts
startTimer();

// Serve static files from the public directory
app.use(express.static('public'));

// Handle socket connections
io.on('connection', (socket) => {
    console.log('A user connected');

    // Send the remaining time to the connected client
    socket.emit('timer', { endTime });

    // Listen for chat messages and broadcast them
    socket.on('message', (msg) => {
        io.emit('message', msg);
    });

    // Listen for the timer reset request and notify all clients
    socket.on('resetTimer', () => {
        startTimer();
        io.emit('timer', { endTime });
    });

    // Handle joining rooms for voice chat
    socket.on('join', (room) => {
        socket.join(room);
        console.log(`User joined room: ${room}`);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
