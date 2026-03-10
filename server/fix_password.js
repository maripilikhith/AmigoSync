const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const resetPasswords = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);
        await User.updateMany({}, { password: hashedPassword });
        console.log('All user passwords reset to password123');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

resetPasswords();
