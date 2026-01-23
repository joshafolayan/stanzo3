import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Header = () => {
    const { cart, setIsCartOpen } = useCart();

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-900 to-indigo-700 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="text-2xl font-bold tracking-wider">
                        🛍️ STANZO3
                    </div>

                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="relative p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all duration-300 group"
                    >
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5" />
                            <span className="font-medium">Cart</span>
                        </div>
                        {cart.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center animate-bounce">
                                {cart.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
