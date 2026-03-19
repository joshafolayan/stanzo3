const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || '-_B[cDnxZ%GH1wj;RPc1q#S]*b4}GEnz*PO--bZ:QHa';

const protect = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
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

module.exports = { protect, admin, SECRET_KEY };
