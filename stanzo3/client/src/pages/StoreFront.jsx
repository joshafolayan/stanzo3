import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Header from './components/Header';
import Hero from './components/Hero';
import ProductGrid from './components/ProductGrid';
import CartModal from './components/CartModal';
import PaymentModal from './components/PaymentModal';

const StoreFront = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get('http://localhost:3000/api/products');
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

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16 w-full">
                <Hero />
                <ProductGrid products={products} loading={loading} error={error} />
            </main>

            {/* Modals */}
            <CartModal onCheckout={() => setIsPaymentOpen(true)} />
            <PaymentModal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} />

            <footer className="bg-white border-t py-8 mt-12 text-center text-gray-500 text-sm">
                <p>© {new Date().getFullYear()} Stanzo3 Collection. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default StoreFront;
