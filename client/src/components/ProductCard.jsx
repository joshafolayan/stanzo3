import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { getImageUrl } from '../utils/image';

const ProductCard = ({ product }) => {
    const { addToCart, getRemainingStock } = useCart();
    const [selectedColors, setSelectedColors] = useState([]);
    const [selectedSize, setSelectedSize] = useState(product.sizes && product.sizes.length > 0 ? product.sizes[0] : null);
    const [isAdded, setIsAdded] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [imageFailed, setImageFailed] = useState(false);

    const images = product.images && product.images.length > 0
        ? product.images.map(getImageUrl)
        : [getImageUrl(product.image)];

    const nextImage = (e) => {
        e.preventDefault(); // Prevent Link navigation
        e.stopPropagation();
        setImageFailed(false);
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = (e) => {
        e.preventDefault(); // Prevent Link navigation
        e.stopPropagation();
        setImageFailed(false);
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const toggleColor = (color) => {
        setSelectedColors(prev => {
            const isAlreadySelected = prev.some(c => c.hex === color.hex && c.name === color.name);
            if (isAlreadySelected) {
                return prev.filter(c => !(c.hex === color.hex && c.name === color.name));
            }
            return [...prev, color];
        });
    };

    const isSoldOut = product.stockQuantity !== null && product.stockQuantity !== undefined && product.stockQuantity <= 0;
    const remaining = getRemainingStock(product); // null = not tracked
    const isLowStock = !isSoldOut && product.stockQuantity > 0 && product.stockQuantity <= 5;
    const cartFull = !isSoldOut && remaining !== null && remaining < 1;

    const handleAddToCart = () => {
        if (isSoldOut || cartFull) return;
        if (selectedColors.length === 0) {
            // No color selected — add without color
            addToCart(product, null, selectedSize);
        } else {
            // Add one cart entry per selected color (never more than what's left in stock)
            const colorsToAdd = remaining === null ? selectedColors : selectedColors.slice(0, remaining);
            colorsToAdd.forEach(color => {
                addToCart(product, color.name, selectedSize);
            });
            if (colorsToAdd.length < selectedColors.length) {
                alert(`Only ${remaining} of this item left — added the first ${remaining} colour(s).`);
            }
        }
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
    };

    return (
        <div className={clsx("group flex flex-col relative w-full cursor-pointer z-0 hover:z-20", isSoldOut && "opacity-60 grayscale")}>
            <Link to={`/product/${product.id}`} className="block">
                <div className="w-full aspect-[4/5] relative overflow-hidden bg-gray-50 mb-4 group/slider product-pop-frame">
                    {/* Sale Badge overlay — lives inside the frame so it pops with it */}
                    <div className="absolute top-2 left-2 md:top-4 md:left-4 z-10">
                        <span className="bg-brand-black text-brand-white text-[10px] md:text-xs font-bold px-2 py-0.5 md:px-3 md:py-1 rounded-full tracking-wider uppercase">
                            {isSoldOut ? 'Sold Out' : 'Sale'}
                        </span>
                    </div>

                    {/* Image — cropped fill at rest, cross-fades to the full
                        uncropped shot while the frame pops out on hover */}
                    {!imageFailed && (
                        <>
                            <img
                                src={images[currentImageIndex]}
                                alt={product.name}
                                className="h-full w-full object-cover object-center product-pop-cover"
                                onError={() => setImageFailed(true)}
                            />
                            <img
                                src={images[currentImageIndex]}
                                alt=""
                                aria-hidden="true"
                                className="absolute inset-0 h-full w-full object-contain object-center product-pop-full"
                            />
                        </>
                    )}

                    {/* Slider Controls (only show if multiple images) */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={prevImage}
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-1 rounded-full opacity-0 group-hover/slider:opacity-100 transition-opacity hover:bg-white"
                            >
                                <ChevronLeft className="w-5 h-5 text-black" />
                            </button>
                            <button
                                onClick={nextImage}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-1 rounded-full opacity-0 group-hover/slider:opacity-100 transition-opacity hover:bg-white"
                            >
                                <ChevronRight className="w-5 h-5 text-black" />
                            </button>
                        </>
                    )}

                    {imageFailed && (
                        <div className="flex h-full w-full bg-gradient-to-br from-indigo-500 to-purple-600 items-center justify-center text-white text-center p-4">
                            <span className="font-bold text-xl">{product.name}</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col flex-1 px-1 mt-2">
                    <h3 className="text-sm md:text-lg font-serif text-brand-black mb-0.5 md:mb-1 leading-tight line-clamp-2 md:line-clamp-1">{product.name}</h3>
                    <p className="text-xs md:text-sm font-semibold text-brand-gray mb-2 md:mb-4 flex flex-wrap gap-x-1 md:gap-x-2 items-center">
                        {product.discountPercentage > 0 && (
                            <span className="line-through text-gray-400 font-normal text-[10px] md:text-sm">#{product.price.toLocaleString()}</span>
                        )}
                        <span className="text-brand-black">
                            #{(product.discountPercentage > 0 ? product.price * (1 - product.discountPercentage / 100) : product.price).toLocaleString()}
                        </span>
                    </p>
                    {isLowStock && (
                        <p className="text-[10px] md:text-xs font-medium text-red-600 -mt-1 md:-mt-3 mb-2">Only {product.stockQuantity} left</p>
                    )}
                </div>
            </Link>

            <div className="flex flex-col flex-1 px-1">
                <div className="mb-2 md:mb-4">
                    <div className="flex gap-1 md:gap-2 flex-wrap pb-1">
                        {product.colors.map((color, idx) => {
                            const isSelected = selectedColors.some(c => c.hex === color.hex && c.name === color.name);
                            return (
                                <button
                                    key={`${color.hex}-${color.name}-${idx}`}
                                    onClick={() => toggleColor(color)}
                                    disabled={isSoldOut}
                                    className={clsx(
                                        "w-5 h-5 md:w-6 md:h-6 rounded-full border border-gray-200 relative transition-transform duration-200 hover:scale-110",
                                        isSelected ? "ring-2 ring-brand-black ring-offset-1" : ""
                                    )}
                                    style={{ backgroundColor: color.hex }}
                                    title={color.name}
                                >
                                    {isSelected && (
                                        <span className="absolute inset-0 flex items-center justify-center">
                                            <Check className={clsx("w-4 h-4", color.hex === '#FFFFFF' ? 'text-black' : 'text-white')} />
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mb-3 md:mb-6">
                    <div className="flex gap-1 md:gap-2 flex-wrap">
                        {product.sizes.map((size) => (
                            <button
                                key={size}
                                onClick={() => setSelectedSize(size)}
                                disabled={isSoldOut}
                                className={clsx(
                                    "px-2 py-0.5 md:px-3 md:py-1 text-[10px] md:text-xs font-medium border transition-colors",
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

                <button
                    onClick={handleAddToCart}
                    disabled={isSoldOut || cartFull}
                    className={clsx(
                        "w-full py-2 md:py-3 text-[10px] md:text-sm tracking-wider md:tracking-widest uppercase font-medium transition-all duration-300 border",
                        isSoldOut || cartFull
                            ? "bg-gray-300 text-gray-600 border-gray-300 cursor-not-allowed"
                            : isAdded
                                ? "bg-green-600 text-white border-green-600"
                                : "bg-brand-black text-white border-brand-black hover:bg-white hover:text-brand-black"
                    )}
                >
                    {isSoldOut ? "Sold Out" : cartFull ? "All in Cart" : isAdded ? "Added" : "Add to Cart"}
                </button>
            </div>
        </div>
    );
};

export default ProductCard;