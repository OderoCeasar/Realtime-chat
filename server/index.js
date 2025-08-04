const express = require('express');
const connectDB = require('./mongoDB/db');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const {Server} = require('socket.io');
const dotenv = require('dotenv');
const http = require('http');

const userRoutes = require('./routes/user');
const chatRoutes = require('./routes/chat');
const messageRoutes = require('./routes/message');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000

const corsConfig = {
    origin: process.env.BASE_URL || 'http://localhost:3000',
    credentials: true,
}

app.use(cors(corsConfig));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// API routes
app.use('/', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);


// mongodb connection
mongoose.set('strictQuery', false);
connectDB();

const server = http.createServer(app);

// socket.io
const io = new Server(server, {
    pingTimeout: 60000,
    cors: {
        origin: process.env.BASE_URL || 'http://localhost:3000',
        credentials: true,
    },
});

io.on('connection', (socket) => {
    console.log('New socket connection:', socket.id)

    socket.on('setup', (userData) => {
        socket.join(userData.id);
        socket.emit('connected');
    });

    socket.on('join room', (room) => {
        socket.join(room);
        console.log(`User joined room: ${room}`);
    });
    socket.on('typing', (room) => socket.in(room).emit('typing'));
    socket.on('stop typing', (room) => socket.io(room).emit('stop typing'));

    socket.on('new message', (newMessageReceive) => {
        var chat = newMessageReceive.chatId;
        if (!chat.users) console.log('chats.users is not defined');
        chat.users.forEach((user) => {
            if (user._id == newMessageReceive.sender._id) return;
            socket.in(user._id).emit('message received', newMessageReceive);
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});


server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})