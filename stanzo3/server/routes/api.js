const express = require('express');
const router = express.Router();
const db = require('../utils/db');

// GET /api/products - Public
router.get('/products', async (req, res) => {
    const products = await db.read('products');
    res.json(products);
});

// POST /api/checkout
router.post('/checkout', (req, res) => {
    const orderData = req.body;
    console.log('Received Order:', orderData);

    // In a real app, save to DB here. For now, we'll assume logging is enough.
    // Or we could write to orders.json if we wanted.

    res.json({
        success: true,
        message: 'Order received successfully',
        orderId: 'ORD-' + Date.now()
    });
});

module.exports = router;
