import React from 'react';
import { useCart } from '../context/CartContext';
import { X, Trash2 } from 'lucide-react';
import clsx from 'clsx';

const CartModal = ({ onCheckout }) => {
    const { cart, isCartOpen, setIsCartOpen, removeFromCart, cartTotal } = useCart();

    if (!isCartOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={() => setIsCartOpen(false)}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                        🛒 Your Cart
                    </h2>
                    <button
                        onClick={() => setIsCartOpen(false)}
                        className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cart.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <span className="text-6xl block mb-4">🛒</span>
                            <p className="text-lg">Your cart is empty</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.cartId} className="flex gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <img
                                    src={item.image.startsWith('/') ? item.image : item.image}
                                    alt={item.name}
                                    className="w-20 h-20 object-cover rounded-md bg-gray-200"
                                />
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-800">{item.name}</h3>
                                    <p className="text-sm text-gray-500">
                                        {item.selectedColor} | {item.selectedSize}
                                    </p>
                                    <div className="mt-2 flex justify-between items-center">
                                        <span className="font-bold text-red-500">
                                            ₦{item.price.toLocaleString()}
                                        </span>
                                        <button
                                            onClick={() => removeFromCart(item.cartId)}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {cart.length > 0 && (
                    <div className="p-4 border-t bg-gray-50">
                        <div className="flex justify-between items-center mb-4 text-lg font-bold">
                            <span>Total:</span>
                            <span>₦{cartTotal.toLocaleString()}</span>
                        </div>
                        <button
                            onClick={() => {
                                setIsCartOpen(false);
                                onCheckout();
                            }}
                            className="w-full py-3 bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-lg font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                        >
                            Proceed to Checkout
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartModal;
