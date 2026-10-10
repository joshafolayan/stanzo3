import React from 'react';
import { Truck, Store, Landmark, MessageCircle } from 'lucide-react';

const ITEMS = [
    { icon: Truck, title: 'Delivery across Nigeria', text: 'Lagos 1-5 working days, elsewhere 2-7' },
    { icon: Store, title: 'Store pickup', text: 'Collect your order in person' },
    { icon: Landmark, title: 'Pay by bank transfer', text: 'Simple, direct payment' },
    { icon: MessageCircle, title: 'WhatsApp support', text: 'Chat with us about any order' },
];

const TrustStrip = () => (
    <section className="mt-12 md:mt-16 grid grid-cols-2 lg:grid-cols-4 gap-px bg-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
        {ITEMS.map(({ icon, title, text }) => {
            const Icon = icon;
            return (
                <div key={title} className="bg-white flex flex-col md:flex-row items-start gap-3 p-5 md:p-6">
                    <div className="shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-brand-black text-white flex items-center justify-center">
                        <Icon className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-brand-black">{title}</p>
                        <p className="text-xs text-brand-gray mt-0.5 font-light">{text}</p>
                    </div>
                </div>
            );
        })}
    </section>
);

export default TrustStrip;
