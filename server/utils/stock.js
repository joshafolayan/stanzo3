const Product = require('../models/Product');

// A product's stock is tracked in one of three ways:
//   'variant'   - per colour/size combination (product.variantStock has entries)
//   'single'    - one number for the whole product (product.stockQuantity is set)
//   'untracked' - always purchasable
const stockMode = (product) => {
    if (product.variantStock && product.variantStock.length > 0) return 'variant';
    if (product.stockQuantity !== null && product.stockQuantity !== undefined) return 'single';
    return 'untracked';
};

const describe = (product, bucket) => {
    const option = [bucket.color, bucket.size].filter(Boolean).join(' / ');
    return option ? `"${product.name}" (${option})` : `"${product.name}"`;
};

const stockError = (message) => {
    const err = new Error(message);
    err.isStockError = true;
    return err;
};

const shortageError = (product, bucket, available) => stockError(available > 0
    ? `Only ${available} of ${describe(product, bucket)} left in stock. Please reduce the quantity in your cart.`
    : `${describe(product, bucket)} is sold out. Please remove it from your cart.`);

// Group order items into the stock "buckets" they draw from, summing quantities.
// Returns [{ product, mode, color, size, quantity }] - untracked products are left out.
const groupIntoBuckets = async (items) => {
    const products = new Map();
    const buckets = new Map();
    for (const item of items) {
        const id = String(item.product);
        if (!products.has(id)) products.set(id, await Product.findById(id));
        const product = products.get(id);
        if (!product) continue;

        const mode = stockMode(product);
        if (mode === 'untracked') continue;

        const color = mode === 'variant' ? (item.selectedColor || '') : '';
        const size = mode === 'variant' ? (item.selectedSize || '') : '';
        const key = `${id}|${color}|${size}`;
        const existing = buckets.get(key);
        if (existing) {
            existing.quantity += item.quantity || 1;
        } else {
            buckets.set(key, { product: id, productDoc: product, mode, color, size, quantity: item.quantity || 1 });
        }
    }
    return [...buckets.values()];
};

const availableIn = (product, bucket) => {
    if (bucket.mode === 'single') return product.stockQuantity;
    const entry = product.variantStock.find(v => v.color === bucket.color && v.size === bucket.size);
    return entry ? entry.quantity : 0; // a combination with no stock entry can't be sold
};

// Check (without changing anything) that every tracked item has enough stock
const checkStock = async (items) => {
    for (const bucket of await groupIntoBuckets(items)) {
        const available = availableIn(bucket.productDoc, bucket);
        if (available < bucket.quantity) throw shortageError(bucket.productDoc, bucket, available);
    }
};

// Put stock back, using the exact list of deductions returned by reserveStock
const releaseStock = async (deductions) => {
    for (const d of deductions) {
        if (d.mode === 'variant') {
            // If the combination was removed from the product since, there's nowhere to put it back
            await Product.updateOne(
                { _id: d.product, variantStock: { $elemMatch: { color: d.color, size: d.size } } },
                { $inc: { 'variantStock.$.quantity': d.quantity } }
            );
        } else {
            await Product.updateOne(
                { _id: d.product, stockQuantity: { $ne: null } },
                { $inc: { stockQuantity: d.quantity } }
            );
        }
    }
};

// Atomically take stock for every item. If anything is short, undo what was already
// taken and throw an error with a customer-facing message.
// Returns the list of deductions made, to be stored on the order for releaseStock.
const reserveStock = async (items) => {
    const deductions = [];
    for (const bucket of await groupIntoBuckets(items)) {
        const filter = bucket.mode === 'variant'
            ? { _id: bucket.product, variantStock: { $elemMatch: { color: bucket.color, size: bucket.size, quantity: { $gte: bucket.quantity } } } }
            : { _id: bucket.product, stockQuantity: { $gte: bucket.quantity } };
        const update = bucket.mode === 'variant'
            ? { $inc: { 'variantStock.$.quantity': -bucket.quantity } }
            : { $inc: { stockQuantity: -bucket.quantity } };

        const result = await Product.updateOne(filter, update);
        if (result.modifiedCount !== 1) {
            await releaseStock(deductions);
            const fresh = await Product.findById(bucket.product);
            throw shortageError(bucket.productDoc, bucket, fresh ? availableIn(fresh, bucket) : 0);
        }
        deductions.push({ product: bucket.product, mode: bucket.mode, color: bucket.color, size: bucket.size, quantity: bucket.quantity });
    }
    return deductions;
};

module.exports = { stockMode, checkStock, reserveStock, releaseStock };
