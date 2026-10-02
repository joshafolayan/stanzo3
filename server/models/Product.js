const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    id: {
        // Keeping the numeric ID for now to maintain frontend compatibility, 
        // though migrating to _id is better long term.
        type: Number,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    discountPercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    images: [{
        type: String
    }],
    colors: [{
        name: String,
        hex: String
    }],
    sizes: [String],
    description: String,
    category: String,
    // Stock per colour/size combination. Used when the product has colours and/or sizes.
    // color is '' when the product has no colours; size is '' when it has no sizes.
    variantStock: [{
        _id: false,
        color: { type: String, default: '' },
        size: { type: String, default: '' },
        quantity: { type: Number, required: true, min: 0 }
    }],
    // Single stock number, for products without colours or sizes (and older products not yet converted).
    // null/missing = stock not tracked (always purchasable).
    stockQuantity: {
        type: Number,
        min: 0,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
