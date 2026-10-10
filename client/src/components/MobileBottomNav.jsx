import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Store, Search, Heart, ShoppingCart, User, X } from 'lucide-react';
import clsx from 'clsx';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

const STAFF_ROLES = ['admin', 'manager', 'salesrep', 'superadmin'];

const Badge = ({ count, className }) => count > 0 && (
    <span className={clsx("absolute -top-1.5 left-1/2 ml-1.5 min-w-4 h-4 px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center", className)}>
        {count > 9 ? '9+' : count}
    </span>
);

// App-style tab bar fixed to the bottom of the screen on phones (hidden from tablet width up and in admin)
const MobileBottomNav = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { cart, setIsCartOpen } = useCart();
    const { wishlistIds } = useWishlist();
    const { user } = useAuth();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [query, setQuery] = useState('');

    if (location.pathname.startsWith('/admin')) return null;

    const accountLink = user ? (STAFF_ROLES.includes(user.role) ? '/admin' : '/dashboard') : '/login';
    const isAccountPage = ['/dashboard', '/login', '/register'].includes(location.pathname);
    const cartCount = cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

    const submitSearch = (e) => {
        e.preventDefault();
        const q = query.trim();
        navigate(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop');
        setIsSearchOpen(false);
    };

    const tabClass = (active) => clsx(
        "relative flex flex-1 flex-col items-center justify-center gap-0.5 h-full text-[10px] font-medium transition-colors",
        active ? "text-brand-black" : "text-gray-500"
    );
    const iconProps = (active) => ({ className: "w-5 h-5", strokeWidth: active ? 2.2 : 1.5 });

    const tabs = [
        { label: 'Home', icon: Home, to: '/', active: location.pathname === '/' },
        { label: 'Shop', icon: Store, to: '/shop', active: location.pathname === '/shop' },
    ];

    return (
        <>
            {/* Keeps the end of every page clear of the bar */}
            <div className="h-16 md:hidden" aria-hidden="true" />

            {isSearchOpen && (
                <div className="fixed inset-0 z-[55] md:hidden" role="dialog" aria-label="Search products">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setIsSearchOpen(false)} />
                    <form onSubmit={submitSearch} className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] animate-fade-in">
                        <div className="flex items-center gap-3 border-b-2 border-brand-black pb-2">
                            <Search className="w-5 h-5 text-brand-gray shrink-0" />
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search products..."
                                autoFocus
                                enterKeyHint="search"
                                className="flex-1 outline-none text-base bg-transparent"
                            />
                            <button type="button" onClick={() => setIsSearchOpen(false)} aria-label="Close search" className="text-brand-gray">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <nav
                aria-label="Shop navigation"
                className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 backdrop-blur border-t border-gray-200 pb-[env(safe-area-inset-bottom)]"
            >
                <div className="flex items-stretch h-16">
                    {tabs.map(tab => (
                        <Link key={tab.label} to={tab.to} className={tabClass(tab.active)} aria-current={tab.active ? 'page' : undefined}>
                            <tab.icon {...iconProps(tab.active)} />
                            {tab.label}
                        </Link>
                    ))}
                    <button type="button" onClick={() => setIsSearchOpen(true)} className={tabClass(isSearchOpen)}>
                        <Search {...iconProps(isSearchOpen)} />
                        Search
                    </button>
                    <Link to="/wishlist" className={tabClass(location.pathname === '/wishlist')} aria-current={location.pathname === '/wishlist' ? 'page' : undefined}>
                        <Heart {...iconProps(location.pathname === '/wishlist')} />
                        <Badge count={wishlistIds.length} className="bg-pink-600" />
                        Wishlist
                    </Link>
                    <button type="button" onClick={() => setIsCartOpen(true)} className={tabClass(false)}>
                        <ShoppingCart {...iconProps(false)} />
                        <Badge count={cartCount} className="bg-brand-black" />
                        Cart
                    </button>
                    <Link to={accountLink} className={tabClass(isAccountPage)} aria-current={isAccountPage ? 'page' : undefined}>
                        <User {...iconProps(isAccountPage)} />
                        {user ? 'Account' : 'Sign in'}
                    </Link>
                </div>
            </nav>
        </>
    );
};

export default MobileBottomNav;
