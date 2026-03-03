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
    stock: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
