const express = require('express');
const router = express.Router();
const { createGroup, joinGroup, leaveGroup, getRoomGroups, deleteGroup, getOrCreateDM } = require('../controllers/groupController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/create-group', protect, createGroup);
router.post('/join-group', protect, joinGroup);
router.post('/leave-group', protect, leaveGroup);
router.get('/room-groups/:roomId', protect, getRoomGroups);
router.delete('/:groupId', protect, deleteGroup);
router.post('/dm', protect, getOrCreateDM);

module.exports = router;
