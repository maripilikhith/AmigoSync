const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    latitude: {
        type: Number,
        required: true,
    },
    longitude: {
        type: Number,
        required: true,
    },
    sharedWith: {
        roomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Room',
        },
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Group',
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }
    }
}, { timestamps: true });

locationSchema.index({ 'sharedWith.roomId': 1, createdAt: -1 });

const Location = mongoose.model('Location', locationSchema);
module.exports = Location;
