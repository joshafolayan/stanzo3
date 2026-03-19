import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    const addToCart = (product, color, size) => {
        const finalPrice = product.discountPercentage 
            ? product.price * (1 - product.discountPercentage / 100) 
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
    };

    const removeFromCart = (cartId) => {
        setCart(prev => prev.filter(item => item.cartId !== cartId));
    };

    const updateQuantity = (cartId, quantity) => {
        setCart(prev => prev.map(item =>
            item.cartId === cartId ? { ...item, quantity } : item
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
