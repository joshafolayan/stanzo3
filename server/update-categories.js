const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./models/Product');

// CONNECTING TO MONGODB ATLAS
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

async function updateCategories() {
    try {
        const products = await Product.find({});
        console.log(`Found ${products.length} products to update`);

        for (let product of products) {
            const name = product.name.toLowerCase();
            let newCategory = 'Accessories'; // Default fallback

            if (name.includes('bag') || name.includes('tote') || name.includes('handbag')) {
                newCategory = 'Bags';
            } else if (name.includes('shoe') || name.includes('sneaker') || name.includes('boot')) {
                newCategory = 'Shoes';
            } else if (name.includes('shirt') || name.includes('dress') || name.includes('jacket')) {
                newCategory = 'Clothing';
            }

            console.log(`Updating "${product.name}" -> Category: ${newCategory}`);
            await Product.updateOne({ _id: product._id }, { category: newCategory });
        }

        console.log('Categories updated successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error updating categories:', error);
        process.exit(1);
    }
}

updateCategories();
