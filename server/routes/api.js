const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { protect, SECRET_KEY } = require('../middleware/auth');
const User = require('../models/User');
const { sendOrderConfirmationEmail, sendNewOrderAdminEmail } = require('../utils/email');
const { reserveStock, releaseStock } = require('../utils/stock');

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

            const quantity = Number(item.quantity || 1);
            if (!Number.isInteger(quantity) || quantity < 1) {
                return res.status(400).json({ success: false, message: `Invalid quantity for ${dbProduct.name}` });
            }

            // Apply the product's discount (must match the price shown in the cart - see CartContext)
            const discount = dbProduct.discountPercentage || 0;
            const unitPrice = Math.round(dbProduct.price * (1 - discount / 100) * 100) / 100;

            const itemTotal = unitPrice * quantity;
            calculatedTotal += itemTotal;

            processedItems.push({
                product: dbProduct._id,
                name: dbProduct.name,
                price: unitPrice,
                originalPrice: dbProduct.price,
                quantity,
                selectedColor: item.selectedColor,
                selectedSize: item.selectedSize
            });
        }

        // Take the items out of stock (fails if anything sold out meanwhile)
        try {
            await reserveStock(processedItems);
        } catch (err) {
            if (err.isStockError) {
                return res.status(400).json({ success: false, message: err.message });
            }
            throw err;
        }

        // Auto-Register Guest
        if (!userId && customerInfo && customerInfo.password && customerInfo.email && customerInfo.name) {
            try {
                const escapedUsername = customerInfo.name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const existingUser = await User.findOne({
                    $or: [
                        { username: { $regex: new RegExp(`^${escapedUsername}$`, 'i') } },
                        { email: customerInfo.email.trim().toLowerCase() }
                    ]
                });

                if (existingUser) {
                    await releaseStock(processedItems);
                    return res.status(400).json({ success: false, message: 'Account with this email or username already exists. Please log in.' });
                }

                const hashedPassword = await bcrypt.hash(customerInfo.password, 10);
                const newUser = new User({
                    username: customerInfo.name.trim(),
                    email: customerInfo.email.trim().toLowerCase(),
                    password: hashedPassword,
                    phone: customerInfo.phone ? customerInfo.phone.trim() : undefined,
                    role: 'user'
                });

                const savedUser = await newUser.save();
                userId = savedUser._id;
            } catch (err) {
                console.error('Auto-registration error:', err);
                await releaseStock(processedItems);
                return res.status(500).json({ success: false, message: 'Server error during account creation.' });
            }
        }

        const newOrder = new Order({
            user: userId,
            items: processedItems,
            totalAmount: calculatedTotal,
            customerInfo: customerInfo || {},
            deliveryMethod: deliveryMethod || 'delivery',
            status: 'pending'
        });

        let savedOrder;
        try {
            savedOrder = await newOrder.save();
        } catch (err) {
            await releaseStock(processedItems);
            throw err;
        }

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
