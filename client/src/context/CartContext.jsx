import React, { createContext, useContext, useState } from 'react';
import { getStock, stockKey } from '../utils/stock';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);

    // Units already in the cart that draw from the same stock (same option, or same product if stock is a single number)
    const getQuantityInCart = (product, color, size, excludeCartId = null) => {
        const key = stockKey(product, color, size);
        return cart
            .filter(item => item.cartId !== excludeCartId && stockKey(item, item.selectedColor, item.selectedSize) === key)
            .reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    };

    // How many more units of this option can be added; null = stock not tracked (unlimited)
    const getRemainingStock = (product, color, size) => {
        const stock = getStock(product, color, size);
        if (stock === null) return null;
        return Math.max(stock - getQuantityInCart(product, color, size), 0);
    };

    const addToCart = (product, color, size) => {
        const remaining = getRemainingStock(product, color, size);
        if (remaining !== null && remaining < 1) return false;

        // Must match the server's checkout calculation (server/routes/api.js)
        const finalPrice = product.discountPercentage
            ? Math.round(product.price * (1 - product.discountPercentage / 100) * 100) / 100
            : product.price;

        const cartId = `${product._id}-${color || 'none'}-${size || 'none'}`;
        setCart(prev => {
            const existing = prev.find(item => item.cartId === cartId);
            if (existing) {
                return prev.map(item =>
                    item.cartId === cartId
                        ? { ...item, quantity: (item.quantity || 1) + 1 }
                        : item
                );
            }
            return [...prev, { ...product, cartId, price: finalPrice, originalPrice: product.price, selectedColor: color, selectedSize: size, quantity: 1 }];
        });
        return true;
    };

    const removeFromCart = (cartId) => {
        setCart(prev => prev.filter(item => item.cartId !== cartId));
    };

    // Max quantity a cart line can be set to without exceeding stock; null = unlimited
    const getMaxQuantity = (cartItem) => {
        const stock = getStock(cartItem, cartItem.selectedColor, cartItem.selectedSize);
        if (stock === null) return null;
        return Math.max(stock - getQuantityInCart(cartItem, cartItem.selectedColor, cartItem.selectedSize, cartItem.cartId), 0);
    };

    const updateQuantity = (cartId, quantity) => {
        setCart(prev => prev.map(item => {
            if (item.cartId !== cartId) return item;
            const max = getMaxQuantity(item);
            const capped = max !== null && typeof quantity === 'number' ? Math.min(quantity, max) : quantity;
            return { ...item, quantity: capped };
        }));
    };

    const clearCart = () => setCart([]);

    const getCartTotal = () => cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

    const cartTotal = getCartTotal();

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            updateQuantity,
            getRemainingStock,
            getMaxQuantity,
            clearCart,
            isCartOpen,
            setIsCartOpen,
            isPaymentOpen,
            setIsPaymentOpen,
            cartTotal,
            getCartTotal
        }}>
            {children}
        </CartContext.Provider>
    );
};
