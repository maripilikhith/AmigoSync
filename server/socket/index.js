const socketIo = require('socket.io');

// Haversine formula to calculate distance between two points in meters
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const toRadians = angle => angle * (Math.PI / 180);

    const phi1 = toRadians(lat1);
    const phi2 = toRadians(lat2);
    const deltaPhi = toRadians(lat2 - lat1);
    const deltaLambda = toRadians(lon2 - lon1);

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) *
        Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
};

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

        // Location Sharing & Proximity Alerts (200 meters)
        socket.on('location_update', (data) => {
            const { roomId, userId, userName, latitude, longitude } = data;

            // Update local tracking
            if (!userLocations[roomId]) userLocations[roomId] = {};
            userLocations[roomId][userId] = { latitude, longitude, userName, socketId: socket.id };

            // Broadcast location to others in room
            socket.to(roomId).emit('share_location', data);

            // Check proximity
            const currentRoomUsers = userLocations[roomId];
            for (const otherUserId in currentRoomUsers) {
                if (otherUserId !== userId) {
                    const distance = calculateDistance(
                        latitude, longitude,
                        currentRoomUsers[otherUserId].latitude, currentRoomUsers[otherUserId].longitude
                    );

                    if (distance < 200) { // If less than 200 meters, alert both
                        // Alert current user
                        io.to(socket.id).emit('proximity_alert', {
                            message: `Your friend ${currentRoomUsers[otherUserId].userName} is nearby (${Math.round(distance)} meters away).`
                        });
                        // Alert other user
                        io.to(currentRoomUsers[otherUserId].socketId).emit('proximity_alert', {
                            message: `Your friend ${userName} is nearby (${Math.round(distance)} meters away).`
                        });
                    }
                }
            }
        });

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
            // Consider clearing tracked user location logic if necessary
        });
    });

    return io;
};

module.exports = configureSocket;
