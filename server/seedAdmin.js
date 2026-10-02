require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Usage:
//   ADMIN_PASSWORD='a-strong-password' node seedAdmin.js           -> creates the "admin" user if it doesn't exist
//   ADMIN_PASSWORD='a-strong-password' node seedAdmin.js --reset   -> also resets the password of an existing "admin"
const password = process.env.ADMIN_PASSWORD;
const shouldReset = process.argv.includes('--reset');

if (!password || password.length < 8) {
    console.error('Set ADMIN_PASSWORD to a password of at least 8 characters, e.g.');
    console.error("  ADMIN_PASSWORD='a-strong-password' node seedAdmin.js");
    process.exit(1);
}

const DB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/stanzo3';

mongoose.connect(DB_URI)
    .then(async () => {
        console.log(`Connected to DB: ${mongoose.connection.host}`);
        const existingAdmin = await User.findOne({ username: 'admin' });
        if (existingAdmin && !shouldReset) {
            console.log('Admin already exists. Nothing changed (use --reset to change its password).');
        } else if (existingAdmin) {
            existingAdmin.password = await bcrypt.hash(password, 10);
            await existingAdmin.save();
            console.log('Admin password reset.');
        } else {
            await User.create({
                username: 'admin',
                password: await bcrypt.hash(password, 10),
                role: 'admin'
            });
            console.log('Admin user created successfully');
        }
        process.exit(0);
    })
    .catch(err => {
        console.error('DB connection error:', err);
        process.exit(1);
    });
