import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { Check, ChevronRight, ChevronLeft, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import Header from '../components/Header';
import { getImageUrl } from '../utils/image';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart, getRemainingStock } = useCart();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isAdded, setIsAdded] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                // Since there isn't a single product fetch endpoint defined in the provided context,
                // we'll fetch all and find by ID, or assume an endpoint exists. 
                // Let's assume /api/store/products exists or fetch all and filter for robustness in this demo.
                const { data } = await axios.get('/api/products');
                const foundProduct = data.find(p => p.id === parseInt(id));

                if (foundProduct) {
                    setProduct(foundProduct);
                    if (foundProduct.sizes?.length > 0) setSelectedSize(foundProduct.sizes[0]);
                }
            } catch (error) {
                console.error("Failed to fetch product", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    if (loading) return <div className="min-h-screen flex items-center justify-center font-serif text-2xl">Loading...</div>;
    if (!product) return <div className="min-h-screen flex items-center justify-center font-serif text-2xl">Product not found.</div>;

    const images = product.images && product.images.length > 0
        ? product.images.map(getImageUrl)
        : [getImageUrl(product.image)];

    const isSoldOut = product.stockQuantity !== null && product.stockQuantity !== undefined && product.stockQuantity <= 0;
    const remaining = getRemainingStock(product); // null = not tracked
    const isLowStock = !isSoldOut && product.stockQuantity > 0 && product.stockQuantity <= 5;
    const cartFull = !isSoldOut && remaining !== null && remaining < 1;

    const handleAddToCart = () => {
        if (isSoldOut || cartFull) return;
        addToCart(product, selectedColor?.name, selectedSize);
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
    };

    return (
        <div className="min-h-screen bg-brand-white">
            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-sm font-medium text-brand-gray hover:text-brand-black mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Shop
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24">
                    {/* Left Column: Image Gallery */}
                    <div className="space-y-4">
                        <div className={clsx("aspect-[4/5] relative bg-gray-50 overflow-hidden group z-0 hover:z-10 product-pop-frame product-pop-soft", isSoldOut && "opacity-60 grayscale")}>
                            {isSoldOut && (
                                <span className="absolute top-4 left-4 z-10 bg-brand-black text-brand-white text-xs font-bold px-3 py-1 rounded-full tracking-wider uppercase">Sold Out</span>
                            )}
                            {/* Cropped fill at rest, cross-fades to the full
                                uncropped shot while the frame pops out on hover */}
                            <img
                                src={images[currentImageIndex]}
                                alt={product.name}
                                className="w-full h-full object-cover object-center product-pop-cover"
                            />
                            <img
                                src={images[currentImageIndex]}
                                alt=""
                                aria-hidden="true"
                                className="absolute inset-0 w-full h-full object-contain object-center product-pop-full"
                            />
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white border border-gray-200"
                                    >
                                        <ChevronLeft className="w-6 h-6 text-black" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white border border-gray-200"
                                    >
                                        <ChevronRight className="w-6 h-6 text-black" />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Thumbnail Strip */}
                        {images.length > 1 && (
                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentImageIndex(idx)}
                                        className={clsx(
                                            "w-20 lg:w-24 aspect-[4/5] flex-shrink-0 border-2 transition-all",
                                            currentImageIndex === idx ? "border-brand-black opacity-100" : "border-transparent opacity-60 hover:opacity-100"
                                        )}
                                    >
                                        <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Product Info */}
                    <div className="flex flex-col pt-4 lg:pt-10">
                        <h1 className="text-4xl md:text-5xl font-serif text-brand-black mb-4">{product.name}</h1>

                        <div className={clsx("text-xl", isLowStock || isSoldOut ? "mb-2" : "mb-8")}>
                            {product.discountPercentage > 0 && (
                                <span className="line-through text-gray-400 mr-3">#{product.price.toLocaleString()}</span>
                            )}
                            <span className="font-medium text-brand-black">
                                #{(product.discountPercentage > 0 ? product.price * (1 - product.discountPercentage / 100) : product.price).toLocaleString()}
                            </span>
                        </div>

                        {isSoldOut && <p className="text-sm font-medium text-red-600 mb-8 uppercase tracking-widest">Sold out</p>}
                        {isLowStock && <p className="text-sm font-medium text-red-600 mb-8">Only {product.stockQuantity} left in stock</p>}

                        {/* Colors */}
                        {product.colors && product.colors.length > 0 && (
                            <div className="mb-8">
                                <span className="block text-sm font-medium text-brand-black uppercase tracking-widest mb-3">
                                    Color:{' '}
                                    <span className={clsx("font-normal", selectedColor ? "text-brand-gray" : "text-red-400 italic")}>
                                        {selectedColor?.name || 'Select a colour'}
                                    </span>
                                </span>
                                <div className="flex gap-3 flex-wrap">
                                    {product.colors.map((color, idx) => (
                                        <button
                                            key={`${color.hex}-${color.name}-${idx}`}
                                            onClick={() => setSelectedColor(color)}
                                            disabled={isSoldOut}
                                            className={clsx(
                                                "w-10 h-10 rounded-full border border-gray-200 relative transition-transform hover:scale-110",
                                                selectedColor?.hex === color.hex && selectedColor?.name === color.name ? "ring-2 ring-brand-black ring-offset-2" : ""
                                            )}
                                            style={{ backgroundColor: color.hex }}
                                            title={color.name}
                                        >
                                            {selectedColor?.hex === color.hex && selectedColor?.name === color.name && (
                                                <span className="absolute inset-0 flex items-center justify-center">
                                                    <Check className={clsx("w-5 h-5", color.hex === '#FFFFFF' ? 'text-black' : 'text-white')} />
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Sizes */}
                        {product.sizes && product.sizes.length > 0 && (
                            <div className="mb-10">
                                <span className="block text-sm font-medium text-brand-black uppercase tracking-widest mb-3">Size</span>
                                <div className="flex gap-3 flex-wrap">
                                    {product.sizes.map(size => (
                                        <button
                                            key={size}
                                            onClick={() => setSelectedSize(size)}
                                            disabled={isSoldOut}
                                            className={clsx(
                                                "px-6 py-3 text-sm font-medium border transition-colors",
                                                selectedSize === size
                                                    ? "bg-brand-black text-brand-white border-brand-black"
                                                    : "bg-white text-brand-gray border-gray-200 hover:border-brand-black hover:text-brand-black"
                                            )}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleAddToCart}
                            disabled={isSoldOut || cartFull}
                            className={clsx(
                                "w-full py-4 text-sm tracking-[0.2em] uppercase font-bold transition-all duration-300 border",
                                isSoldOut || cartFull
                                    ? "bg-gray-300 text-gray-600 border-gray-300 cursor-not-allowed"
                                    : isAdded
                                        ? "bg-green-600 text-white border-green-600"
                                        : "bg-brand-black text-white border-brand-black hover:bg-white hover:text-brand-black"
                            )}
                        >
                            {isSoldOut ? "Sold Out" : cartFull ? "All Available Stock in Cart" : isAdded ? "Added to Cart" : "Add to Cart"}
                        </button>

                        {product.description && (
                            <div className="mt-12 pt-10 border-t border-gray-200">
                                <h3 className="text-sm font-medium uppercase tracking-widest mb-4">Description</h3>
                                <p className="text-brand-gray leading-relaxed text-sm">
                                    {product.description}
                                </p>
                            </div>
                        )}

                        <div className="mt-8 pt-8 border-t border-gray-200">
                            <ul className="text-xs text-brand-gray space-y-2 uppercase tracking-wide">
                                <li>✓ Free shipping on orders over #100,000</li>
                                <li>✓ Returns accepted within 14 days</li>
                                <li>✓ Secure checkout</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProductDetails;