const User = require('../models/User');

const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            // Create object with new fields
            const updates = {
                name: req.body.name || user.name,
                email: req.body.email || user.email,
                phone: req.body.phone || user.phone,
                avatar: req.body.avatar || user.avatar,
            };

            // Only add password if it was actually provided
            if (req.body.password) {
                if (!req.body.currentPassword) {
                    return res.status(400).json({ message: 'Current password is required to change your password' });
                }
                const isMatch = await user.matchPassword(req.body.currentPassword);
                if (!isMatch) {
                    return res.status(401).json({ message: 'Incorrect current password' });
                }
                const salt = await require('bcryptjs').genSalt(10);
                updates.password = await require('bcryptjs').hash(req.body.password, salt);
            }

            const updatedUser = await User.findByIdAndUpdate(
                req.user._id,
                { $set: updates },
                { new: true } // Return the updated document
            );

            res.status(200).json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                avatar: updatedUser.avatar,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { updateUserProfile };
