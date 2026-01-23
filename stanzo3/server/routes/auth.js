const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../utils/db');
const { SECRET_KEY } = require('../middleware/auth');

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

module.exports = router;
