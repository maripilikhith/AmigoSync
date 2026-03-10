const Message = require('../models/Message');

const getMessages = async (req, res) => {
    try {
        const { roomId, groupId, page = 1, limit = 50 } = req.query;

        let query = {};
        if (groupId) {
            query.groupId = groupId;
        } else if (roomId) {
            query.roomId = roomId;
            // Only get room messages, not group messages
            query.groupId = { $exists: false };
        } else {
            return res.status(400).json({ message: 'roomId or groupId is required' });
        }

        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('sender', 'name avatar');

        res.status(200).json(messages.reverse()); // Reverse to chronological order
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { getMessages };
