const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'stanzo3_products',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif'],
        transformation: [{ width: 800, height: 800, crop: 'limit' }]
    }
});

const uploadCloud = multer({ storage });

// Homepage banners are shown full width, so they keep more resolution.
// Same folder as products, so admin.js's destroyCloudinaryImage can delete them.
const bannerStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'stanzo3_products',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        transformation: [{ width: 2000, height: 2000, crop: 'limit' }]
    }
});

const uploadBanner = multer({ storage: bannerStorage, limits: { fileSize: 10 * 1024 * 1024 } });

module.exports = { cloudinary, uploadCloud, uploadBanner };
