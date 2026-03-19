const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');
const { protect, SECRET_KEY } = require('../middleware/auth');
const User = require('../models/User');
const { sendOrderConfirmationEmail, sendNewOrderAdminEmail } = require('../utils/email');

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
        const { cart, customerInfo, deliveryMethod } = req.body;

        if (!cart || cart.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        let userId = null;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, SECRET_KEY);
                userId = decoded.id;
            } catch (err) {
                // Token invalid or expired, continue as guest
            }
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
            user: userId,
            items: processedItems,
            totalAmount: calculatedTotal,
            customerInfo: customerInfo || {},
            deliveryMethod: deliveryMethod || 'delivery',
            status: 'pending'
        });

        const savedOrder = await newOrder.save();

        // Send Email Notifications
        try {
            // Find admins to notify
            const admins = await User.find({ role: 'admin' });
            const adminEmails = admins.filter(a => a.email).map(a => a.email).join(', ');
            
            // Send customer confirmation if email exists
            if (customerInfo && customerInfo.email) {
                sendOrderConfirmationEmail(customerInfo.email, savedOrder).catch(err => console.error('Error sending customer email', err));
            }
            
            // Send admin notification
            if (adminEmails) {
                sendNewOrderAdminEmail(adminEmails, savedOrder).catch(err => console.error('Error sending admin email', err));
            }
        } catch (emailErr) {
            console.error('Non-blocking error during email sending:', emailErr);
        }

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

// GET /api/orders/myorders
router.get('/orders/myorders', protect, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ message: 'Server error fetching orders' });
    }
});

module.exports = router;
