import React from 'react';
import { Link } from 'react-router-dom';
import { getImageUrl } from '../utils/image';

// "Shop by category" - a swipeable row of photo tiles
const CategoryTiles = ({ categories }) => {
    // A single tile isn't much of a choice
    if (categories.length < 2) return null;

    return (
        <section className="mt-12 md:mt-16">
            <h2 className="text-2xl md:text-3xl font-serif text-brand-black">Shop by category</h2>
            <p className="text-brand-gray text-sm mt-1 font-light">All your essentials in one place</p>

            <div className="flex gap-3 md:gap-5 overflow-x-auto snap-x snap-mandatory scroll-px-4 no-scrollbar -mx-4 px-4 py-6">
                {categories.map(category => (
                    <Link key={category.name} to={`/shop?category=${encodeURIComponent(category.name)}`} className="group snap-start shrink-0 w-[38%] sm:w-[24%] lg:w-[16%]">
                        <div className="aspect-square overflow-hidden rounded-2xl bg-gray-100">
                            {category.image && (
                                <img
                                    src={getImageUrl(category.image)}
                                    alt=""
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            )}
                        </div>
                        <p className="mt-3 text-sm md:text-base font-medium text-brand-black truncate">{category.name}</p>
                        <p className="text-xs text-brand-gray font-light">{category.productCount} {category.productCount === 1 ? 'product' : 'products'}</p>
                    </Link>
                ))}
            </div>
        </section>
    );
};

export default CategoryTiles;
