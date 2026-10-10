import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Phone, Mail, MapPin, Clock, Instagram } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { STORE, whatsappLink } from '../config/store';

const linkClass = "hover:text-white transition-colors";

const Footer = () => {
    const { user } = useAuth();

    // Only the details filled in on STORE are shown
    const contacts = [
        STORE.whatsapp && { icon: MessageCircle, label: `+${STORE.whatsapp} (WhatsApp)`, href: whatsappLink() },
        STORE.phone && { icon: Phone, label: STORE.phone, href: `tel:${STORE.phone.replace(/\s/g, '')}` },
        STORE.email && { icon: Mail, label: STORE.email, href: `mailto:${STORE.email}` },
        STORE.address && { icon: MapPin, label: STORE.address },
        STORE.hours && { icon: Clock, label: STORE.hours },
    ].filter(Boolean);

    return (
        <footer className="bg-brand-charcoal text-white mt-16 pt-16 pb-8 border-t border-brand-charcoal">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    <div className="flex flex-col items-start">
                        <div className="mb-6">
                            <Logo dark={true} />
                        </div>
                        <p className="text-sm font-light text-gray-400 leading-relaxed max-w-sm">{STORE.tagline}</p>
                        <div className="flex gap-3 mt-6">
                            {STORE.whatsapp && (
                                <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="p-2 rounded-full border border-gray-600 text-gray-300 hover:text-white hover:border-white transition-colors">
                                    <MessageCircle className="w-4 h-4" />
                                </a>
                            )}
                            {STORE.instagram && (
                                <a href={STORE.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="p-2 rounded-full border border-gray-600 text-gray-300 hover:text-white hover:border-white transition-colors">
                                    <Instagram className="w-4 h-4" />
                                </a>
                            )}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-lg font-serif mb-6 tracking-wide">Shop</h4>
                        <ul className="space-y-4 text-sm font-light text-gray-300">
                            <li><Link to="/shop" className={linkClass}>All products</Link></li>
                            <li><Link to="/shop?filter=deals" className={linkClass}>Deals</Link></li>
                            <li><Link to="/shop?filter=new" className={linkClass}>New arrivals</Link></li>
                            <li><Link to="/wishlist" className={linkClass}>Wishlist</Link></li>
                            <li><Link to={user ? '/dashboard' : '/login'} className={linkClass}>My account</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-lg font-serif mb-6 tracking-wide">Contact us</h4>
                        <ul className="space-y-4 text-sm font-light text-gray-300">
                            {contacts.map((contact) => {
                                const { icon: Icon, label, href } = contact;
                                return (
                                    <li key={label} className="flex items-start gap-3">
                                        <Icon className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
                                        {href ? <a href={href} className={linkClass}>{label}</a> : <span>{label}</span>}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-lg font-serif mb-6 tracking-wide">Legal</h4>
                        <ul className="space-y-4 text-sm font-light text-gray-300">
                            <li><a href="#" className={linkClass}>Privacy Policy</a></li>
                            <li><a href="#" className={linkClass}>Refund Policy</a></li>
                            <li><a href="#" className={linkClass}>Terms of Service</a></li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center mb-16 border-t border-gray-700 pt-16 mt-8">
                    <h4 className="text-lg font-serif mb-6 tracking-wide text-center">Subscribe to our emails</h4>
                    <div className="w-full max-w-md relative">
                        <input
                            type="email"
                            placeholder="Email"
                            className="w-full bg-transparent border border-gray-600 rounded-sm py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:border-white transition-colors"
                        />
                        <button className="absolute right-0 top-0 bottom-0 px-4 text-gray-400 hover:text-white transition-colors">
                            ➔
                        </button>
                    </div>
                </div>

                <div className="text-center text-xs font-light text-gray-400 border-t border-gray-800 pt-8">
                    © {new Date().getFullYear()}, {STORE.name}
                </div>
            </div>
        </footer>
    );
};

export default Footer;
