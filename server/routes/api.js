const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const { protect, SECRET_KEY, VERIFY_OPTIONS } = require('../middleware/auth');
const User = require('../models/User');
const { sendOrderConfirmationEmail, sendNewOrderAdminEmail } = require('../utils/email');
const { checkStock, stockMode } = require('../utils/stock');

// GET /api/products - Get all products
router.get('/products', async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching products' });
    }
});

// Orders in these statuses count as sold (pending and cancelled ones don't)
const SOLD_STATUSES = ['paid', 'processing', 'shipped', 'delivered', 'completed'];

// GET /api/products/top-sellers - Products ranked by units sold, best first
router.get('/products/top-sellers', async (req, res) => {
    try {
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 12, 1), 48);
        const ranked = await Order.aggregate([
            { $match: { status: { $in: SOLD_STATUSES } } },
            { $unwind: '$items' },
            { $group: { _id: '$items.product', sold: { $sum: '$items.quantity' } } },
            { $sort: { sold: -1, _id: 1 } }, // _id keeps ties in a stable order
            { $limit: limit * 2 } // headroom for products that have since been deleted
        ]);
        const products = await Product.find({ _id: { $in: ranked.map(r => r._id) } }).lean();
        const byId = new Map(products.map(p => [String(p._id), p]));
        res.json(ranked.map(r => byId.get(String(r._id))).filter(Boolean).slice(0, limit));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching top sellers' });
    }
});

// GET /api/categories - Categories that have products, most products first, each with a tile image
router.get('/categories', async (req, res) => {
    try {
        const [categories, stats] = await Promise.all([
            Category.find({}).lean(),
            // Newest product's first photo stands in for categories without their own image
            Product.aggregate([
                { $sort: { createdAt: -1 } },
                { $group: { _id: '$category', count: { $sum: 1 }, image: { $first: { $arrayElemAt: ['$images', 0] } } } }
            ])
        ]);
        const statsByName = new Map(stats.map(s => [s._id, s]));
        res.json(categories
            .filter(c => statsByName.has(c.name))
            .map(c => ({
                name: c.name,
                image: c.image || statsByName.get(c.name).image || null,
                productCount: statsByName.get(c.name).count
            }))
            .sort((a, b) => b.productCount - a.productCount));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching categories' });
    }
});

// Checkout sends emails, creates accounts and holds stock, so keep it well below the global limit
const checkoutLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many orders from this network. Please try again later or contact us on WhatsApp.' }
});

const CUSTOMER_FIELD_LIMITS = { name: 100, email: 254, phone: 30, address: 300, state: 50, password: 200 };
const EMAIL_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

// Keep only known customer fields, as trimmed strings within length limits
const cleanCustomerInfo = (info) => {
    const cleaned = {};
    for (const [field, maxLength] of Object.entries(CUSTOMER_FIELD_LIMITS)) {
        const value = info?.[field];
        if (value === undefined || value === null || value === '') continue;
        if (typeof value !== 'string') throw new Error(`Invalid ${field}`);
        const trimmed = field === 'password' ? value : value.trim();
        if (trimmed.length > maxLength) throw new Error(`${field} is too long`);
        cleaned[field] = trimmed;
    }
    if (cleaned.email && !EMAIL_PATTERN.test(cleaned.email)) throw new Error('Please enter a valid email address');
    if (cleaned.password && cleaned.password.length < 6) throw new Error('Password must be at least 6 characters');
    return cleaned;
};

// POST /api/checkout
router.post('/checkout', checkoutLimiter, async (req, res) => {
    try {
        const { cart, deliveryMethod } = req.body;

        if (!Array.isArray(cart) || cart.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }
        if (cart.length > 50) {
            return res.status(400).json({ success: false, message: 'Too many items in cart' });
        }

        let customerInfo;
        try {
            customerInfo = cleanCustomerInfo(req.body.customerInfo);
        } catch (err) {
            return res.status(400).json({ success: false, message: err.message });
        }

        let userId = null;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, SECRET_KEY, VERIFY_OPTIONS);
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

            // Colour and size must be options the product actually offers
            if (item.selectedColor && !dbProduct.colors.some(c => c.name === item.selectedColor)) {
                return res.status(400).json({ success: false, message: `The selected colour for ${dbProduct.name} is no longer available. Please remove it from your cart and add it again.` });
            }
            if (item.selectedSize && !dbProduct.sizes.includes(item.selectedSize)) {
                return res.status(400).json({ success: false, message: `The selected size for ${dbProduct.name} is no longer available. Please remove it from your cart and add it again.` });
            }

            // With per-option stock we need to know exactly which option is being bought
            if (stockMode(dbProduct) === 'variant') {
                if (dbProduct.colors.length > 0 && !item.selectedColor) {
                    return res.status(400).json({ success: false, message: `Please choose a colour for ${dbProduct.name}. Remove it from your cart and add it again with a colour.` });
                }
                if (dbProduct.sizes.length > 0 && !item.selectedSize) {
                    return res.status(400).json({ success: false, message: `Please choose a size for ${dbProduct.name}. Remove it from your cart and add it again with a size.` });
                }
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

        // Make sure the items are available. Stock is only taken off when an admin marks the order as paid.
        try {
            await checkStock(processedItems);
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
                return res.status(500).json({ success: false, message: 'Server error during account creation.' });
            }
        }

        const newOrder = new Order({
            user: userId,
            items: processedItems,
            totalAmount: calculatedTotal,
            customerInfo: { ...customerInfo, password: undefined },
            deliveryMethod: deliveryMethod || 'delivery',
            status: 'pending'
        });

        const savedOrder = await newOrder.save();

        // Send Email Notifications
        try {
            // Find admins to notify
            const admins = await User.find({ role: { $in: ['superadmin', 'admin', 'manager'] } });
            const adminEmails = [...new Set(admins.filter(a => a.email).map(a => a.email))]; // one recipient per address
            
            // Send customer confirmation if email exists
            if (customerInfo && customerInfo.email) {
                sendOrderConfirmationEmail(customerInfo.email, savedOrder).catch(err => console.error('Error sending customer email', err));
            }
            
            // Send admin notification
            if (adminEmails.length > 0) {
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
