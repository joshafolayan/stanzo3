import React, { createContext, useContext, useState } from 'react';
import { getStock, stockKey } from '../utils/stock';
import { getSalePrice, getUnitPrice, hasWholesale } from '../utils/price';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [items, setItems] = useState([]); // what was added; prices are worked out below
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);

    // Units already in the cart that draw from the same stock (same option, or same product if stock is a single number)
    const getQuantityInCart = (product, color, size, excludeCartId = null) => {
        const key = stockKey(product, color, size);
        return items
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

        const cartId = `${product._id}-${color || 'none'}-${size || 'none'}`;
        setItems(prev => {
            const existing = prev.find(item => item.cartId === cartId);
            if (existing) {
                return prev.map(item =>
                    item.cartId === cartId
                        ? { ...item, quantity: (item.quantity || 1) + 1 }
                        : item
                );
            }
            return [...prev, { ...product, cartId, originalPrice: product.price, selectedColor: color, selectedSize: size, quantity: 1 }];
        });
        return true;
    };

    const removeFromCart = (cartId) => {
        setItems(prev => prev.filter(item => item.cartId !== cartId));
    };

    // Max quantity a cart line can be set to without exceeding stock; null = unlimited
    const getMaxQuantity = (cartItem) => {
        const stock = getStock(cartItem, cartItem.selectedColor, cartItem.selectedSize);
        if (stock === null) return null;
        return Math.max(stock - getQuantityInCart(cartItem, cartItem.selectedColor, cartItem.selectedSize, cartItem.cartId), 0);
    };

    const updateQuantity = (cartId, quantity) => {
        setItems(prev => prev.map(item => {
            if (item.cartId !== cartId) return item;
            const max = getMaxQuantity(item);
            const capped = max !== null && typeof quantity === 'number' ? Math.min(quantity, max) : quantity;
            return { ...item, quantity: capped };
        }));
    };

    const clearCart = () => setItems([]);

    // Wholesale prices depend on the units of a product across all its cart lines (must match server checkout)
    const unitsOfProduct = items.reduce((acc, item) => {
        acc[item._id] = (acc[item._id] || 0) + (Number(item.quantity) || 0);
        return acc;
    }, {});
    const cart = items.map(item => {
        const product = { ...item, price: item.originalPrice };
        const price = getUnitPrice(product, unitsOfProduct[item._id]);
        const isWholesale = price < getSalePrice(product);
        // Not at the wholesale quantity yet: tell the customer what it would take
        const wholesaleOffer = !isWholesale && hasWholesale(product)
            ? { price: product.wholesalePrice, minQty: product.wholesaleMinQty }
            : null;
        return { ...item, price, isWholesale, wholesaleOffer };
    });

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
