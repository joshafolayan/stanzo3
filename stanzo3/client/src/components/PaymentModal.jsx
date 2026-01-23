import React from 'react';
import { useCart } from '../context/CartContext';
import { X, CheckCircle, MessageCircle } from 'lucide-react';

const PaymentModal = ({ isOpen, onClose }) => {
    const { cart, cartTotal } = useCart();

    if (!isOpen) return null;

    const handleWhatsApp = () => {
        let message = `Hello! I've just made a payment for my order:\n\n`;
        message += `*Order Details:*\n`;
        cart.forEach((item, index) => {
            message += `${index + 1}. ${item.name} - ${item.selectedColor}, Size ${item.selectedSize} - ₦${item.price.toLocaleString()}\n`;
        });
        message += `\n*Total Amount:* ₦${cartTotal.toLocaleString()}\n\n`;
        message += `I've transferred the amount to your account. Please confirm receipt. Thank you!`;

        const encodedMessage = encodeURIComponent(message);
        const phoneNumber = '2348012345678'; // Example number

        window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-0 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-blue-900">💳 Payment Details</h2>
                    <button onClick={onClose}><X className="text-gray-500 hover:text-red-500" /></button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-red-50 border-2 border-red-100 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-blue-900 mb-4">Bank Transfer Details</h3>
                        <div className="bg-white rounded-lg p-4 space-y-3 shadow-sm">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Bank Name</span>
                                <span className="font-bold">First Bank Nigeria</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Account Name</span>
                                <span className="font-bold">ShopEase Limited</span>
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

                    <button
                        onClick={handleWhatsApp}
                        className="w-full py-4 bg-[#25D366] hover:bg-[#1fb855] text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                    >
                        <MessageCircle className="w-6 h-6" />
                        Chat on WhatsApp
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
