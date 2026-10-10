import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getImageUrl } from '../utils/image';
import BannerSlider from './BannerSlider';

const SET_SIZE = 3;
const MAX_PHOTOS = 9;
const ROTATE_MS = 5000;

// Shows the admin's banners when there are any; otherwise a standard welcome banner whose
// photo collage rotates through `featured` products, three at a time
const Hero = ({ banners = [], featured = [], hasDeals = false }) => {
    const [setIndex, setSetIndex] = useState(0);
    const [paused, setPaused] = useState(false);

    const photos = featured
        .filter(product => product.images?.[0] || product.image)
        .slice(0, MAX_PHOTOS)
        .map(product => ({ id: product.id, name: product.name, src: getImageUrl(product.images?.[0] || product.image) }));
    // Full sets of three only, so the collage never shows a gap (unless there are fewer than three photos in total)
    const sets = [];
    for (let i = 0; i + SET_SIZE <= photos.length; i += SET_SIZE) sets.push(photos.slice(i, i + SET_SIZE));
    if (sets.length === 0 && photos.length > 0) sets.push(photos);
    const current = sets.length > 0 ? setIndex % sets.length : 0;

    useEffect(() => {
        if (banners.length > 0 || sets.length < 2 || paused) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const timer = setInterval(() => setSetIndex(i => i + 1), ROTATE_MS);
        return () => clearInterval(timer);
    }, [banners.length, sets.length, paused]);

    if (banners.length > 0) return <BannerSlider banners={banners} />;

    // All sets are stacked on top of each other and cross-fade; `layout` picks the desktop collage or the phone strip
    const collage = (layout) => sets.map((set, i) => (
        <div
            key={i}
            inert={i !== current}
            className={clsx(
                "absolute inset-0 grid gap-2 md:gap-4 transition-opacity duration-700",
                layout === 'desktop' ? "grid-cols-2 grid-rows-2" : "grid-cols-3",
                i === current ? "opacity-100" : "opacity-0"
            )}
        >
            {set.map((photo, idx) => (
                <Link
                    key={photo.id}
                    to={`/product/${photo.id}`}
                    className={clsx(
                        "overflow-hidden rounded-xl bg-white/5",
                        layout === 'desktop' && idx === 0 && "row-span-2",
                        layout === 'desktop' && set.length === 1 && "col-span-2",
                        layout === 'desktop' && set.length === 2 && idx === 1 && "row-span-2"
                    )}
                >
                    <img src={photo.src} alt={photo.name} className="h-full w-full object-cover hover:scale-105 transition-transform duration-500" />
                </Link>
            ))}
        </div>
    ));

    const dots = sets.length > 1 && (
        <div className="flex gap-2 mt-4">
            {sets.map((_, i) => (
                <button
                    key={i}
                    onClick={() => setSetIndex(i)}
                    aria-label={`Show photo set ${i + 1}`}
                    aria-current={i === current}
                    className={clsx("h-1.5 rounded-full transition-all", i === current ? "w-8 bg-white" : "w-4 bg-white/40 hover:bg-white/70")}
                />
            ))}
        </div>
    );

    return (
        <section
            className="relative overflow-hidden rounded-2xl bg-brand-charcoal text-white mt-4 md:mt-8"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <div className="grid md:grid-cols-2 gap-8 items-center px-6 py-10 md:px-12 md:py-16">
                <div>
                    <p className="text-[10px] md:text-xs uppercase tracking-[0.25em] text-brand-accent-light font-medium mb-4">
                        Delivery across Nigeria · Store pickup
                    </p>
                    <h1 className="text-3xl md:text-5xl font-serif leading-tight mb-4">
                        Everything you need, all in one place
                    </h1>
                    <p className="text-gray-300 text-sm md:text-base font-light max-w-md mb-8">
                        Shop bags, shoes and more in the colours and sizes you want. Order online, pay by bank transfer and we'll get it to you.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            to="/shop"
                            className="inline-flex items-center gap-2 bg-white text-brand-black px-6 py-3 text-xs md:text-sm uppercase tracking-widest font-medium hover:bg-gray-100 transition-colors"
                        >
                            Start shopping <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                            to={hasDeals ? '/shop?filter=deals' : '/shop?filter=new'}
                            className="inline-flex items-center border border-white/40 px-6 py-3 text-xs md:text-sm uppercase tracking-widest font-medium hover:border-white transition-colors"
                        >
                            {hasDeals ? 'View deals' : 'New arrivals'}
                        </Link>
                    </div>

                    {/* Phones: the photos as a strip under the buttons */}
                    {sets.length > 0 && (
                        <div className="md:hidden mt-8">
                            <div className="relative h-28 sm:h-40">{collage('phone')}</div>
                            {dots}
                        </div>
                    )}
                </div>

                {sets.length > 0 && (
                    <div className="hidden md:block">
                        <div className="relative h-80 lg:h-96">{collage('desktop')}</div>
                        {dots}
                    </div>
                )}
            </div>
        </section>
    );
};

export default Hero;
