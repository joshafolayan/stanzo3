import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { STORE, whatsappLink } from '../config/store';

// Shortcut links under the hero, in the same panel style as the TrustStrip.
// Tiles for sections that are empty right now are left out.
const PromoTiles = ({ maxDiscount = 0, hasWholesale = false, productCount = 0 }) => {
    const tiles = [
        maxDiscount > 0 && { label: 'Deals', line: `Up to ${maxDiscount}% off`, to: '/shop?filter=deals' },
        hasWholesale && { label: 'Wholesale', line: 'Save when you buy in bulk', to: '/shop?filter=wholesale' },
        { label: 'New arrivals', line: 'Just in', to: '/shop?filter=new' },
        { label: 'Shop all', line: productCount > 0 ? `${productCount} products` : 'Browse everything', to: '/shop' },
        STORE.whatsapp && { label: 'WhatsApp', line: 'Order by chat', href: whatsappLink('Hello! I would like to place an order.') },
    ].filter(Boolean);

    // On phones the tiles sit two to a row; an odd one out takes the full width
    const tileClass = "group bg-white flex flex-col justify-between gap-5 p-5 md:p-6 md:flex-1 [&:last-child:nth-child(odd)]:col-span-2 hover:bg-brand-black transition-colors duration-300";

    const content = (tile) => (
        <>
            <span className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-medium text-brand-gray group-hover:text-gray-400 transition-colors">
                {tile.label}
            </span>
            <span className="flex items-end justify-between gap-3">
                <span className="font-serif text-lg md:text-xl leading-snug text-brand-black group-hover:text-white transition-colors">{tile.line}</span>
                <ArrowRight className="w-4 h-4 shrink-0 mb-1 text-brand-black group-hover:text-white group-hover:translate-x-1 transition-all" strokeWidth={1.5} />
            </span>
        </>
    );

    return (
        <nav aria-label="Shop shortcuts" className="mt-6 md:mt-8 grid grid-cols-2 md:flex gap-px bg-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
            {tiles.map(tile => tile.href ? (
                <a key={tile.label} href={tile.href} target="_blank" rel="noopener noreferrer" className={tileClass}>{content(tile)}</a>
            ) : (
                <Link key={tile.label} to={tile.to} className={tileClass}>{content(tile)}</Link>
            ))}
        </nav>
    );
};

export default PromoTiles;
