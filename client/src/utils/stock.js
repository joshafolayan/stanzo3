/**
 * Stock helpers - must match server/utils/stock.js.
 * A product's stock is tracked in one of three ways:
 *   'variant'   - per colour/size combination (product.variantStock)
 *   'single'    - one number for the whole product (product.stockQuantity)
 *   'untracked' - always available
 */
export const stockMode = (product) => {
    if (product?.variantStock?.length > 0) return 'variant';
    if (product?.stockQuantity !== null && product?.stockQuantity !== undefined) return 'single';
    return 'untracked';
};

// Units in stock for a colour/size choice; null = not tracked
export const getStock = (product, color, size) => {
    const mode = stockMode(product);
    if (mode === 'untracked') return null;
    if (mode === 'single') return product.stockQuantity;
    const entry = product.variantStock.find(v => v.color === (color || '') && v.size === (size || ''));
    return entry ? entry.quantity : 0;
};

// Total units across all options; null = not tracked
export const getTotalStock = (product) => {
    const mode = stockMode(product);
    if (mode === 'untracked') return null;
    if (mode === 'single') return product.stockQuantity;
    return product.variantStock.reduce((sum, v) => sum + v.quantity, 0);
};

export const isSoldOut = (product) => {
    const total = getTotalStock(product);
    return total !== null && total <= 0;
};

// Is this colour in stock in at least one size (or in the given size)?
export const isColorAvailable = (product, color, size = undefined) => {
    if (stockMode(product) !== 'variant') return !isSoldOut(product);
    return product.variantStock.some(v => v.color === color && (size === undefined || v.size === (size || '')) && v.quantity > 0);
};

// Is this size in stock for the given colour (or for any colour)?
export const isSizeAvailable = (product, size, color = undefined) => {
    if (stockMode(product) !== 'variant') return !isSoldOut(product);
    return product.variantStock.some(v => v.size === size && (color === undefined || v.color === (color || '')) && v.quantity > 0);
};

// Cart lines that draw from the same stock share a key
export const stockKey = (product, color, size) => (
    stockMode(product) === 'variant' ? `${product._id}|${color || ''}|${size || ''}` : String(product._id)
);
