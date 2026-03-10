const express = require('express');
const router = express.Router();
const { createRoom, joinRoom, getRoomMembers, getUserRooms, deleteRoom } = require('../controllers/roomController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/create-room', protect, createRoom);
router.post('/join-room', protect, joinRoom);
router.get('/room-members/:roomId', protect, getRoomMembers);
router.get('/my-rooms', protect, getUserRooms);
router.delete('/delete-room/:roomId', protect, deleteRoom);

module.exports = router;
