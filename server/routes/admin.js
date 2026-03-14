const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');
const { uploadCloud, cloudinary } = require('../config/cloudinary');

// GET /api/admin/products - Get all products (protected not strictly necessary but good practice for admin view if it had sensitive info)
router.get('/products', protect, admin, async (req, res) => {
    const products = await Product.find({});
    res.json(products);
});

// GET /api/admin/orders - Get all orders
router.get('/orders', protect, admin, async (req, res) => {
    try {
        const Order = require('../models/Order'); // Local import since not at top
        const orders = await Order.find({}).sort({ createdAt: -1 }).populate('user', 'username email');
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching orders' });
    }
});

// PUT /api/admin/orders/:id/status - Update order status
router.put('/orders/:id/status', protect, admin, async (req, res) => {
    try {
        const { status } = req.body;
        const Order = require('../models/Order');

        // Simple validation
        const validStatuses = ['pending', 'processing', 'completed', 'paid', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status provided.' });
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(updatedOrder);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating order status' });
    }
});

// POST /api/admin/products - Create Product
router.post('/products', protect, admin, uploadCloud.array('images', 5), async (req, res) => {
    try {
        const productData = JSON.parse(req.body.productData); // Expecting JSON string for data part

        if (req.files && req.files.length > 0) {
            productData.images = req.files.map(file => file.path); // Cloudinary URL
        } else if (!productData.images) {
            productData.images = [];
        }

        // Generate numeric ID for compatibility
        // In a real app, use _id or a dedicated counter collection
        const count = await Product.countDocuments();
        productData.id = Date.now(); // Simple unique numeric-like ID

        const newProduct = await Product.create(productData);
        res.status(201).json(newProduct);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error creating product' });
    }
});

// PUT /api/admin/products/:id - Update Product
router.put('/products/:id', protect, admin, uploadCloud.array('images', 5), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const productData = JSON.parse(req.body.productData);

        if (req.files && req.files.length > 0) {
            // For simplicity, if new files are uploaded, we replace the old ones. 
            productData.images = req.files.map(file => file.path); // Cloudinary URL
        }

        const updatedProduct = await Product.findOneAndUpdate(
            { id: id },
            productData,
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json(updatedProduct);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating product' });
    }
});

// DELETE /api/admin/products/:id - Delete Product
router.delete('/products/:id', protect, admin, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        const product = await Product.findOne({ id: id });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Delete image file from Cloudinary 
        if (product.images && product.images.length > 0) {
            for (const imgUrl of product.images) {
                // Cloudinary URL format: https://res.cloudinary.com/.../image/upload/v1234/stanzo3_products/filename.jpg
                const urlParts = imgUrl.split('/');
                const filename = urlParts[urlParts.length - 1];
                const publicId = filename.split('.')[0];
                if (publicId && imgUrl.includes('res.cloudinary.com')) {
                    try {
                        await cloudinary.uploader.destroy(`stanzo3_products/${publicId}`);
                    } catch (err) {
                        console.error('Failed to delete image from Cloudinary:', err);
                    }
                }
            }
        }
        
        await Product.findOneAndDelete({ id: id });

        res.json({ message: 'Product removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting product' });
    }
});

// GET /api/admin/users - Get all users
router.get('/users', protect, admin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching users' });
    }
});

// POST /api/admin/users - Create User
router.post('/users', protect, admin, async (req, res) => {
    try {
        const { username, password, role = 'admin' } = req.body;

        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            username,
            password: hashedPassword,
            role
        });

        const safeUser = newUser.toObject();
        delete safeUser.password;

        res.status(201).json(safeUser);
    } catch (error) {
        res.status(500).json({ message: 'Server error creating user' });
    }
});

// DELETE /api/admin/users/:id - Delete User
router.delete('/users/:id', protect, admin, async (req, res) => {
    try {
        const { id } = req.params;

        const count = await User.countDocuments();
        if (count <= 1) {
            return res.status(400).json({ message: 'Cannot delete the last admin user' });
        }

        await User.findByIdAndDelete(id);
        res.json({ message: 'User removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting user' });
    }
});

module.exports = router;
