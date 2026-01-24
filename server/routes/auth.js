const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../utils/db');
const { SECRET_KEY } = require('../middleware/auth');

const { v4: uuidv4 } = require('uuid');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const users = await db.read('users');

    const user = users.find(u => u.username === username);

    if (user && (await bcrypt.compare(password, user.password))) {
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            SECRET_KEY,
            { expiresIn: '24h' }
        );
        res.json({ token, user: { username: user.username, role: user.role } });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    const { username } = req.body;
    const users = await db.read('users');
    const user = users.find(u => u.username === username);

    if (!user) {
        // Return success even if user not found to prevent enumeration
        return res.json({ message: 'If a user with that username exists, a reset link has been sent.' });
    }

    const resetToken = uuidv4();
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour

    // Save updated user with token
    await db.write('users', users);

    // Simulate sending email
    console.log(`[EMAIL SIMULATION] Password reset link for user ${username}: http://localhost:5173/admin/reset-password?token=${resetToken}`);

    res.json({ message: 'If a user with that username exists, a reset link has been sent.' });
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    const users = await db.read('users');

    const userIndex = users.findIndex(u => u.resetToken === token && u.resetTokenExpiry > Date.now());

    if (userIndex === -1) {
        return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    users[userIndex].password = hashedPassword;
    delete users[userIndex].resetToken;
    delete users[userIndex].resetTokenExpiry;

    await db.write('users', users);

    res.json({ message: 'Password has been reset successfully' });
});

module.exports = router;
