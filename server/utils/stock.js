const Product = require('../models/Product');

// Sum quantities per product, since one product can appear several times (different colours/sizes)
const totalsByProduct = (items) => {
    const totals = new Map();
    for (const item of items) {
        const key = String(item.product);
        totals.set(key, (totals.get(key) || 0) + (item.quantity || 1));
    }
    return totals;
};

const releaseStock = async (items) => {
    for (const [productId, qty] of totalsByProduct(items)) {
        await Product.updateOne(
            { _id: productId, stockQuantity: { $ne: null } },
            { $inc: { stockQuantity: qty } }
        );
    }
};

// Atomically take stock for every item. If any product doesn't have enough,
// undo what was already taken and throw an error with a customer-facing message.
const reserveStock = async (items) => {
    const reserved = [];
    for (const [productId, qty] of totalsByProduct(items)) {
        const product = await Product.findById(productId);
        if (!product || product.stockQuantity === null || product.stockQuantity === undefined) {
            continue; // not tracked
        }
        const updated = await Product.findOneAndUpdate(
            { _id: productId, stockQuantity: { $gte: qty } },
            { $inc: { stockQuantity: -qty } },
            { new: true }
        );
        if (!updated) {
            await releaseStock(reserved);
            const left = (await Product.findById(productId))?.stockQuantity || 0;
            const err = new Error(left > 0
                ? `Only ${left} of "${product.name}" left in stock. Please reduce the quantity in your cart.`
                : `"${product.name}" is sold out. Please remove it from your cart.`);
            err.isStockError = true;
            throw err;
        }
        reserved.push({ product: productId, quantity: qty });
    }
};

// Check (without changing anything) that every tracked product has enough stock
const checkStock = async (items) => {
    for (const [productId, qty] of totalsByProduct(items)) {
        const product = await Product.findById(productId);
        if (!product || product.stockQuantity === null || product.stockQuantity === undefined) continue;
        if (product.stockQuantity < qty) {
            const err = new Error(product.stockQuantity > 0
                ? `Only ${product.stockQuantity} of "${product.name}" left in stock. Please reduce the quantity in your cart.`
                : `"${product.name}" is sold out. Please remove it from your cart.`);
            err.isStockError = true;
            throw err;
        }
    }
};

module.exports = { checkStock, reserveStock, releaseStock };
