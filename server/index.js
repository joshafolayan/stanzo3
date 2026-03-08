const express = require('express');
require('dotenv').config();
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to Database
connectDB();

// Middleware
app.set("trust proxy", 1); // Trust first proxy for express-rate-limit behind Render/Vercel
app.use(cors());
app.use(express.json()); // NOTE: express.json() MUST come BEFORE mongoSanitize()

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Routes
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api', (req, res) => {
    res.send('Stanzo3 API is running');
});

// Serve static files from client public folder (for uploaded images)
app.use('/products', express.static(path.join(__dirname, '../client/public/products')));

// Serve React App under standard static middleware
app.use(express.static(path.join(__dirname, '../client/dist')));

// Catch-all handler for any request that doesn't match above routes
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
