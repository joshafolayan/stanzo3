import React from 'react';
import { MessageCircle } from 'lucide-react';
import { STORE, whatsappLink } from '../config/store';

const WhatsAppButton = () => {
    if (!STORE.whatsapp) return null;

    return (
        <a
            href={whatsappLink('Hello! I have a question about a product.')}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with us on WhatsApp"
            className="fixed bottom-5 right-5 z-40 flex items-center gap-2 bg-[#25D366] text-white rounded-full shadow-lg p-3.5 md:px-5 hover:scale-105 transition-transform"
        >
            <MessageCircle className="w-6 h-6" />
            <span className="hidden md:inline text-sm font-semibold">Chat with us</span>
        </a>
    );
};

export default WhatsAppButton;
