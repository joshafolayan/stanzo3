import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle, MessageCircle, Loader2, Store, Truck, LogIn } from 'lucide-react';

const PaymentModal = ({ isOpen, onClose }) => {
    const { cart, cartTotal, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [deliveryMethod, setDeliveryMethod] = useState(''); // '' = not chosen yet
    const [selectedState, setSelectedState] = useState('');
    const [address, setAddress] = useState('');
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        email: '',
        phone: '',
    });

    // Pre-fill from logged-in user details
    useEffect(() => {
        if (user) {
            setCustomerInfo(prev => ({
                ...prev,
                name: user.username || '',
                email: user.email || '',
                phone: user.phone || '',
            }));
        }
    }, [user]);

    const NIGERIAN_STATES = [
        "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
        "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe",
        "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
        "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
        "Taraba", "Yobe", "Zamfara"
    ];

    if (!isOpen) return null;

    const handleChange = (e) => {
        setCustomerInfo(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleDeliverySelect = (method) => {
        // If guest tries to select Delivery, redirect to login
        if (method === 'delivery' && !user) {
            onClose();
            navigate('/login');
            return;
        }
        setDeliveryMethod(method);
        setError('');
    };

    const handleWhatsApp = async () => {
        // Validation
        if (!deliveryMethod) {
            setError('Please select a delivery method.');
            return;
        }
        if (!customerInfo.name.trim() || !customerInfo.phone.trim()) {
            setError('Please fill in your name and phone number.');
            return;
        }
        if (deliveryMethod === 'delivery') {
            if (!selectedState) {
                setError('Please select your delivery state.');
                return;
            }
            if (!address.trim()) {
                setError('Please enter your delivery address.');
                return;
            }
        }

        setIsSubmitting(true);
        setError('');

        try {
            const response = await axios.post('/api/checkout', {
                cart,
                deliveryMethod,
                customerInfo: {
                    name: customerInfo.name.trim(),
                    email: customerInfo.email.trim(),
                    phone: customerInfo.phone.trim(),
                    state: deliveryMethod === 'delivery' ? selectedState : '',
                    address: deliveryMethod === 'delivery' ? address.trim() : '',
                }
            });

            const orderId = response.data.orderId;

            // Build WhatsApp message
            let message = `Hello! I've just made a payment for my order (ID: ${orderId}):\n\n`;
            message += `*Customer Details:*\n`;
            message += `Name: ${customerInfo.name}\n`;
            if (customerInfo.email) message += `Email: ${customerInfo.email}\n`;
            message += `Phone: ${customerInfo.phone}\n`;
            message += `Delivery Method: ${deliveryMethod === 'store_pickup' ? '🏪 Store Pickup' : '🚚 Delivery'}\n`;
            if (deliveryMethod === 'delivery') {
                message += `Delivery State: ${selectedState}\n`;
                message += `Address: ${address}\n`;
            }
            message += `\n*Order Details:*\n`;
            cart.forEach((item, index) => {
                message += `${index + 1}. ${item.name}`;
                if (item.selectedColor) message += ` - Color: ${item.selectedColor}`;
                if (item.selectedSize) message += `, Size: ${item.selectedSize}`;
                message += ` - ₦${item.price.toLocaleString()}\n`;
            });
            message += `\n*Total Amount:* ₦${cartTotal.toLocaleString()}\n\n`;
            message += `I've transferred the amount to your account. Please confirm receipt. Thank you!`;

            const encodedMessage = encodeURIComponent(message);
            const phoneNumber = '2348067117690';
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

            const newWindow = window.open(whatsappUrl, '_blank');
            if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                window.location.href = whatsappUrl;
            }

            clearCart();
            onClose();

        } catch (err) {
            console.error('Checkout error:', err);
            setError('Failed to record order. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b flex justify-between items-center shrink-0">
                    <h2 className="text-xl font-bold text-blue-900">💳 Payment Details</h2>
                    <button onClick={onClose}><X className="text-gray-500 hover:text-red-500" /></button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">

                    {/* Step 1 — Delivery Method */}
                    <div>
                        <p className="text-sm font-semibold text-gray-700 mb-3">
                            How would you like to receive your order? <span className="text-red-500">*</span>
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {/* Store Pickup */}
                            <button
                                onClick={() => handleDeliverySelect('store_pickup')}
                                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                                    deliveryMethod === 'store_pickup'
                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <Store className="w-7 h-7" />
                                <span className="text-sm font-semibold">Store Pickup</span>
                                <span className="text-xs text-center leading-tight opacity-75">Pick up from our store</span>
                            </button>

                            {/* Delivery */}
                            <button
                                onClick={() => handleDeliverySelect('delivery')}
                                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 relative ${
                                    deliveryMethod === 'delivery'
                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <Truck className="w-7 h-7" />
                                <span className="text-sm font-semibold">Delivery</span>
                                <span className="text-xs text-center leading-tight opacity-75">Deliver to my address</span>
                                {!user && (
                                    <span className="absolute top-2 right-2">
                                        <LogIn className="w-3.5 h-3.5 text-gray-400" />
                                    </span>
                                )}
                            </button>
                        </div>
                        {!user && (
                            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                <LogIn className="w-3 h-3" />
                                Delivery requires you to{' '}
                                <button
                                    onClick={() => { onClose(); navigate('/login'); }}
                                    className="text-blue-600 underline font-medium"
                                >
                                    log in
                                </button>
                            </p>
                        )}
                    </div>

                    {/* Step 2 — Customer Info (shown once a method is chosen) */}
                    {deliveryMethod && (
                        <>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                                <h3 className="text-sm font-semibold text-blue-900">
                                    Your Information
                                    {user && <span className="ml-2 text-xs font-normal text-green-600">✓ Pre-filled from your account</span>}
                                </h3>

                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Full Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={customerInfo.name}
                                        onChange={handleChange}
                                        placeholder="e.g. John Doe"
                                        readOnly={!!user}
                                        className={`w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none ${user ? 'bg-gray-100 text-gray-600 cursor-default' : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Email Address {!user && <span className="text-gray-400">(optional)</span>}</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={customerInfo.email}
                                        onChange={handleChange}
                                        placeholder="e.g. john@email.com"
                                        readOnly={!!user}
                                        className={`w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none ${user ? 'bg-gray-100 text-gray-600 cursor-default' : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Phone Number <span className="text-red-500">*</span></label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={customerInfo.phone}
                                        onChange={handleChange}
                                        placeholder="e.g. 08012345678"
                                        readOnly={!!(user && user.phone)}
                                        className={`w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none ${user && user.phone ? 'bg-gray-100 text-gray-600 cursor-default' : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}`}
                                    />
                                </div>
                            </div>

                            {/* Delivery-only fields */}
                            {deliveryMethod === 'delivery' && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                                    <h3 className="text-sm font-semibold text-blue-900">🚚 Delivery Details</h3>

                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">Delivery State <span className="text-red-500">*</span></label>
                                        <select
                                            value={selectedState}
                                            onChange={(e) => setSelectedState(e.target.value)}
                                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                                        >
                                            <option value="">-- Choose a State --</option>
                                            {NIGERIAN_STATES.map((state) => (
                                                <option key={state} value={state}>{state}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">Full Delivery Address <span className="text-red-500">*</span></label>
                                        <textarea
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            placeholder="e.g. 12 Adeola Street, Ikeja, Lagos"
                                            rows={2}
                                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Store Pickup info */}
                            {deliveryMethod === 'store_pickup' && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                    <p className="text-sm font-semibold text-amber-800 mb-1">🏪 Store Pickup</p>
                                    <p className="text-xs text-amber-700">
                                        After payment, we'll contact you to arrange a convenient pickup time at our store.
                                    </p>
                                </div>
                            )}

                            {/* Bank Details */}
                            <div className="bg-red-50 border-2 border-red-100 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-blue-900 mb-4">Bank Transfer Details</h3>
                                <div className="bg-white rounded-lg p-4 space-y-3 shadow-sm">
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-gray-500">Bank Name</span>
                                        <span className="font-bold">First Bank Nigeria</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-gray-500">Account Name</span>
                                        <span className="font-bold">All Round Stores</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-gray-500">Account Number</span>
                                        <span className="font-mono font-bold">0123456789</span>
                                    </div>
                                    <div className="flex justify-between pt-2">
                                        <span className="text-gray-500">Amount</span>
                                        <span className="font-bold text-red-500 text-lg">₦{cartTotal.toLocaleString()}</span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 italic mt-4 text-center">
                                    Please transfer the exact amount and click the button below.
                                </p>
                            </div>

                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                                <CheckCircle className="text-green-600 w-6 h-6 flex-shrink-0" />
                                <div className="text-green-800 text-sm">
                                    <strong>Order Confirmed!</strong> Click below to notify us via WhatsApp after payment.
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="pt-2 shrink-0">
                                <button
                                    onClick={handleWhatsApp}
                                    disabled={isSubmitting}
                                    className="w-full py-4 bg-[#25D366] hover:bg-[#1fb855] disabled:opacity-70 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <MessageCircle className="w-6 h-6" />}
                                    {isSubmitting ? 'Recording Order...' : 'Chat on WhatsApp'}
                                </button>
                            </div>
                        </>
                    )}

                    {/* Error shown before method is chosen */}
                    {!deliveryMethod && error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
