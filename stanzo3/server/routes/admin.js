const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const fs = require('fs-extra');

// Storage configuration for Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // We save directly to client's public folder for simplicity in this mono-repo setup
        // In prod, this might be S3 or a shared volume
        const uploadPath = path.join(__dirname, '../../client/public/products');
        fs.ensureDirSync(uploadPath); // Ensure dir exists
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// GET /api/admin/products - Get all products (protected not strictly necessary but good practice for admin view if it had sensitive info)
router.get('/products', protect, async (req, res) => {
    const products = await Product.find({});
    res.json(products);
});

// POST /api/admin/products - Create Product
router.post('/products', protect, upload.single('image'), async (req, res) => {
    try {
        const productData = JSON.parse(req.body.productData); // Expecting JSON string for data part

        if (req.file) {
            productData.image = '/products/' + req.file.filename;
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
router.put('/products/:id', protect, upload.single('image'), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const productData = JSON.parse(req.body.productData);

        if (req.file) {
            productData.image = '/products/' + req.file.filename;
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
router.delete('/products/:id', protect, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const result = await Product.findOneAndDelete({ id: id });

        if (!result) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Optional: Delete image file from FS? 

        res.json({ message: 'Product removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting product' });
    }
});

// GET /api/admin/users - Get all users
router.get('/users', protect, async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching users' });
    }
});

// POST /api/admin/users - Create User
router.post('/users', protect, async (req, res) => {
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
router.delete('/users/:id', protect, async (req, res) => {
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
