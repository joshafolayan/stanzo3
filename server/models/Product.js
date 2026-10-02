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
    // Units available. null/missing = stock not tracked (always purchasable).
    stockQuantity: {
        type: Number,
        min: 0,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
