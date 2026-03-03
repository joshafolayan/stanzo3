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
                brand: {
                    black: '#121212',
                    white: '#FFFFFF',
                    charcoal: '#1C232B',
                    gray: '#696969'
                }
            }
        },
    },
    plugins: [],
}
