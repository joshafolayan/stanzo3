import React from 'react';
import { useCart } from '../context/CartContext';
import { X, Trash2, ShoppingBag } from 'lucide-react';
import clsx from 'clsx';

const CartModal = ({ onCheckout }) => {
    const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, getMaxQuantity, cartTotal } = useCart();

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
                <div className="p-4 border-b border-brand-line flex justify-between items-center bg-brand-ivory">
                    <h2 className="text-xl font-serif text-brand-black">
                        Your Cart
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
                            <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-brand-line" strokeWidth={1.25} />
                            <p className="text-lg mb-6">Your cart is empty</p>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="px-6 py-2 bg-brand-black text-white rounded-lg hover:bg-brand-charcoal transition"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    ) : (
                        cart.map((item) => {
                            const maxQty = getMaxQuantity(item); // null = unlimited
                            const atMax = maxQty !== null && (item.quantity || 1) >= maxQty;
                            return (
                            <div key={item.cartId} className="flex gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <img
                                    src={item.images && item.images.length > 0 ? item.images[0] : (item.image || '/placeholder.jpg')}
                                    alt={item.name}
                                    className="w-20 h-20 object-cover rounded-md bg-gray-200"
                                    onError={(e) => {
                                        e.target.src = '/placeholder.jpg';
                                    }}
                                />
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-800">{item.name}</h3>
                                    <p className="text-sm text-gray-500">
                                        {item.selectedColor && <span>{item.selectedColor}</span>}
                                        {item.selectedColor && item.selectedSize && <span> | </span>}
                                        {item.selectedSize && <span>{item.selectedSize}</span>}
                                    </p>
                                    <div className="mt-2 flex justify-between items-center gap-2">
                                        {/* Quantity stepper */}
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => {
                                                    if ((item.quantity || 1) <= 1) {
                                                        removeFromCart(item.cartId);
                                                    } else {
                                                        updateQuantity(item.cartId, (item.quantity || 1) - 1);
                                                    }
                                                }}
                                                className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-brand-sale-tint hover:border-brand-sale hover:text-brand-sale transition-colors font-bold text-lg leading-none"
                                            >
                                                −
                                            </button>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity === '' ? '' : (item.quantity || 1)}
                                                onChange={(e) => {
                                                    const valStr = e.target.value;
                                                    if (valStr === '') {
                                                        // Allow temporary empty field while typing
                                                        updateQuantity(item.cartId, '');
                                                    } else {
                                                        const val = parseInt(valStr, 10);
                                                        if (val === 0) {
                                                            removeFromCart(item.cartId);
                                                        } else if (val > 0) {
                                                            updateQuantity(item.cartId, val);
                                                        }
                                                    }
                                                }}
                                                onBlur={(e) => {
                                                    // Revert back to 1 if left explicitly empty or invalid
                                                    if (item.quantity === '' || item.quantity < 1) {
                                                        updateQuantity(item.cartId, 1);
                                                    }
                                                }}
                                                className="w-12 text-center font-semibold text-gray-800 text-sm border border-gray-300 rounded-md py-0.5 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                                            />
                                            <button
                                                onClick={() => updateQuantity(item.cartId, (item.quantity || 1) + 1)}
                                                disabled={atMax}
                                                title={atMax ? 'No more in stock' : undefined}
                                                className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-brand-ivory hover:border-brand-accent hover:text-brand-accent transition-colors font-bold text-lg leading-none disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-gray-300 disabled:hover:text-gray-600 disabled:cursor-not-allowed"
                                            >
                                                +
                                            </button>
                                            {atMax && <span className="text-[10px] text-brand-sale ml-1">Max</span>}
                                        </div>

                                        {/* Price + remove */}
                                        <div className="flex items-center gap-2">
                                            <div className="text-right">
                                                <span className="font-bold text-brand-black text-sm">
                                                    ₦{(item.price * (item.quantity || 1)).toLocaleString()}
                                                </span>
                                                {(item.quantity || 1) > 1 && (
                                                    <p className="text-xs text-gray-400">
                                                        ₦{item.price.toLocaleString()} each
                                                    </p>
                                                )}
                                                {item.isWholesale && (
                                                    <p className="text-[10px] font-semibold text-brand-accent">Wholesale price</p>
                                                )}
                                                {item.wholesaleOffer && (
                                                    <p className="text-[10px] text-gray-500">₦{item.wholesaleOffer.price.toLocaleString()} each for {item.wholesaleOffer.minQty}+</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.cartId)}
                                                className="text-gray-300 hover:text-brand-sale transition-colors"
                                                title="Remove item"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            );
                        })
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
                            className="w-full py-3.5 bg-brand-black text-white text-sm uppercase tracking-widest font-medium hover:bg-brand-charcoal transition-colors"
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
