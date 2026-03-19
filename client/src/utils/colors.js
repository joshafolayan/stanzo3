export const colors = {
    'Black': '#000000',
    'White': '#FFFFFF',
    'Red': '#FF0000',
    'Lime': '#00FF00',
    'Blue': '#0000FF',
    'Yellow': '#FFFF00',
    'Cyan': '#00FFFF',
    'Magenta': '#FF00FF',
    'Silver': '#C0C0C0',
    'Gray': '#808080',
    'Maroon': '#800000',
    'Olive': '#808000',
    'Green': '#008000',
    'Purple': '#800080',
    'Teal': '#008080',
    'Navy': '#000080',
    'Orange': '#FFA500',
    'Pink': '#FFC0CB',
    'Brown': '#A52A2A',
    'Gold': '#FFD700',
    'Beige': '#F5F5DC',
    'Coral': '#FF7F50',
    'Indigo': '#4B0082',
    'Violet': '#EE82EE',
    'Khaki': '#F0E68C',
    'Plum': '#DDA0DD',
    'Salmon': '#FA8072',
    'Turquoise': '#40E0D0',
    'Cream': '#FFFDD0',
    'Mustard': '#FFDB58',
    'Mint': '#3EB489',
    'Peach': '#FFE5B4',
    'Lavender': '#E6E6FA',
    'Burgundy': '#800020',
    'Rust': '#B7410E',
    'Charcoal': '#36454F',
    'Crimson': '#DC143C',
    'Magenta': '#FF00FF',
    'Chocolate': '#D2691E',
    'Sky Blue': '#87CEEB',
    'Forest Green': '#228B22'
};

const hexToRgb = (hex) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

export const getNearestColorName = (hex) => {
    if (!hex) return '';
    const rgb = hexToRgb(hex);
    if (!rgb) return '';

    let minDistance = Infinity;
    let nearestColor = '';

    for (const [name, colorHex] of Object.entries(colors)) {
        const cRgb = hexToRgb(colorHex);
        if (!cRgb) continue;

        // Euclidean distance
        const distance = Math.pow(rgb.r - cRgb.r, 2) + 
                         Math.pow(rgb.g - cRgb.g, 2) + 
                         Math.pow(rgb.b - cRgb.b, 2);

        if (distance < minDistance) {
            minDistance = distance;
            nearestColor = name;
        }
    }

    return nearestColor;
};
