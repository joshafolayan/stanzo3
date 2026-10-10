// Prices are whole naira
export const formatNaira = (amount) => `₦${Number(amount || 0).toLocaleString()}`;

// Price after the product's discount. Must match server/utils/pricing.js
export const getSalePrice = (product) => {
    const discount = product.discountPercentage || 0;
    return Math.round(product.price * (1 - discount / 100) * 100) / 100;
};

// Does buying in bulk give this product a lower price?
export const hasWholesale = (product) => (
    product.wholesalePrice != null && product.wholesaleMinQty != null && product.wholesalePrice < getSalePrice(product)
);

// Unit price when `quantityOfProduct` units of it (all colours/sizes together) are bought.
// Must match server/utils/pricing.js
export const getUnitPrice = (product, quantityOfProduct) => (
    hasWholesale(product) && quantityOfProduct >= product.wholesaleMinQty ? product.wholesalePrice : getSalePrice(product)
);
