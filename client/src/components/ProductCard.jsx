import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Check } from 'lucide-react';
import clsx from 'clsx';

const ProductCard = ({ product }) => {
    const { addToCart } = useCart();
    const [selectedColor, setSelectedColor] = useState(product.colors[0]);
    const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
    const [isAdded, setIsAdded] = useState(false);

    // Determine image URL - fallback to placeholder if not found or using API path
    // Determine image URL - fallback to placeholder if not found or using API path
    const imgUrl = product.image?.startsWith('/')
        ? product.image // Local absolute path (public folder)
        : product.image || '';

    const handleAddToCart = () => {
        addToCart(product, selectedColor.name, selectedSize);
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000); // 2s feedback
    };

    return (
        <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="bg-gray-100 h-72 w-full relative group">
                {/* Image */}
                <img
                    src={imgUrl}
                    alt={product.name}
                    className="h-full w-full object-cover object-center"
                    onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                    }}
                />
                <div className="hidden h-full w-full bg-gradient-to-br from-indigo-500 to-purple-600 items-center justify-center text-white text-center p-4">
                    <span className="font-bold text-xl">{product.name}</span>
                </div>
            </div>

            <div className="p-6">
                <h3 className="text-xl font-bold text-blue-900 mb-2">{product.name}</h3>
                <p className="text-2xl font-bold text-red-500 mb-4">
                    ₦{product.price.toLocaleString()}
                </p>

                {/* Colors */}
                <div className="mb-4">
                    <span className="text-sm font-semibold text-gray-500 block mb-2">Color:</span>
                    <div className="flex gap-2 flex-wrap">
                        {product.colors.map((color) => (
                            <button
                                key={color.name}
                                onClick={() => setSelectedColor(color)}
                                className={clsx(
                                    "w-8 h-8 rounded-full border-2 relative transition-transform duration-200 hover:scale-110",
                                    selectedColor.name === color.name ? "border-blue-900 ring-2 ring-blue-100" : "border-transparent"
                                )}
                                style={{ backgroundColor: color.hex }}
                                title={color.name}
                            >
                                {selectedColor.name === color.name && (
                                    <span className="absolute inset-0 flex items-center justify-center">
                                        <Check className={clsx("w-4 h-4", color.hex === '#FFFFFF' ? 'text-black' : 'text-white')} />
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sizes */}
                <div className="mb-6">
                    <span className="text-sm font-semibold text-gray-500 block mb-2">Size:</span>
                    <div className="flex gap-2 flex-wrap">
                        {product.sizes.map((size) => (
                            <button
                                key={size}
                                onClick={() => setSelectedSize(size)}
                                className={clsx(
                                    "px-3 py-1 rounded-md text-sm font-medium border transition-colors",
                                    selectedSize === size
                                        ? "bg-blue-900 text-white border-blue-900"
                                        : "bg-white text-gray-700 border-gray-200 hover:border-blue-900"
                                )}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleAddToCart}
                    className={clsx(
                        "w-full py-3 rounded-lg font-bold text-white transition-all duration-300",
                        isAdded
                            ? "bg-green-500 shadow-lg shadow-green-200"
                            : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:shadow-lg"
                    )}
                >
                    {isAdded ? "✓ Added to Cart" : "Add to Cart"}
                </button>
            </div>
        </div>
    );
};

export default ProductCard;
