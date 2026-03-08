import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Hero from '../components/Hero';
import ProductGrid from '../components/ProductGrid';
import CartModal from '../components/CartModal';
import PaymentModal from '../components/PaymentModal';

const StoreFront = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);

    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('q') || '';

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

    const filteredProducts = products.filter(product => {
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

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            <Header />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20 w-full">
                {!searchQuery && <Hero />}

                {searchQuery && (
                    <div className="mb-8 pt-8 border-b pb-4">
                        <h2 className="text-2xl font-serif text-brand-black">
                            Search results for: "{searchQuery}"
                        </h2>
                        <p className="text-brand-gray mt-2">{filteredProducts.length} results found</p>
                    </div>
                )}

                <ProductGrid products={filteredProducts} loading={loading} error={error} />
            </main>

            {/* Modals */}
            <CartModal onCheckout={() => setIsPaymentOpen(true)} />
            <PaymentModal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} />

            <footer className="bg-brand-charcoal text-white mt-16 pt-16 pb-8 border-t border-brand-charcoal">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                        <div className="lg:col-span-2">
                            {/* Empty to match the sparse look, maybe for logo later */}
                        </div>
                        <div>
                            <h4 className="text-lg font-serif mb-6 tracking-wide">Quick links</h4>
                            <ul className="space-y-4 text-sm font-light text-gray-300">
                                <li><a href="#" className="hover:text-white transition-colors">Search</a></li>
                                <li><a href="#" className="hover:text-white transition-colors underline underline-offset-4 decoration-1 font-normal text-white">All products</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">All collections</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contact Information</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-lg font-serif mb-6 tracking-wide">Legal</h4>
                            <ul className="space-y-4 text-sm font-light text-gray-300">
                                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Refund Policy</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center mb-16 border-t border-gray-700 pt-16 mt-8">
                        <h4 className="text-lg font-serif mb-6 tracking-wide text-center">Subscribe to our emails</h4>
                        <div className="w-full max-w-md relative">
                            <input
                                type="email"
                                placeholder="Email"
                                className="w-full bg-transparent border border-gray-600 rounded-sm py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:border-white transition-colors"
                            />
                            <button className="absolute right-0 top-0 bottom-0 px-4 text-gray-400 hover:text-white transition-colors">
                                ➔
                            </button>
                        </div>
                    </div>

                    <div className="text-center text-xs font-light text-gray-400 border-t border-gray-800 pt-8 flex flex-wrap justify-center gap-2">
                        <span>© {new Date().getFullYear()}, Stanzo3 Collection</span>
                        <span>·</span>
                        <a href="#" className="hover:text-white transition-colors">Privacy policy</a>
                        <span>·</span>
                        <a href="#" className="hover:text-white transition-colors">Refund policy</a>
                        <span>·</span>
                        <a href="#" className="hover:text-white transition-colors">Terms of service</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default StoreFront;
