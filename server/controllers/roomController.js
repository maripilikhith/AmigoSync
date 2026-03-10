const Room = require('../models/Room');
const crypto = require('crypto');

const createRoom = async (req, res) => {
    const { roomName } = req.body;
    try {
        // Generate an easy-to-share 6 character code
        const roomCode = crypto.randomBytes(3).toString('hex').toUpperCase();

        const room = await Room.create({
            roomName,
            roomCode,
            createdBy: req.user._id,
            members: [req.user._id],
        });

        res.status(201).json(room);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const joinRoom = async (req, res) => {
    const { roomCode } = req.body;
    try {
        const room = await Room.findOne({ roomCode });

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Properly check if stringified ObjectId exists to avoid Mongoose type inequality false negatives
        const isMember = room.members.some(memberId => memberId.toString() === req.user._id.toString());

        if (isMember) {
            // Already a member, just return the room data to let them enter
            return res.status(200).json(room);
        }

        room.members.push(req.user._id);
        await room.save();

        res.status(200).json(room);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getRoomMembers = async (req, res) => {
    const { roomId } = req.params;
    try {
        const room = await Room.findById(roomId).populate('members', 'name email avatar phone');

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        res.status(200).json(room.members);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getUserRooms = async (req, res) => {
    try {
        // Query using $in to explicitly query the array
        const rooms = await Room.find({ members: { $in: [req.user._id] } }).sort({ createdAt: -1 });
        res.status(200).json(rooms);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteRoom = async (req, res) => {
    const { roomId } = req.params;
    try {
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Check if the user trying to delete is the room creator
        if (room.createdBy && room.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the creator of this trip can delete it.' });
        }

        // Delete the room
        await Room.findByIdAndDelete(roomId);

        // Clean up everything associated with the room
        const Group = require('../models/Group');
        const Message = require('../models/Message');

        await Group.deleteMany({ roomId });
        await Message.deleteMany({ roomId });

        res.status(200).json({ message: 'Trip deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { createRoom, joinRoom, getRoomMembers, getUserRooms, deleteRoom };
