import React, { useEffect, useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Hero from '../components/Hero';
import ProductGrid from '../components/ProductGrid';
import ProductRow from '../components/ProductRow';
import TrustStrip from '../components/TrustStrip';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';
import { isSoldOut } from '../utils/stock';

const ROW_SIZE = 12;

const FILTERS = {
    deals: { title: 'Deals', subtitle: 'Discounted while stock lasts' },
    new: { title: 'New Arrivals', subtitle: 'The latest additions to the store' },
};

const isDeal = (product) => product.discountPercentage > 0;
const newestFirst = (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0);

const StoreFront = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchParams] = useSearchParams();
    const location = useLocation();
    const searchQuery = searchParams.get('q') || '';
    const filter = FILTERS[searchParams.get('filter')] ? searchParams.get('filter') : null;
    const isHome = location.pathname === '/' && !searchQuery && !filter;

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get('/api/products');
                setProducts(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch products:', err);
                setError('Failed to load products');
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const searchedProducts = products.filter(product => {
        if (!searchQuery) return true;
        const lowerQuery = searchQuery.toLowerCase();

        // Enhance category matching: check if the query matches the start of the category string
        // Ex: `?q=shoe` will match `Shoes`
        if (product.category && product.category.toLowerCase().includes(lowerQuery)) {
            return true;
        }

        // Fallback to searching name or description
        return (
            product.name.toLowerCase().includes(lowerQuery) ||
            (product.description && product.description.toLowerCase().includes(lowerQuery))
        );
    });

    let filteredProducts = searchedProducts;
    if (filter === 'deals') filteredProducts = searchedProducts.filter(isDeal);
    if (filter === 'new') filteredProducts = [...searchedProducts].sort(newestFirst);

    // Homepage rows only show what can be bought right now
    const inStock = products.filter(product => !isSoldOut(product));
    const deals = inStock.filter(isDeal).slice(0, ROW_SIZE);
    const newArrivals = [...inStock].sort(newestFirst).slice(0, ROW_SIZE);

    let heading = { title: 'All products', subtitle: null };
    if (filter) heading = FILTERS[filter];
    if (searchQuery) heading = { title: `Search results for: "${searchQuery}"`, subtitle: null };

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            <Header />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20 w-full">
                {isHome && (
                    <>
                        <Hero featured={deals.length > 0 ? deals : newArrivals} hasDeals={deals.length > 0} />
                        <ProductRow title={FILTERS.deals.title} subtitle={FILTERS.deals.subtitle} seeAllTo="/shop?filter=deals" products={deals} />
                        <ProductRow title={FILTERS.new.title} subtitle={FILTERS.new.subtitle} seeAllTo="/shop?filter=new" products={newArrivals} />
                        <TrustStrip />
                    </>
                )}

                <div className={isHome ? 'mt-12 md:mt-16 mb-6' : 'mb-8 pt-8 border-b pb-4'}>
                    <h2 className="text-2xl md:text-3xl font-serif text-brand-black">{heading.title}</h2>
                    {!isHome && !loading && !error && (
                        <p className="text-brand-gray mt-2">
                            {heading.subtitle ? `${heading.subtitle} · ` : ''}{filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                        </p>
                    )}
                </div>

                <ProductGrid products={filteredProducts} loading={loading} error={error} />

                {!isHome && !loading && !error && filteredProducts.length === 0 && (
                    <p className="text-center text-brand-gray py-12">Nothing here right now. Check back soon.</p>
                )}
            </main>

            <Footer />
            <WhatsAppButton />
        </div>
    );
};

export default StoreFront;
