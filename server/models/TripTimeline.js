const mongoose = require('mongoose');

const tripTimelineSchema = new mongoose.Schema({
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true,
    },
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
    eventType: {
        type: String,
        enum: ['left_hostel', 'arrived', 'lunch', 'shopping', 'custom'],
        default: 'custom',
    },
    note: {
        type: String,
    }
}, { timestamps: true });

const TripTimeline = mongoose.model('TripTimeline', tripTimelineSchema);
module.exports = TripTimeline;
