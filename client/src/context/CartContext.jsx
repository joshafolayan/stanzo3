import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    const addToCart = (product, color, size) => {
        setCart(prev => {
            const existing = prev.find(
                item => item._id === product._id && item.selectedSize === size && item.selectedColor === color
            );
            if (existing) {
                return prev.map(item =>
                    item._id === product._id && item.selectedSize === size && item.selectedColor === color
                        ? { ...item, quantity: (item.quantity || 1) + 1 }
                        : item
                );
            }
            return [...prev, { ...product, selectedColor: color, selectedSize: size, quantity: 1 }];
        });
    };

    const removeFromCart = (id, size, color) => {
        setCart(prev => prev.filter(
            item => !(item._id === id && item.selectedSize === size && item.selectedColor === color)
        ));
    };

    const updateQuantity = (id, size, color, quantity) => {
        setCart(prev => prev.map(item =>
            item._id === id && item.selectedSize === size && item.selectedColor === color
                ? { ...item, quantity }
                : item
        ));
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
            clearCart,
            isCartOpen,
            setIsCartOpen,
            cartTotal,
            getCartTotal
        }}>
            {children}
        </CartContext.Provider>
    );
};
