const express = require('express');
const router = express.Router();
const { updateUserProfile } = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

router.put('/profile', protect, updateUserProfile);

module.exports = router;
