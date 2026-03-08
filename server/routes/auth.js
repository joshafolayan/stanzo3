const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { SECRET_KEY } = require('../middleware/auth');
const { sendResetEmail } = require('../utils/email');

const { v4: uuidv4 } = require('uuid');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: { message: 'Too many attempts from this IP, please try again after 15 minutes' }
});

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !password || !email) {
            return res.status(400).json({ message: 'Username, email, and password are required' });
        }

        const existingUser = await User.findOne({
            $or: [{ username }, { email: email.toLowerCase() }]
        });

        if (existingUser) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: 'user' // Explicitly set role to user
        });

        const savedUser = await newUser.save();

        const token = jwt.sign(
            { id: savedUser._id, username: savedUser.username, role: savedUser.role },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: { username: savedUser.username, email: savedUser.email, role: savedUser.role }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });

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
router.post('/forgot-password', authLimiter, async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email address is required.' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            // Return success even if user not found to prevent enumeration
            return res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
        }

        const resetToken = uuidv4();
        user.resetToken = resetToken;
        user.resetTokenExpiry = Date.now() + 3600000; // 1 hour

        await user.save();

        // Send actual email using nodemailer
        const emailSent = await sendResetEmail(user.email, resetToken);

        if (!emailSent) {
            // Revert token if email failed
            user.resetToken = undefined;
            user.resetTokenExpiry = undefined;
            await user.save();
            return res.status(500).json({ message: 'Failed to send reset email. Please try again later.' });
        }

        res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error generating reset link' });
    }
});

// POST /api/auth/reset-password
router.post('/reset-password', authLimiter, async (req, res) => {
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
