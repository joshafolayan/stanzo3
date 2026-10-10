import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { getImageUrl } from '../utils/image';

const SLIDE_MS = 6000;
const buttonClass = "inline-flex items-center gap-2 bg-white text-brand-black px-6 py-3 text-xs md:text-sm uppercase tracking-widest font-medium hover:bg-gray-100 transition-colors";

// Paths on this site use the router; https links open in a new tab (the server only allows these two)
const BannerButton = ({ banner }) => {
    if (!banner.buttonText || !banner.buttonLink) return null;
    const content = <>{banner.buttonText} <ArrowRight className="w-4 h-4" /></>;
    if (banner.buttonLink.startsWith('/')) {
        return <Link to={banner.buttonLink} className={buttonClass}>{content}</Link>;
    }
    if (/^https:\/\//i.test(banner.buttonLink)) {
        return <a href={banner.buttonLink} target="_blank" rel="noopener noreferrer" className={buttonClass}>{content}</a>;
    }
    return null;
};

// Homepage hero built from the banners set up in admin
const BannerSlider = ({ banners }) => {
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const count = banners.length;
    const current = index % count;

    useEffect(() => {
        if (count < 2 || paused) return;
        const timer = setInterval(() => setIndex(i => (i + 1) % count), SLIDE_MS);
        return () => clearInterval(timer);
    }, [count, paused]);

    const go = (step) => setIndex((current + step + count) % count);

    return (
        <section
            aria-roledescription="carousel"
            aria-label="Featured"
            className="relative overflow-hidden rounded-2xl bg-brand-charcoal text-white mt-4 md:mt-8 h-[420px] md:h-[480px]"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
        >
            {banners.map((banner, i) => {
                const Heading = i === 0 ? 'h1' : 'h2';
                const isCurrent = i === current;
                return (
                    <div
                        key={banner._id}
                        aria-roledescription="slide"
                        aria-label={`${i + 1} of ${count}`}
                        inert={!isCurrent}
                        className={clsx("absolute inset-0 transition-opacity duration-700", isCurrent ? "opacity-100" : "opacity-0")}
                    >
                        <img
                            src={getImageUrl(banner.image)}
                            alt=""
                            loading={i === 0 ? 'eager' : 'lazy'}
                            className="absolute inset-0 h-full w-full object-cover"
                        />
                        {/* Keeps the text readable on any photo */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/20 md:to-transparent" />
                        <div className="relative h-full flex flex-col justify-center px-6 md:px-12 max-w-xl">
                            {banner.eyebrow && (
                                <p className="text-[10px] md:text-xs uppercase tracking-[0.25em] text-pink-400 font-medium mb-4">{banner.eyebrow}</p>
                            )}
                            <Heading className="text-3xl md:text-5xl font-serif leading-tight mb-4">{banner.title}</Heading>
                            {banner.subtitle && (
                                <p className="text-gray-200 text-sm md:text-base font-light mb-8">{banner.subtitle}</p>
                            )}
                            <div><BannerButton banner={banner} /></div>
                        </div>
                    </div>
                );
            })}

            {count > 1 && (
                <>
                    <div className="hidden md:flex absolute bottom-4 right-4 gap-2">
                        <button onClick={() => go(-1)} aria-label="Previous banner" className="p-2 rounded-full bg-white/20 hover:bg-white/40 transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button onClick={() => go(1)} aria-label="Next banner" className="p-2 rounded-full bg-white/20 hover:bg-white/40 transition-colors">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="absolute bottom-5 left-6 md:left-12 flex gap-2">
                        {banners.map((banner, i) => (
                            <button
                                key={banner._id}
                                onClick={() => setIndex(i)}
                                aria-label={`Show banner ${i + 1}`}
                                aria-current={i === current}
                                className={clsx("h-1.5 rounded-full transition-all", i === current ? "w-8 bg-white" : "w-4 bg-white/50 hover:bg-white/80")}
                            />
                        ))}
                    </div>
                </>
            )}
        </section>
    );
};

export default BannerSlider;
