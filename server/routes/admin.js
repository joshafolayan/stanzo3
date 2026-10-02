const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');
const { uploadCloud, cloudinary } = require('../config/cloudinary');

const STAFF_ROLES = ['admin', 'manager', 'salesrep', 'superadmin'];
const ADMIN_ROLES = ['admin', 'superadmin']; // roles that can manage staff accounts

const DEFAULT_CATEGORIES =['Bags', 'Shoes', 'Accessories', 'Clothing'];

// Delete an image from Cloudinary given its URL (non-Cloudinary paths are ignored)
const destroyCloudinaryImage = async (imgUrl) => {
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
};

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Only these fields can be set from the product form; anything else (id, _id, timestamps...) is ignored
const parseProductData = (raw) => {
    let input;
    try {
        input = JSON.parse(raw);
    } catch {
        throw new Error('Invalid product data');
    }
    const data = {};
    for (const field of ['name', 'category', 'description']) {
        if (input[field] !== undefined) data[field] = String(input[field]).trim();
    }
    if (input.price !== undefined) {
        data.price = Number(input.price);
        if (!Number.isFinite(data.price) || data.price < 0) throw new Error('Price must be 0 or more');
    }
    if (input.discountPercentage !== undefined) {
        data.discountPercentage = Number(input.discountPercentage) || 0;
        if (data.discountPercentage < 0 || data.discountPercentage > 100) throw new Error('Discount must be between 0 and 100');
    }
    data.colors = (Array.isArray(input.colors) ? input.colors : [])
        .map(c => ({ name: String(c?.name || '').trim(), hex: String(c?.hex || '') }));
    data.sizes = (Array.isArray(input.sizes) ? input.sizes : [])
        .map(s => String(s).trim()).filter(Boolean);
    if (Array.isArray(input.images)) {
        data.images = input.images.filter(img => typeof img === 'string');
    }

    // Stock: required, never guessed. Products with colours and/or sizes need a number for every
    // combination; products with neither need a single number.
    const colors = (data.colors || []).map(c => c.name);
    const sizes = data.sizes || [];
    if (colors.some(name => !name)) throw new Error('Every colour needs a name');
    if (new Set(colors).size !== colors.length) throw new Error('Two colours have the same name');
    if (new Set(sizes).size !== sizes.length) throw new Error('A size is listed twice');

    if (colors.length > 0 || sizes.length > 0) {
        const provided = Array.isArray(input.variantStock) ? input.variantStock : [];
        const lookup = new Map(provided.map(v => [`${v?.color || ''}|${v?.size || ''}`, v?.quantity]));
        data.variantStock = [];
        for (const color of colors.length > 0 ? colors : ['']) {
            for (const size of sizes.length > 0 ? sizes : ['']) {
                const label = [color, size].filter(Boolean).join(' / ');
                const quantity = parseStockQuantity(lookup.get(`${color}|${size}`));
                if (quantity === null || quantity === undefined) throw new Error(`Enter a stock quantity for ${label}`);
                data.variantStock.push({ color, size, quantity });
            }
        }
        data.stockQuantity = null;
    } else {
        data.stockQuantity = parseStockQuantity(input.stockQuantity);
        if (data.stockQuantity === null || data.stockQuantity === undefined) throw new Error('Enter a quantity in stock');
        data.variantStock = [];
    }
    return data;
};

// Normalise stockQuantity from the admin form: blank/null = not tracked, otherwise a whole number >= 0
const parseStockQuantity = (value) => {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0) throw new Error('Stock quantity must be a whole number of 0 or more');
    return n;
};

// GET /api/admin/categories - List categories (seeds defaults + existing product categories on first use)
router.get('/categories', protect, admin, async (req, res) => {
    try {
        if (await Category.countDocuments() === 0) {
            const used = await Product.distinct('category');
            const names = [...new Set([...DEFAULT_CATEGORIES, ...used.filter(Boolean)])];
            await Category.insertMany(names.map(name => ({ name })), { ordered: false }).catch(() => {});
        }
        const categories = await Category.find({}).sort({ name: 1 }).lean();
        const counts = await Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
        const countMap = Object.fromEntries(counts.map(c => [c._id, c.count]));
        res.json(categories.map(c => ({ ...c, productCount: countMap[c.name] || 0 })));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching categories' });
    }
});

