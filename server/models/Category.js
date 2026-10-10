const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    // Tile image on the storefront (Cloudinary URL). Falls back to a product photo when empty.
    image: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Category', categorySchema);
