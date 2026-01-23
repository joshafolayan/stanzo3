const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../utils/db');
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
    const products = await db.read('products');
    res.json(products);
});

// POST /api/admin/products - Create Product
router.post('/products', protect, upload.single('image'), async (req, res) => {
    try {
        const products = await db.read('products');
        const newProduct = JSON.parse(req.body.productData); // Expecting JSON string for data part

        if (req.file) {
            newProduct.image = '/products/' + req.file.filename;
        }

        newProduct.id = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        products.push(newProduct);

        await db.write('products', products);
        res.status(201).json(newProduct);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error creating product' });
    }
});

// PUT /api/admin/products/:id - Update Product
router.put('/products/:id', protect, upload.single('image'), async (req, res) => {
    try {
        const products = await db.read('products');
        const id = parseInt(req.params.id);
        const index = products.findIndex(p => p.id === id);

        if (index === -1) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const updatedData = JSON.parse(req.body.productData);

        // Merge updates
        const updatedProduct = { ...products[index], ...updatedData };

        if (req.file) {
            updatedProduct.image = '/products/' + req.file.filename;
        }

        products[index] = updatedProduct;
        await db.write('products', products);
        res.json(updatedProduct);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating product' });
    }
});

// DELETE /api/admin/products/:id - Delete Product
router.delete('/products/:id', protect, async (req, res) => {
    try {
        let products = await db.read('products');
        const id = parseInt(req.params.id);
        const product = products.find(p => p.id === id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Optional: Delete image file from FS? 
        // For now, let's keep it simple and just remove record.

        products = products.filter(p => p.id !== id);
        await db.write('products', products);
        res.json({ message: 'Product removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting product' });
    }
});

module.exports = router;
