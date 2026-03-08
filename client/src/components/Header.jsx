import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, User, X, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const Header = () => {
    const { cart, setIsCartOpen } = useCart();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [currentAnnouncement, setCurrentAnnouncement] = useState(0);

    const announcements = [
        "Welcome to our store",
        "Important Delivery Notice: Lagos: 1-5 working days, Outside Lagos: 2-7 working days (from dispatch)"
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentAnnouncement((prev) => (prev + 1) % announcements.length);
        }, 5000); // Slide every 5 seconds
        return () => clearInterval(timer);
    }, [announcements.length]);

    const nextAnnouncement = () => setCurrentAnnouncement((prev) => (prev + 1) % announcements.length);
    const prevAnnouncement = () => setCurrentAnnouncement((prev) => (prev - 1 + announcements.length) % announcements.length);

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
        <>
            <header className="fixed top-0 left-0 right-0 z-50 bg-brand-white border-b border-gray-100">
                {/* Announcement Bar Slider */}
                <div className="bg-brand-black text-brand-white text-[10px] md:text-xs py-2 text-center tracking-wide font-light relative h-8 md:h-9 flex items-center justify-center">
                    <button onClick={prevAnnouncement} className="absolute left-2 md:left-4 p-1 hover:text-gray-300">
                        <ChevronLeft className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                    <div className="overflow-hidden w-full max-w-2xl px-8">
                        <p className="animate-fade-in truncate">{announcements[currentAnnouncement]}</p>
                    </div>
                    <button onClick={nextAnnouncement} className="absolute right-2 md:right-4 p-1 hover:text-gray-300">
                        <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 md:h-20">
                        {/* Mobile Menu Toggle & Desktop Links */}
                        <div className="flex-1 flex items-center">
                            <button
                                className="md:hidden text-brand-black hover:text-brand-gray"
                                onClick={() => setIsMobileMenuOpen(true)}
                            >
                                <Menu className="w-6 h-6" strokeWidth={1.5} />
                            </button>
                            <div className="hidden md:flex space-x-8 text-sm font-medium tracking-wide">
                                <a href="/" className="hover:text-brand-gray transition-colors">Home</a>
                                <a href="/shop" className="underline underline-offset-4 decoration-2">Shop All</a>
                                {/* More links would go here */}
                            </div>
                        </div>

                        {/* Logo */}
                        <div className="text-2xl md:text-3xl font-serif text-center flex-1 flex justify-center tracking-widest uppercase">
                            <a href="/">Stanzo3</a>
                        </div>

                        {/* Right Icons */}
                        <div className="flex-1 flex justify-end space-x-4 md:space-x-6 items-center">
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

            {/* Mobile Menu Overlay */}
            {
                isMobileMenuOpen && (
                    <div className="fixed inset-0 z-[60] flex md:hidden">
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-black/50 transition-opacity"
                            onClick={() => setIsMobileMenuOpen(false)}
                        ></div>

                        {/* Sliding Panel */}
                        <div className="relative w-4/5 max-w-sm bg-white h-full shadow-xl flex flex-col pt-5 pb-4 overflow-y-auto animate-slide-in-right">
                            <div className="px-4 flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                                <span className="text-xl font-serif uppercase tracking-widest">Menu</span>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-gray-500 hover:text-gray-900"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex-1 px-4 flex flex-col space-y-6">
                                <a href="/" className="block text-lg font-medium text-gray-900 hover:text-gray-600 transition-colors">Home</a>
                                <a href="/shop" className="block text-lg font-medium text-gray-900 hover:text-gray-600 transition-colors">Shop All</a>

                                {/* Categories */}
                                <div className="pt-2 pb-2 pl-4 border-l-2 border-brand-black space-y-4">
                                    <a href="/?q=Bags" onClick={() => setIsMobileMenuOpen(false)} className="block text-base font-medium text-gray-700 hover:text-brand-black transition-colors">Bags</a>
                                    <a href="/?q=Shoes" onClick={() => setIsMobileMenuOpen(false)} className="block text-base font-medium text-gray-700 hover:text-brand-black transition-colors">Shoes</a>
                                </div>

                                <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block text-lg font-medium text-gray-900 hover:text-gray-600 transition-colors flex items-center gap-2 pt-4 border-t border-gray-100">
                                    <User className="w-5 h-5" /> Admin Portal
                                </Link>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
};

export default Header;
