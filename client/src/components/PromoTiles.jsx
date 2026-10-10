import React from 'react';
import { Link } from 'react-router-dom';
import { Flame, Boxes, Sparkles, LayoutGrid, MessageCircle } from 'lucide-react';
import { STORE, whatsappLink } from '../config/store';

// Colourful shortcut tiles under the hero. Tiles for sections that are empty right now are left out.
const PromoTiles = ({ maxDiscount = 0, hasWholesale = false, productCount = 0 }) => {
    const tiles = [
        maxDiscount > 0 && { title: 'Deals', text: `Up to ${maxDiscount}% off`, icon: Flame, to: '/shop?filter=deals', tone: 'bg-red-50 text-red-600' },
        hasWholesale && { title: 'Wholesale', text: 'Lower prices in bulk', icon: Boxes, to: '/shop?filter=wholesale', tone: 'bg-green-50 text-green-700' },
        { title: 'New arrivals', text: 'Fresh in store', icon: Sparkles, to: '/shop?filter=new', tone: 'bg-amber-50 text-amber-600' },
        { title: 'Shop all', text: productCount > 0 ? `${productCount} products` : 'Browse everything', icon: LayoutGrid, to: '/shop', tone: 'bg-blue-50 text-blue-600' },
        STORE.whatsapp && { title: 'Order on WhatsApp', text: 'Chat to buy', icon: MessageCircle, href: whatsappLink('Hello! I would like to place an order.'), tone: 'bg-emerald-50 text-emerald-600' },
    ].filter(Boolean);

    const tileClass = "group shrink-0 w-[42%] sm:w-[30%] md:w-auto md:flex-1 snap-start flex flex-col md:flex-row items-start md:items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 hover:border-brand-black hover:shadow-md transition-all";

    const content = (tile) => (
        <>
            <span className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${tile.tone}`}>
                <tile.icon className="w-5 h-5" strokeWidth={1.75} />
            </span>
            <span className="min-w-0">
                <span className="block text-sm font-semibold text-brand-black truncate">{tile.title}</span>
                <span className="block text-xs text-brand-gray font-light truncate">{tile.text}</span>
            </span>
        </>
    );

    return (
        <nav aria-label="Shop shortcuts" className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-px-4 no-scrollbar -mx-4 px-4 py-2 mt-6 md:mt-8">
            {tiles.map(tile => tile.href ? (
                <a key={tile.title} href={tile.href} target="_blank" rel="noopener noreferrer" className={tileClass}>{content(tile)}</a>
            ) : (
                <Link key={tile.title} to={tile.to} className={tileClass}>{content(tile)}</Link>
            ))}
        </nav>
    );
};

export default PromoTiles;
