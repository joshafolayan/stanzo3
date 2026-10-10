import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Heart } from 'lucide-react';
import Header from '../components/Header';
import ProductGrid from '../components/ProductGrid';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';
import { useWishlist } from '../context/WishlistContext';

const Wishlist = () => {
    const { wishlistIds, wishlistInAccount } = useWishlist();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        axios.get('/api/products')
            .then(({ data }) => setProducts(data))
            .catch(err => {
                console.error('Failed to fetch products:', err);
                setError('Failed to load products');
            })
            .finally(() => setLoading(false));
    }, []);

    // Most recently saved first
    const byId = new Map(products.map(product => [product._id, product]));
    const saved = [...wishlistIds].reverse().map(id => byId.get(id)).filter(Boolean);

    return (
        <div className="min-h-screen bg-brand-ivory flex flex-col font-sans">
            <Header />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20 w-full">
                <div className="mb-8 pt-8 border-b border-brand-line pb-4">
                    <h1 className="text-2xl md:text-3xl font-serif text-brand-black">Wishlist</h1>
                    {!loading && !error && (
                        <p className="text-brand-gray mt-2">
                            {saved.length} saved {saved.length === 1 ? 'item' : 'items'}
                            {!wishlistInAccount && saved.length > 0 && (
                                <> · <Link to="/login" className="underline underline-offset-4 hover:text-brand-black">Sign in</Link> to keep it on any device</>
                            )}
                        </p>
                    )}
                </div>

                {!loading && !error && saved.length === 0 ? (
                    <div className="text-center py-16">
                        <Heart className="w-10 h-10 mx-auto text-gray-300 mb-4" strokeWidth={1.5} />
                        <p className="text-brand-gray mb-6">Nothing saved yet. Tap the heart on any product to save it here.</p>
                        <Link to="/shop" className="inline-block bg-brand-black text-white px-6 py-3 text-sm uppercase tracking-widest font-medium hover:bg-gray-800 transition-colors">
                            Start shopping
                        </Link>
                    </div>
                ) : (
                    <ProductGrid products={saved} loading={loading} error={error} />
                )}
            </main>

            <Footer />
            <WhatsAppButton />
        </div>
    );
};

export default Wishlist;
