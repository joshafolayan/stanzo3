import React from 'react';
import { Heart } from 'lucide-react';
import clsx from 'clsx';
import { useWishlist } from '../context/WishlistContext';

// Heart toggle. `className` positions it; it's safe to use inside a product <Link>.
const WishlistButton = ({ product, className = '', withLabel = false }) => {
    const { isInWishlist, toggleWishlist } = useWishlist();
    const saved = isInWishlist(product);

    const handleClick = (e) => {
        e.preventDefault(); // don't follow the surrounding product link
        e.stopPropagation();
        toggleWishlist(product);
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            aria-pressed={saved}
            aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
            title={saved ? 'Remove from wishlist' : 'Save to wishlist'}
            className={clsx(
                'flex items-center justify-center gap-2 transition-colors',
                withLabel
                    ? 'border border-gray-300 px-6 py-4 text-sm uppercase tracking-widest font-medium hover:border-brand-black'
                    : 'w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/90 shadow-sm hover:bg-white',
                className
            )}
        >
            <Heart className={clsx('w-4 h-4 md:w-5 md:h-5', saved ? 'fill-pink-600 text-pink-600' : 'text-brand-black')} strokeWidth={1.5} />
            {withLabel && (saved ? 'Saved' : 'Save to wishlist')}
        </button>
    );
};

export default WishlistButton;
