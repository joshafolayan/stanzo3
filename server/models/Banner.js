const mongoose = require('mongoose');

// A slide in the homepage hero
const bannerSchema = new mongoose.Schema({
    eyebrow: { type: String, trim: true, default: '' }, // small line above the title
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true, default: '' },
    image: { type: String, required: true }, // Cloudinary URL
    buttonText: { type: String, trim: true, default: '' },
    buttonLink: { type: String, trim: true, default: '' }, // a path on this site (/shop?filter=deals) or an https:// URL
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 } // lower shows first
}, {
    timestamps: true
});

module.exports = mongoose.model('Banner', bannerSchema);
