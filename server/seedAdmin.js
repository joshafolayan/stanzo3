require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const DB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/stanzo3';

mongoose.connect(DB_URI)
    .then(async () => {
        console.log('Connected to DB');
        const existingAdmin = await User.findOne({ username: 'admin' });
        if (existingAdmin) {
            console.log('Admin already exists. Updating password.');
            existingAdmin.password = await bcrypt.hash('admin123', 10);
            await existingAdmin.save();
            console.log('Password updated.');
        } else {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await User.create({
                username: 'admin',
                email: 'admin@example.com',
                password: hashedPassword,
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
