// Prices are whole naira
export const formatNaira = (amount) => `₦${Number(amount || 0).toLocaleString()}`;

export const getSalePrice = (product) => (
    product.discountPercentage > 0 ? product.price * (1 - product.discountPercentage / 100) : product.price
);
