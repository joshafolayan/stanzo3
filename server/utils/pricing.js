// Unit price for a product, given how many units of it (all colours/sizes together) are being bought.
// Must match client/src/utils/price.js
const retailPrice = (product) => {
    const discount = product.discountPercentage || 0;
    return Math.round(product.price * (1 - discount / 100) * 100) / 100;
};

const unitPrice = (product, quantityOfProduct) => {
    const retail = retailPrice(product);
    const { wholesalePrice, wholesaleMinQty } = product;
    if (wholesalePrice != null && wholesaleMinQty != null && quantityOfProduct >= wholesaleMinQty && wholesalePrice < retail) {
        return wholesalePrice;
    }
    return retail;
};

module.exports = { retailPrice, unitPrice };
