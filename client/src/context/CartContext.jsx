import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);

    // Units of a product already in the cart, across all colour/size variants
    const getQuantityInCart = (productId, excludeCartId = null) => cart
        .filter(item => item._id === productId && item.cartId !== excludeCartId)
        .reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

    // How many more units can be added; null = stock not tracked (unlimited)
    const getRemainingStock = (product) => {
        if (product.stockQuantity === null || product.stockQuantity === undefined) return null;
        return Math.max(product.stockQuantity - getQuantityInCart(product._id), 0);
    };

    const addToCart = (product, color, size) => {
        const remaining = getRemainingStock(product);
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
        if (cartItem.stockQuantity === null || cartItem.stockQuantity === undefined) return null;
        return Math.max(cartItem.stockQuantity - getQuantityInCart(cartItem._id, cartItem.cartId), 0);
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
