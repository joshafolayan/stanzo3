import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';

// A titled, sideways-scrolling shelf of products for the homepage
const ProductRow = ({ title, subtitle, seeAllTo, products }) => {
    const scroller = useRef(null);

    if (products.length === 0) return null;

    const scroll = (direction) => {
        const el = scroller.current;
        if (el) el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' });
    };

    return (
        <section className="mt-12 md:mt-16">
            <div className="flex items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-serif text-brand-black">{title}</h2>
                    {subtitle && <p className="text-brand-gray text-sm mt-1 font-light">{subtitle}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {seeAllTo && (
                        <Link to={seeAllTo} className="text-xs md:text-sm font-medium underline underline-offset-4 hover:text-brand-gray transition-colors mr-2">
                            See all
                        </Link>
                    )}
                    <button onClick={() => scroll(-1)} aria-label={`Scroll ${title} left`} className="hidden md:flex p-2 border border-gray-200 rounded-full hover:border-brand-black transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => scroll(1)} aria-label={`Scroll ${title} right`} className="hidden md:flex p-2 border border-gray-200 rounded-full hover:border-brand-black transition-colors">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Side padding leaves room for the card's hover pop, which would otherwise be clipped */}
            <div ref={scroller} className="flex gap-3 md:gap-6 overflow-x-auto snap-x snap-mandatory scroll-px-4 no-scrollbar -mx-4 px-4 py-6">
                {products.map(product => (
                    <div key={product.id} className="snap-start shrink-0 w-[46%] sm:w-[31%] lg:w-[23%]">
                        <ProductCard product={product} />
                    </div>
                ))}
            </div>
        </section>
    );
};

export default ProductRow;
