const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { SECRET_KEY, protect } = require('../middleware/auth');
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
        const { username, email, password, phone } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const normalizedEmail = email && email.trim() ? email.trim().toLowerCase() : undefined;

        const escapedUsername = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const orConditions = [{ username: { $regex: new RegExp(`^${escapedUsername}$`, 'i') } }];
        if (normalizedEmail) {
            orConditions.push({ email: normalizedEmail });
        }
        const existingUser = await User.findOne({ $or: orConditions });

        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            email: normalizedEmail,
            password: hashedPassword,
            phone: phone ? phone.trim() : undefined,
            role: 'user' // Explicitly set role to user
        });

        const savedUser = await newUser.save();

        const token = jwt.sign(
            { id: savedUser._id, username: savedUser.username, role: savedUser.role },
            SECRET_KEY,
            { expiresIn: '1h' }
        );

        res.status(201).json({
            token,
            user: { username: savedUser.username, email: savedUser.email, phone: savedUser.phone || '', role: savedUser.role }
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

        // Escape regex special characters to prevent ReDoS
        const escapedIdentifier = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const user = await User.findOne({
            $or: [
                { username: { $regex: new RegExp(`^${escapedIdentifier}$`, 'i') } },
                { email: username.toLowerCase().trim() }
            ]
        });

        if (user && (await bcrypt.compare(password, user.password))) {
            const token = jwt.sign(
                { id: user._id, username: user.username, role: user.role },
                SECRET_KEY,
                { expiresIn: '1h' }
            );
            res.json({
                token,
                user: { username: user.username, email: user.email || '', phone: user.phone || '', role: user.role }
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
    try {
        const { email } = req.body;
        const normalizedEmail = email && email.trim() ? email.trim().toLowerCase() : undefined;

        if (!normalizedEmail) {
            return res.status(400).json({ message: 'A valid email address is required' });
        }

        const existingUser = await User.findOne({ email: normalizedEmail, _id: { $ne: req.user.id } });
        if (existingUser) {
            return res.status(400).json({ message: 'That email address is already in use' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.email = normalizedEmail;
        await user.save();

        res.json({
            user: { username: user.username, email: user.email || '', phone: user.phone || '', role: user.role }
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Server error updating profile' });
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
        const emailSent = await sendResetEmail(user.email, resetToken, user.role);

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
