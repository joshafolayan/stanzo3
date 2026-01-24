const products = [
    {
        id: 1,
        name: "Classic Leather Bag",
        price: 25000,
        image: "/products/bag-1.jpg",
        colors: [
            { name: "Black", hex: "#000000" },
            { name: "Brown", hex: "#8B4513" },
            { name: "Red", hex: "#DC143C" },
            { name: "Navy", hex: "#1a237e" }
        ],
        sizes: ["Small", "Medium", "Large"]
    },
    {
        id: 2,
        name: "Sport Sneakers",
        price: 18000,
        image: "/products/shoe-1.jpg",
        colors: [
            { name: "White", hex: "#FFFFFF" },
            { name: "Black", hex: "#000000" },
            { name: "Blue", hex: "#4169E1" },
            { name: "Pink", hex: "#FF69B4" }
        ],
        sizes: ["38", "39", "40", "41", "42", "43"]
    },
    {
        id: 3,
        name: "Elegant Handbag",
        price: 32000,
        image: "/products/bag-2.jpg",
        colors: [
            { name: "Beige", hex: "#F5F5DC" },
            { name: "Black", hex: "#000000" },
            { name: "Gold", hex: "#FFD700" }
        ],
        sizes: ["One Size"]
    },
    {
        id: 4,
        name: "Formal Shoes",
        price: 28000,
        image: "/products/shoe-2.jpg",
        colors: [
            { name: "Black", hex: "#000000" },
            { name: "Brown", hex: "#8B4513" },
            { name: "Tan", hex: "#D2691E" }
        ],
        sizes: ["39", "40", "41", "42", "43", "44"]
    }
];

module.exports = products;
