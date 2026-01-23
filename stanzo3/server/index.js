const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/', (req, res) => {
    res.send('Stanzo3 API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
