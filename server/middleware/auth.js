const jwt = require('jsonwebtoken');

// No fallback: a missing secret must stop the server, never silently use a known key
const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY || SECRET_KEY.length < 32) {
    throw new Error('JWT_SECRET environment variable must be set to a random string of at least 32 characters');
}

// Only accept the algorithm we sign with
const VERIFY_OPTIONS = { algorithms: ['HS256'] };

const protect = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY, VERIFY_OPTIONS);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

const admin = (req, res, next) => {
    const allowedRoles = ['admin', 'manager', 'salesrep', 'superadmin'];
    if (req.user && allowedRoles.includes(req.user.role)) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin/manager' });
    }
};

module.exports = { protect, admin, SECRET_KEY, VERIFY_OPTIONS };
