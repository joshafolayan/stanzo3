import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getImageUrl } from '../utils/image';

// `featured` are the products whose photos fill the collage on the right
const Hero = ({ featured = [], hasDeals = false }) => {
    const photos = featured
        .map(product => ({ id: product.id, name: product.name, src: getImageUrl(product.images?.[0] || product.image) }))
        .slice(0, 3);

    return (
        <section className="relative overflow-hidden rounded-2xl bg-brand-charcoal text-white mt-4 md:mt-8">
            <div className="grid md:grid-cols-2 gap-8 items-center px-6 py-10 md:px-12 md:py-16">
                <div>
                    <p className="text-[10px] md:text-xs uppercase tracking-[0.25em] text-pink-400 font-medium mb-4">
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
                </div>

                {photos.length > 0 && (
                    <div className="hidden md:grid grid-cols-2 grid-rows-2 gap-4 h-80 lg:h-96">
                        {photos.map((photo, idx) => (
                            <Link
                                key={photo.id}
                                to={`/product/${photo.id}`}
                                className={`overflow-hidden rounded-xl bg-white/5 ${idx === 0 ? 'row-span-2' : ''} ${photos.length === 1 ? 'col-span-2' : ''} ${photos.length === 2 && idx === 1 ? 'row-span-2' : ''}`}
                            >
                                <img src={photo.src} alt={photo.name} className="h-full w-full object-cover hover:scale-105 transition-transform duration-500" />
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default Hero;
