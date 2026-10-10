import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                serif: ['Playfair Display', 'serif'],
            },
            colors: {
                // Tailwind's grey is cool/blue; stone is the warm version that suits the palette
                gray: colors.stone,
                // Warm palette built around the leather products: neutrals, one cognac accent,
                // and muted functional colours. Use these instead of Tailwind's stock hues.
                brand: {
                    black: '#1A1714',         // ink: text, primary buttons
                    white: '#FFFFFF',         // cards and panels on the ivory page
                    charcoal: '#231E1A',      // espresso: hero, footer
                    gray: '#6E655C',          // taupe: secondary text
                    ivory: '#FAF7F2',         // page background
                    line: '#E8E1D7',          // borders and dividers
                    accent: '#A8693B',        // cognac: the one accent colour
                    'accent-light': '#C99368', // cognac for text on espresso
                    'accent-dark': '#8A5530',
                    'accent-tint': '#F5EBE1',
                    sale: '#8B2E2A',          // oxblood: sale prices, low stock, errors
                    'sale-tint': '#F7ECEA',
                    olive: '#56664A',         // success
                    'olive-tint': '#EEF1EA',
                }
            }
        },
    },
    plugins: [],
}
