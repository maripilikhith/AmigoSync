const socketIo = require('socket.io');

const configureSocket = (server) => {
    const io = socketIo(server, {
        cors: {
            origin: process.env.CLIENT_URL || "*",
            methods: ["GET", "POST"],
            credentials: true,
        }
    });

    const userLocations = {}; // ephemeral memory: { roomId: { userId: { lat, lng } } }

    io.on('connection', (socket) => {
        console.log(`New client connected: ${socket.id}`);

        // Join Room
        socket.on('join_room', ({ roomId, userId }) => {
            socket.join(roomId);
            console.log(`User ${userId} joined room ${roomId}`);
        });

        // Send Message
        socket.on('send_message', async (data) => {
            // data: { roomId, groupId, message, sender, senderName }
            try {
                const Message = require('../models/Message');
                const newMessage = await Message.create({
                    roomId: data.roomId,
                    groupId: data.groupId,
                    message: data.message,
                    sender: data.sender
                });

                // Fetch the populated message to get sender details and proper createdAt
                const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'name avatar');

                io.to(data.roomId).emit('receive_message', populatedMessage);
            } catch (err) {
                console.error('Error saving message:', err);
            }
        });

        // Location Sharing (map only, no proximity alerts)
        socket.on('location_update', (data) => {
            const { roomId, userId, userName, latitude, longitude } = data;

            // Update local tracking
            if (!userLocations[roomId]) userLocations[roomId] = {};
            userLocations[roomId][userId] = { latitude, longitude, userName, socketId: socket.id };

            // Broadcast location to others in room
            socket.to(roomId).emit('share_location', data);
        });

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

module.exports = configureSocket;
