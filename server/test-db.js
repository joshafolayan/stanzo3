require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const users = await User.find({});
    console.log('All Users in DB:', users.map(u => ({ username: u.username, email: u.email, role: u.role })));
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
