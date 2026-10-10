/**
 * Store details shown around the storefront (announcement bar, footer, WhatsApp button).
 * Leave a field empty ('') to hide it.
 */
export const STORE = {
    name: 'All Round Stores',
    tagline: 'Your one-stop destination for everything you need. Quality products and exceptional service, all around.',

    // International format, digits only (used for wa.me links)
    whatsapp: '2347061663031',
    phone: '2347061663031',
    email: 'support@allroundstores.com',
    address: '',
    hours: 'Mon - Fri 10am -6pm, Sat 10am -2pm',
    instagram: '', // full URL

    // Scrolling bar at the top of every page
    announcements: [
        'Welcome to our store',
        'Delivery: Lagos 1-5 working days · Outside Lagos 2-7 working days (from dispatch)',
        'Store pickup available',
        'Need help? Chat with us on WhatsApp',
    ],
};

export const whatsappLink = (text = '') =>
    `https://wa.me/${STORE.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
