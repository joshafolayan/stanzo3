const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET /api/products - Get all products
router.get('/products', async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching products' });
    }
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
