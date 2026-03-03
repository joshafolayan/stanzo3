const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { SECRET_KEY } = require('../middleware/auth');

const { v4: uuidv4 } = require('uuid');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });

        if (user && (await bcrypt.compare(password, user.password))) {
            const token = jwt.sign(
                { id: user._id, username: user.username, role: user.role },
                SECRET_KEY,
                { expiresIn: '24h' }
            );
            res.json({ token, user: { username: user.username, role: user.role } });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    try {
        const { username } = req.body;

        const user = await User.findOne({ username });

        if (!user) {
            // Return success even if user not found to prevent enumeration
            return res.json({ message: 'If a user with that username exists, a reset link has been sent.' });
        }

        const resetToken = uuidv4();
        user.resetToken = resetToken;
        user.resetTokenExpiry = Date.now() + 3600000; // 1 hour

        await user.save();

        // Simulate sending email
        console.log(`[EMAIL SIMULATION] Password reset link for user ${username}: http://localhost:5174/admin/reset-password?token=${resetToken}`);

        res.json({ message: 'If a user with that username exists, a reset link has been sent.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error generating reset link' });
    }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;

        await user.save();

        res.json({ message: 'Password has been reset successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error resetting password' });
    }
});

module.exports = router;
