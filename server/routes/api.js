const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');

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
router.post('/checkout', async (req, res) => {
    try {
        const { cart, customerInfo } = req.body;

        if (!cart || cart.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        // Verify prices and calculate total securely
        let calculatedTotal = 0;
        const processedItems = [];

        for (const item of cart) {
            // Find the actual product in DB by ID
            // Handle both legacy numeric id or new _id (frontend passes _id often as id)
            // Looking at the frontend cart, it uses item.id or item._id.
            const query = item._id ? { _id: item._id } : { id: item.id };
            const dbProduct = await Product.findOne(query);

            if (!dbProduct) {
                return res.status(404).json({ success: false, message: `Product ${item.name} not found` });
            }

            const itemTotal = dbProduct.price * (item.quantity || 1);
            calculatedTotal += itemTotal;

            processedItems.push({
                product: dbProduct._id,
                name: dbProduct.name,
                price: dbProduct.price,
                quantity: item.quantity || 1,
                selectedColor: item.selectedColor,
                selectedSize: item.selectedSize
            });
        }

        const newOrder = new Order({
            items: processedItems,
            totalAmount: calculatedTotal,
            customerInfo: customerInfo || {},
            status: 'pending' // Awaiting bank transfer confirmation
        });

        const savedOrder = await newOrder.save();

        res.json({
            success: true,
            message: 'Order recorded successfully',
            orderId: savedOrder._id,
            totalAmount: calculatedTotal
        });

    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({ success: false, message: 'Server error processing checkout' });
    }
});

module.exports = router;
