import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';

const AUTO_SCROLL_MS = 3500;
const RESUME_AFTER_TOUCH_MS = 5000;

// A titled, sideways-scrolling shelf of products for the homepage.
// It moves on one product at a time by itself, pausing while the shopper hovers, touches or tabs into it.
const ProductRow = ({ title, subtitle, seeAllTo, products }) => {
    const scroller = useRef(null);
    const paused = useRef(false);
    const resumeTimer = useRef(null);

    useEffect(() => {
        if (products.length === 0) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const timer = setInterval(() => {
            const el = scroller.current;
            if (!el || paused.current || document.hidden) return;
            if (el.scrollWidth <= el.clientWidth) return; // everything already fits
            const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
            if (atEnd) {
                el.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                const card = el.firstElementChild;
                const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
                el.scrollBy({ left: card ? card.getBoundingClientRect().width + gap : el.clientWidth / 2, behavior: 'smooth' });
            }
        }, AUTO_SCROLL_MS);

        return () => {
            clearInterval(timer);
            clearTimeout(resumeTimer.current);
        };
    }, [products.length]);

    if (products.length === 0) return null;

    const pause = () => {
        clearTimeout(resumeTimer.current);
        paused.current = true;
    };
    const resume = (delay = 0) => {
        clearTimeout(resumeTimer.current);
        resumeTimer.current = setTimeout(() => { paused.current = false; }, delay);
    };

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
            <div
                ref={scroller}
                onMouseEnter={pause}
                onMouseLeave={() => resume()}
                onTouchStart={pause}
                onTouchEnd={() => resume(RESUME_AFTER_TOUCH_MS)}
                onFocus={pause}
                onBlur={() => resume()}
                className="flex gap-3 md:gap-6 overflow-x-auto snap-x snap-mandatory scroll-px-4 no-scrollbar -mx-4 px-4 py-6"
            >
                {products.map(product => (
                    <div key={product.id} className="flex snap-start shrink-0 w-[46%] sm:w-[31%] lg:w-[23%]">
                        <ProductCard product={product} compact />
                    </div>
                ))}
            </div>
        </section>
    );
};

export default ProductRow;