// POST /api/admin/categories - Create category
router.post('/categories', protect, admin, async (req, res) => {
    try {
        const name = (req.body.name || '').trim();
        if (!name) {
            return res.status(400).json({ message: 'Category name is required' });
        }
        const exists = await Category.findOne({ name: new RegExp(`^${escapeRegex(name)}$`, 'i') });
        if (exists) {
            return res.status(400).json({ message: 'Category already exists' });
        }
        const category = await Category.create({ name });
        res.status(201).json(category);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error creating category' });
    }
});

// PUT /api/admin/categories/:id - Rename category (also updates products using it)
router.put('/categories/:id', protect, admin, async (req, res) => {
    try {
        const name = (req.body.name || '').trim();
        if (!name) {
            return res.status(400).json({ message: 'Category name is required' });
        }
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        const duplicate = await Category.findOne({
            _id: { $ne: category._id },
            name: new RegExp(`^${escapeRegex(name)}$`, 'i')
        });
        if (duplicate) {
            return res.status(400).json({ message: 'Category already exists' });
        }

        const oldName = category.name;
        category.name = name;
        await category.save();
        await Product.updateMany({ category: oldName }, { category: name });

        res.json(category);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating category' });
    }
});

// DELETE /api/admin/categories/:id - Delete category (only if no products use it)
router.delete('/categories/:id', protect, admin, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        const inUse = await Product.countDocuments({ category: category.name });
        if (inUse > 0) {
            return res.status(400).json({ message: `Cannot delete: ${inUse} product(s) still use this category` });
        }
        await category.deleteOne();
        res.json({ message: 'Category removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error deleting category' });
    }
});

// GET /api/admin/products - Get all products (protected not strictly necessary but good practice for admin view if it had sensitive info)
router.get('/products', protect, admin, async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching products' });
    }
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
        const validStatuses = ['pending', 'processing', 'delivered', 'shipped', 'paid', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status provided.' });
        }

        const existingOrder = await Order.findById(req.params.id);
        if (!existingOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (existingOrder.status === 'delivered') {
            return res.status(400).json({ message: 'Cannot update an already delivered order.' });
        }

        // Stock comes off once the order is paid (or moved past paid), and goes back if it returns to pending/cancelled.
        // The stockDeducted flag is flipped atomically so two admins clicking at once can't deduct twice.
        const { reserveStock, releaseStock } = require('../utils/stock');
        const PAID_STATUSES = ['paid', 'processing', 'shipped', 'delivered'];
        let stockDeducted = existingOrder.stockDeducted;
        let stockDeductions = existingOrder.stockDeductions;

        if (PAID_STATUSES.includes(status) && !existingOrder.stockDeducted) {
            const claimed = await Order.findOneAndUpdate(
                { _id: existingOrder._id, stockDeducted: { $ne: true } },
                { stockDeducted: true }
            );
            if (claimed) {
                try {
                    stockDeductions = await reserveStock(existingOrder.items);
                    await Order.updateOne({ _id: existingOrder._id }, { stockDeductions });
                } catch (err) {
                    await Order.updateOne({ _id: existingOrder._id }, { stockDeducted: false });
                    if (err.isStockError) {
                        return res.status(400).json({ message: `Not enough stock to mark this order as ${status}: ${err.message.replace(/ Please.*$/, '')}` });
                    }
                    throw err;
                }
            }
            stockDeducted = true;
        } else if (!PAID_STATUSES.includes(status) && existingOrder.stockDeducted) {
            const claimed = await Order.findOneAndUpdate(
                { _id: existingOrder._id, stockDeducted: true },
                { stockDeducted: false }
            );
            if (claimed) {
                // Orders paid before per-option stock existed have no deduction list: they used the single number
                const deductions = claimed.stockDeductions?.length > 0
                    ? claimed.stockDeductions
                    : existingOrder.items.map(item => ({ product: item.product, mode: 'single', quantity: item.quantity }));
                await releaseStock(deductions);
            }
            stockDeducted = false;
            stockDeductions = [];
        }

        existingOrder.status = status;
        existingOrder.stockDeducted = stockDeducted;
        existingOrder.stockDeductions = stockDeductions;
        existingOrder.processedBy = req.user.username;
        const updatedOrder = await existingOrder.save();

        res.json(updatedOrder);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating order status' });
    }
});

