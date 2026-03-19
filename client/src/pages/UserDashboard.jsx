import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Package, ShoppingBag, LogOut, ChevronRight, Trash2, CreditCard } from 'lucide-react';

const UserDashboard = () => {
    const { user, logout, loading } = useAuth();
    const { cart, removeFromCart, updateQuantity, getCartTotal } = useCart();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('orders');
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
            return;
        }

        const fetchOrders = async () => {
            try {
                const response = await axios.get('/api/orders/myorders');
                setOrders(response.data);
            } catch (error) {
                console.error("Failed to fetch orders:", error);
            } finally {
                setLoadingOrders(false);
            }
        };

        if (activeTab === 'orders') {
            fetchOrders();
        }
    }, [user, loading, activeTab, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    if (loading) return null;
    if (!user) return null;

    return (
        <div className="min-h-screen bg-brand-white flex flex-col">
            <Header />
            <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 mt-16 md:mt-20">

                {/* Dashboard Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 pb-6 border-b border-gray-200">
                    <div>
                        <h1 className="text-3xl font-serif text-brand-black mb-1">My Account</h1>
                        <p className="text-gray-500">Welcome back, {user.username}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="mt-4 md:mt-0 flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium transition-colors bg-red-50 px-4 py-2 rounded-lg"
                    >
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar Navigation */}
                    <div className="md:w-64 flex-shrink-0 space-y-2">
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'orders'
                                    ? 'bg-brand-black text-brand-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <span className="flex items-center gap-3">
                                <Package className="w-5 h-5" /> Purchase History
                            </span>
                            <ChevronRight className={`w-4 h-4 ${activeTab === 'orders' ? 'opacity-100' : 'opacity-0'}`} />
                        </button>

                        <button
                            onClick={() => setActiveTab('cart')}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'cart'
                                    ? 'bg-brand-black text-brand-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <span className="flex items-center gap-3">
                                <ShoppingBag className="w-5 h-5" /> My Cart
                                {cart.length > 0 && (
                                    <span className="bg-brand-white text-brand-black text-[10px] px-2 py-0.5 rounded-full ml-1 font-bold">
                                        {cart.length}
                                    </span>
                                )}
                            </span>
                            <ChevronRight className={`w-4 h-4 ${activeTab === 'cart' ? 'opacity-100' : 'opacity-0'}`} />
                        </button>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 min-h-[400px]">

                        {/* Orders Tab */}
                        {activeTab === 'orders' && (
                            <div className="animate-fade-in">
                                <h2 className="text-xl font-serif text-brand-black mb-6">Purchase History</h2>

                                {loadingOrders ? (
                                    <div className="flex justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-black"></div>
                                    </div>
                                ) : orders.length === 0 ? (
                                    <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" strokeWidth={1} />
                                        <h3 className="text-lg font-medium text-gray-900 mb-1">No orders yet</h3>
                                        <p className="text-gray-500 text-sm">When you place orders, they will appear here.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {orders.map(order => (
                                            <div key={order._id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-4">
                                                    <div>
                                                        <div className="text-xs text-gray-500 mb-1">Order #{order._id.slice(-8).toUpperCase()}</div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-lg font-medium text-brand-black">#{order.totalAmount.toLocaleString()}</div>
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider mt-1 ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                                    'bg-orange-100 text-orange-800'
                                                            }`}>
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    {order.items.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between items-center text-sm">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-gray-50 rounded flex items-center justify-center text-xs text-gray-400 border border-gray-100">
                                                                    {item.quantity}x
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-gray-900">{item.name}</p>
                                                                    {(item.selectedSize || item.selectedColor) && (
                                                                        <p className="text-xs text-gray-500 border-l border-gray-300 pl-2 mt-0.5 ml-0.5">
                                                                            {item.selectedSize && `Size: ${item.selectedSize}`}
                                                                            {item.selectedSize && item.selectedColor && ' | '}
                                                                            {item.selectedColor && `Color: ${item.selectedColor}`}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <span className="text-gray-600">#{(item.price * item.quantity).toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Cart Tab */}
                        {activeTab === 'cart' && (
                            <div className="animate-fade-in">
                                <h2 className="text-xl font-serif text-brand-black mb-6">Shopping Cart</h2>

                                {cart.length === 0 ? (
                                    <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                        <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" strokeWidth={1} />
                                        <h3 className="text-lg font-medium text-gray-900 mb-1">Your cart is empty</h3>
                                        <p className="text-gray-500 text-sm mb-6">Looks like you haven't added anything yet.</p>
                                        <button
                                            onClick={() => navigate('/shop')}
                                            className="px-6 py-2 bg-brand-black text-brand-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                                        >
                                            Continue Shopping
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="space-y-4 mb-8">
                                            {cart.map((item) => (
                                                <div key={`${item._id || item.id}-${item.selectedSize}-${item.selectedColor}`} className="flex items-center gap-4 py-4 border-b border-gray-100">
                                                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                        <img src={item.imageUrl || item.images?.[0] || 'https://via.placeholder.com/150'} alt={item.name} className="w-full h-full object-cover" />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-medium text-gray-900 truncate">{item.name}</h4>
                                                        {(item.selectedSize || item.selectedColor) && (
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {item.selectedSize && `Size: ${item.selectedSize}`}
                                                                {item.selectedSize && item.selectedColor && ' / '}
                                                                {item.selectedColor && `Color: ${item.selectedColor}`}
                                                            </p>
                                                        )}
                                                        <div className="mt-2 flex items-center gap-3">
                                                            <div className="flex items-center border border-gray-200 rounded-md">
                                                                <button
                                                                    className="px-2.5 py-1 text-gray-500 hover:text-brand-black hover:bg-gray-50"
                                                                    onClick={() => updateQuantity(item._id || item.id, item.selectedSize, item.selectedColor, Math.max(1, (item.quantity || 1) - 1))}
                                                                >-</button>
                                                                <span className="px-2 text-sm font-medium">{item.quantity || 1}</span>
                                                                <button
                                                                    className="px-2.5 py-1 text-gray-500 hover:text-brand-black hover:bg-gray-50"
                                                                    onClick={() => updateQuantity(item._id || item.id, item.selectedSize, item.selectedColor, (item.quantity || 1) + 1)}
                                                                >+</button>
                                                            </div>
                                                            <button
                                                                onClick={() => removeFromCart(item._id || item.id, item.selectedSize, item.selectedColor)}
                                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="text-right">
                                                        <p className="text-sm font-medium text-gray-900">#{((item.price) * (item.quantity || 1)).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 flex flex-col items-end">
                                            <div className="flex justify-between w-full max-w-xs mb-4">
                                                <span className="text-gray-600">Subtotal</span>
                                                <span className="font-medium text-brand-black">#{getCartTotal().toLocaleString()}</span>
                                            </div>
                                            <button
                                                className="w-full max-w-xs py-3 bg-brand-black text-brand-white rounded-lg font-medium flex justify-center items-center gap-2 hover:bg-gray-800 transition-colors"
                                                onClick={() => {
                                                    // This will trigger the checkout flow via Header's Cart drawer typically,
                                                    // but here we can just show the user a hint or open the drawer if we had access to setIsCartOpen.
                                                    // Given setIsCartOpen is mostly in Header, clicking checkout might just redirect to '/'
                                                    // For now, redirecting to store so they can click the floating cart
                                                    alert('To proceed to checkout, click the cart icon in the top right!');
                                                }}
                                            >
                                                <CreditCard className="w-4 h-4" /> Proceed to Checkout
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
