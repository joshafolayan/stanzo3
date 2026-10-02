const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const fs = require('fs-extra');
// const path = require('path'); // Removed duplicate
const User = require('../models/User');
const Product = require('../models/Product');
const connectDB = require('../config/db');

// File paths
const PRODUCTS_FILE = path.join(__dirname, '../data/products.json');
const USERS_FILE = path.join(__dirname, '../data/users.json');

const seedData = async () => {
    try {
        // This wipes ALL products - make sure nobody runs it against the live database by accident
        if (!process.argv.includes('--yes-delete-all-products')) {
            console.error('This script DELETES ALL PRODUCTS and replaces them with data/products.json.');
            console.error(`Database: ${(process.env.MONGO_URI || 'mongodb://localhost:27017/stanzo3').replace(/\/\/[^@]*@/, '//***@')}`);
            console.error('If you are sure, run: node scripts/seed.js --yes-delete-all-products');
            process.exit(1);
        }

        await connectDB();

        console.log('Clearing existing data...');
        // await User.deleteMany({}); // Optional: Clear users
        await Product.deleteMany({}); // Clear products to avoid duplicates on re-run

        // Import Products
        if (await fs.pathExists(PRODUCTS_FILE)) {
            const products = await fs.readJson(PRODUCTS_FILE);
            if (products.length > 0) {
                // Remove _id if it exists in JSON to allow Mongo to generate new ObjectIds, unless we want to keep them?
                // Our schema uses 'id' as a number, so we map that field.
                await Product.insertMany(products);
                console.log(`Imported ${products.length} products`);
            }
        }

        // Import Users
        // Check if we need to seed users (only if DB is empty to avoid overwriting)
        const userCount = await User.countDocuments();
        if (userCount === 0 && await fs.pathExists(USERS_FILE)) {
            const users = await fs.readJson(USERS_FILE);
            if (users.length > 0) {
                // Ensure users match schema (hashed password is already in file)
                await User.insertMany(users);
                console.log(`Imported ${users.length} users`);
            }
        } else {
            console.log('Users already exist, skipping user import.');
        }

        console.log('Data Import Completed!');
        process.exit();
    } catch (error) {
        console.error('Error with data import:', error);
        process.exit(1);
    }
};

seedData();
