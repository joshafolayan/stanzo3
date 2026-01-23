import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    const addToCart = (product, color, size) => {
        setCart(prev => [
            ...prev,
            { ...product, selectedColor: color, selectedSize: size, cartId: Date.now() }
        ]);
    };

    const removeFromCart = (cartId) => {
        setCart(prev => prev.filter(item => item.cartId !== cartId));
    };

    const clearCart = () => setCart([]);

    const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            clearCart,
            isCartOpen,
            setIsCartOpen,
            cartTotal
        }}>
            {children}
        </CartContext.Provider>
    );
};
