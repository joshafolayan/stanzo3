import React from 'react';
import ProductCard from './ProductCard';

const ProductGrid = ({ products, loading, error }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-gray-200 h-64 md:h-96 rounded-xl"></div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12 bg-brand-sale-tint rounded-xl border border-brand-sale/20">
                <p className="text-brand-sale font-bold">Failed to load products.</p>
                <p className="text-sm text-brand-sale mt-2">Please ensure the backend server is running.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
            {products.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
};

export default ProductGrid;
