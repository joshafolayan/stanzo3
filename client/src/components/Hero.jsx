import React from 'react';

const Hero = () => {
    return (
        <div className="py-8 md:py-12 mb-2 md:mb-4 text-center px-4">
            <h1 className="text-3xl md:text-5xl font-serif text-brand-black mb-2 md:mb-4 tracking-wide font-normal">
                Products
            </h1>
            <p className="text-brand-gray text-sm md:text-base max-w-2xl mx-auto font-light">
                Discover quality products with multiple colors and sizes to match your style
            </p>
        </div>
    );
};

export default Hero;
