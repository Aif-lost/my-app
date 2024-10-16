const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

// Serve static files (e.g., your frontend HTML, CSS, JS files)
app.use(express.static('public'));

// Basic route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle room joining
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
        
        // Notify other users in the room about the new user
        socket.to(roomId).emit('user-joined', socket.id);
    });

    // Handle offers
    socket.on('offer', (data) => {
        const { roomId, offer } = data;
        socket.to(roomId).emit('offer', { offer, sender: socket.id });
    });

    // Handle answers
    socket.on('answer', (data) => {
        const { roomId, answer, to } = data;
        io.to(to).emit('answer', { answer, sender: socket.id });
    });

    // Handle ICE candidates
    socket.on('ice-candidate', (data) => {
        const { roomId, candidate, to } = data;
        io.to(to).emit('ice-candidate', { candidate, sender: socket.id });
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
