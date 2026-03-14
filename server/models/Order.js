const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 },
    selectedColor: { type: String },
    selectedSize: { type: String }
});

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Optional to allow guest checkout
    },
    items: [orderItemSchema],
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    customerInfo: {
        name: { type: String },
        phone: { type: String },
        email: { type: String },
        address: { type: String },
        state: { type: String }
    },
    paymentMethod: {
        type: String,
        default: 'bank_transfer'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
