import React from 'react';
import { ShoppingBag } from 'lucide-react';

const Logo = ({ className = '', dark = false }) => {
    return (
        <div className={`flex items-center justify-center gap-2.5 group cursor-pointer ${className}`}>
            <div className={`
                relative flex items-center justify-center 
                w-10 h-10 md:w-11 md:h-11 rounded-full 
                ${dark ? 'bg-white text-brand-black' : 'bg-brand-black text-white'} 
                transition-all duration-500 ease-out
                group-hover:scale-105 group-hover:rotate-3
                shadow-sm
            `}>
                <ShoppingBag className="w-5 h-5 md:w-5 md:h-5" strokeWidth={1.5} />
                <div className={`
                    absolute bottom-0 right-0 
                    w-2.5 h-2.5 md:w-3 md:h-3 rounded-full 
                    bg-pink-600 
                    border-2 ${dark ? 'border-white' : 'border-brand-black'}
                    transition-transform duration-500 ease-out group-hover:scale-110
                `}></div>
            </div>

            <div className="flex flex-col items-start justify-center">
                <span className={`
                    text-xl md:text-2xl font-serif font-bold tracking-wide leading-none
                    ${dark ? 'text-white' : 'text-brand-black'}
                `}>
                    All Round
                </span>
                <span className={`
                    text-[10px] md:text-[11px] tracking-[0.35em] font-medium uppercase mt-0.5
                    ${dark ? 'text-gray-400' : 'text-brand-gray'}
                `}>
                    Stores
                </span>
            </div>
        </div>
    );
};

export default Logo;
