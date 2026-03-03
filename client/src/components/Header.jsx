import React, { useState } from 'react';
import { ShoppingCart, Search, User, X } from 'lucide-react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const Header = () => {
    const { cart, setIsCartOpen } = useCart();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
            setIsSearchOpen(false);
        } else {
            navigate('/');
            setIsSearchOpen(false);
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-brand-white border-b border-gray-100">
            {/* Announcement Bar */}
            <div className="bg-brand-black text-brand-white text-xs py-2 text-center tracking-wide font-light">
                Important Delivery Notice: Lagos: 1-5 working days, Outside Lagos: 2-7 working days (from dispatch)
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <div className="flex-1 hidden md:flex space-x-8 text-sm font-medium tracking-wide">
                        <a href="/" className="hover:text-brand-gray transition-colors">Home</a>
                        <a href="/shop" className="underline underline-offset-4 decoration-2">Shop All</a>
                        {/* More links would go here */}
                    </div>

                    <div className="text-3xl font-serif text-center flex-1 flex justify-center tracking-widest uppercase">
                        <a href="/">Stanzo3</a>
                    </div>

                    <div className="flex-1 flex justify-end space-x-6 items-center">
                        {isSearchOpen ? (
                            <form onSubmit={handleSearchSubmit} className="flex items-center relative animate-fade-in">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search products..."
                                    className="border-b border-brand-black bg-transparent outline-none text-sm w-40 md:w-64 pb-1 pr-6"
                                    autoFocus
                                />
                                <button type="button" onClick={() => setIsSearchOpen(false)} className="absolute right-0 text-brand-gray hover:text-brand-black pb-1">
                                    <X className="w-4 h-4" />
                                </button>
                            </form>
                        ) : (
                            <button onClick={() => setIsSearchOpen(true)} className="hover:text-brand-gray transition-colors">
                                <Search className="w-5 h-5" strokeWidth={1.5} />
                            </button>
                        )}

                        <Link to="/admin" className="hidden md:block hover:text-brand-gray transition-colors">
                            <User className="w-5 h-5" strokeWidth={1.5} />
                        </Link>

                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="relative text-brand-black hover:text-brand-gray transition-colors group flex items-center"
                        >
                            <ShoppingCart className="w-5 h-5" strokeWidth={1.5} />
                            {cart.length > 0 && (
                                <span className="absolute -top-1.5 -right-2 bg-brand-black text-brand-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                    {cart.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
