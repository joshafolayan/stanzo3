require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User'); // Adjust path if needed

// Edit your admin's username and the desired email here
const ADMIN_USERNAME = 'admin';
const ADMIN_EMAIL = 'jafolayan03@gmail.com';

async function updateAdminEmail() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ username: ADMIN_USERNAME });
        if (!user) {
            console.log(`User ${ADMIN_USERNAME} not found.`);
            process.exit(1);
        }

        user.email = ADMIN_EMAIL;
        await user.save();

        console.log(`Successfully updated email for ${ADMIN_USERNAME} to ${ADMIN_EMAIL}`);
        process.exit(0);
    } catch (error) {
        console.error('Error updating email:', error);
        process.exit(1);
    }
}

updateAdminEmail();