// POST /api/admin/products - Create Product
router.post('/products', protect, admin, uploadCloud.array('images', 5), async (req, res) => {
    try {
        let productData;
        try {
            productData = parseProductData(req.body.productData);
        } catch (err) {
            return res.status(400).json({ message: err.message });
        }
        if (!productData.name || productData.price === undefined) {
            return res.status(400).json({ message: 'Name and price are required' });
        }

        productData.images = (req.files || []).map(file => file.path); // Cloudinary URLs

        // Generate numeric ID for compatibility
        // In a real app, use _id or a dedicated counter collection
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
        let productData;
        try {
            productData = parseProductData(req.body.productData);
        } catch (err) {
            return res.status(400).json({ message: err.message });
        }

        const existing = await Product.findOne({ id: id });
        if (!existing) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // productData.images = existing images the admin kept (in display order); new uploads are appended
        const keptImages = Array.isArray(productData.images)
            ? productData.images.filter(img => existing.images.includes(img))
            : existing.images;
        const newImages = (req.files || []).map(file => file.path); // Cloudinary URL
        productData.images = [...keptImages, ...newImages];

        const removedImages = existing.images.filter(img => !keptImages.includes(img));
        for (const imgUrl of removedImages) {
            await destroyCloudinaryImage(imgUrl);
        }

        const updatedProduct = await Product.findOneAndUpdate(
            { id: id },
            productData,
            { new: true, runValidators: true }
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
        for (const imgUrl of product.images || []) {
            await destroyCloudinaryImage(imgUrl);
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
        const users = await User.find({
            role: { $in: ['admin', 'manager', 'salesrep', 'superadmin'] }
        }).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching users' });
    }
});

// POST /api/admin/users - Create User
router.post('/users', protect, admin, async (req, res) => {
    try {
        // Only allow admin and superadmin to create new admins/managers
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            return res.status(403).json({ message: 'Only an admin can create additional users' });
        }

        const { password, role = 'admin' } = req.body;
        const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';

        if (!username || typeof password !== 'string' || password.length < 6) {
            return res.status(400).json({ message: 'Username and a password of at least 6 characters are required' });
        }
        if (!STAFF_ROLES.includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }
        if (role === 'superadmin' && req.user.role !== 'superadmin') {
            return res.status(403).json({ message: 'Only a superadmin can create a superadmin' });
        }

        const userExists = await User.findOne({ username: new RegExp(`^${escapeRegex(username)}$`, 'i') });
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
        // Only admin and superadmin can remove staff (same rule as creating them)
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            return res.status(403).json({ message: 'Only an admin can delete users' });
        }

        const target = await User.findById(req.params.id);
        if (!target || !STAFF_ROLES.includes(target.role)) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (String(target._id) === String(req.user.id)) {
            return res.status(400).json({ message: 'You cannot delete your own account' });
        }
        if (target.role === 'superadmin' && req.user.role !== 'superadmin') {
            return res.status(403).json({ message: 'Only a superadmin can delete a superadmin' });
        }

        // Never remove the last account that can manage users
        if (ADMIN_ROLES.includes(target.role)) {
            const adminCount = await User.countDocuments({ role: { $in: ADMIN_ROLES } });
            if (adminCount <= 1) {
                return res.status(400).json({ message: 'Cannot delete the last admin user' });
            }
        }

        await target.deleteOne();
        res.json({ message: 'User removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting user' });
    }
});

module.exports = router;
