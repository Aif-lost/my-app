// Import required modules
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

// Create an Express application
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the index.html file on the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Set up Socket.io connection
io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle messages from clients
  socket.on('message', (msg) => {
    console.log('Message received: ' + msg);
    // Broadcast the message to all clients
    io.emit('message', msg);
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
