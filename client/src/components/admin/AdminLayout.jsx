import React, { useState } from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Package, LogOut, Users, Key, Tags } from 'lucide-react';
import clsx from 'clsx';
import Logo from '../Logo';

const STAFF_ROLES = ['admin', 'manager', 'salesrep', 'superadmin'];

const AdminLayout = () => {
    const { user, loading, logout } = useAuth();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/admin/login" />;
    if (!STAFF_ROLES.includes(user.role)) {
        // Logged in as a customer - don't show the admin shell
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
                    <h2 className="text-xl font-bold text-slate-800 mb-2">No admin access</h2>
                    <p className="text-gray-500 mb-6">You're signed in as <strong>{user.username}</strong>, which is a customer account.</p>
                    <div className="flex gap-3 justify-center">
                        <Link to="/" className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Back to shop</Link>
                        <button onClick={logout} className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800">Log out</button>
                    </div>
                </div>
            </div>
        );
    }

    const navItems = [
        { label: 'Products', icon: Package, path: '/admin/products' },
        { label: 'Categories', icon: Tags, path: '/admin/categories' },
        { label: 'Orders', icon: LayoutDashboard, path: '/admin/orders' },
        ...(user?.role === 'admin' || user?.role === 'superadmin' 
            ? [{ label: 'Users', icon: Users, path: '/admin/users' }] 
            : []),
    ];

    const closeSidebar = () => setIsSidebarOpen(false);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row relative">
            
            {/* Mobile Header Bar */}
            <div className="md:hidden flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-20">
                <Link to="/admin">
                    <Logo dark={false} className="scale-75 origin-left" />
                </Link>
                <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 bg-gray-100 rounded-md text-slate-800 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={closeSidebar}
                ></div>
            )}

            {/* Sidebar */}
            <div className={clsx(
                "fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 h-full",
                isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
            )}>
                <div className="p-4 md:p-6 border-b border-slate-800 flex items-center justify-between md:justify-center">
                    <Link to="/admin" onClick={closeSidebar}>
                        <Logo dark={true} className="scale-75 md:scale-90" />
                    </Link>
                    <button onClick={closeSidebar} className="md:hidden p-1 text-slate-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={closeSidebar}
                            className={clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                                location.pathname === item.path
                                    ? "bg-slate-800 text-white"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </Link>
                    ))}

                    <Link
                        to="/admin/forgot-password"
                        onClick={closeSidebar}
                        className={clsx(
                            "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                            location.pathname === '/admin/forgot-password'
                                ? "bg-slate-800 text-white"
                                : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        )}
                    >
                        <Key className="w-5 h-5" />
                        <span>Change Password</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto bg-gray-50 md:bg-gray-100 min-h-[calc(100vh-64px)] md:min-h-screen">
                <Outlet />
            </div>
        </div>
    );
};

export default AdminLayout;
