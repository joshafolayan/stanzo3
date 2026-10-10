import React, { useEffect, useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Hero from '../components/Hero';
import ProductGrid from '../components/ProductGrid';
import ProductRow from '../components/ProductRow';
import CategoryTiles from '../components/CategoryTiles';
import PromoTiles from '../components/PromoTiles';
import TrustStrip from '../components/TrustStrip';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';
import { isSoldOut } from '../utils/stock';
import { hasWholesale } from '../utils/price';

const ROW_SIZE = 12;

const FILTERS = {
    deals: { title: 'Deals', subtitle: 'Discounted while stock lasts' },
    new: { title: 'New Arrivals', subtitle: 'The latest additions to the store' },
    wholesale: { title: 'Wholesale', subtitle: 'Lower prices when you buy in bulk' },
};

const isDeal = (product) => product.discountPercentage > 0;
const newestFirst = (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0);

const StoreFront = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [topSellers, setTopSellers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [banners, setBanners] = useState([]);

    const [searchParams] = useSearchParams();
    const location = useLocation();
    const searchQuery = searchParams.get('q') || '';
    const filter = FILTERS[searchParams.get('filter')] ? searchParams.get('filter') : null;
    const category = searchParams.get('category') || '';
    const isHome = location.pathname === '/' && !searchQuery && !filter && !category;

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

        // Extra homepage sections - if one fails, its section just doesn't show (or falls back)
        axios.get('/api/banners')
            .then(({ data }) => setBanners(data))
            .catch(err => console.error('Failed to fetch banners:', err));
        axios.get('/api/products/top-sellers?limit=24')
            .then(({ data }) => setTopSellers(data))
            .catch(err => console.error('Failed to fetch top sellers:', err));
        axios.get('/api/categories')
            .then(({ data }) => setCategories(data))
            .catch(err => console.error('Failed to fetch categories:', err));
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
    if (category) filteredProducts = filteredProducts.filter(product => product.category?.toLowerCase() === category.toLowerCase());
    if (filter === 'deals') filteredProducts = filteredProducts.filter(isDeal);
    if (filter === 'new') filteredProducts = [...filteredProducts].sort(newestFirst);
    if (filter === 'wholesale') filteredProducts = filteredProducts.filter(hasWholesale);

    // Homepage rows only show what can be bought right now
    const inStock = products.filter(product => !isSoldOut(product));
    const deals = inStock.filter(isDeal).slice(0, ROW_SIZE);
    const newArrivals = [...inStock].sort(newestFirst).slice(0, ROW_SIZE);
    const bestSellers = topSellers.filter(product => !isSoldOut(product)).slice(0, ROW_SIZE);
    // Hero photos: deals first, topped up with the newest products
    const heroProducts = [...deals, ...newArrivals.filter(product => !isDeal(product))];

    let heading = { title: 'All products', subtitle: null };
    if (filter) heading = FILTERS[filter];
    // Show the category as it's spelled in the shop, not as typed in the URL
    const categoryName = products.find(product => product.category?.toLowerCase() === category.toLowerCase())?.category || category;
    if (category) heading = { title: filter ? `${heading.title}: ${categoryName}` : categoryName, subtitle: heading.subtitle };
    if (searchQuery) heading = { title: `Search results for: "${searchQuery}"`, subtitle: null };

    return (
        <div className="min-h-screen bg-brand-ivory flex flex-col font-sans">
            <Header />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20 w-full">
                {isHome && (
                    <>
                        <Hero banners={banners} featured={heroProducts} hasDeals={deals.length > 0} />
                        {/* Wait for products: adding a tile in front later makes scroll-snap push the row sideways */}
                        {!loading && (
                            <PromoTiles
                                maxDiscount={Math.max(0, ...inStock.map(product => product.discountPercentage || 0))}
                                hasWholesale={inStock.some(hasWholesale)}
                                productCount={products.length}
                            />
                        )}
                        <ProductRow title={FILTERS.deals.title} subtitle={FILTERS.deals.subtitle} seeAllTo="/shop?filter=deals" products={deals} />
                        <CategoryTiles categories={categories} />
                        <ProductRow title="Top Sellers" subtitle="Customer favourites" products={bestSellers} />
                        <ProductRow title={FILTERS.new.title} subtitle={FILTERS.new.subtitle} seeAllTo="/shop?filter=new" products={newArrivals} />
                        <TrustStrip />
                    </>
                )}

                <div className={isHome ? 'mt-12 md:mt-16 mb-6' : 'mb-8 pt-8 border-b border-brand-line pb-4'}>
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
