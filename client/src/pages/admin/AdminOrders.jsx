import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updatingOrderId, setUpdatingOrderId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const itemsPerPage = 10;

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: { 'Authorization': `Bearer ${token}` }
            };
            const res = await axios.get('/api/admin/orders', config);
            setOrders(res.data);
        } catch (err) {
            console.error('Failed to fetch orders:', err);
            setError('Failed to load orders.');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        setUpdatingOrderId(orderId);
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: { 'Authorization': `Bearer ${token}` }
            };
            await axios.put(`/api/admin/orders/${orderId}/status`, { status: newStatus }, config);
            
            // Re-fetch to guarantee sync with DB, or optimistically update
            await fetchOrders();
        } catch (err) {
            console.error('Failed to update status:', err);
            // Optionally could add a toast here
            alert(err.response?.data?.message || 'Failed to update order status');
        } finally {
            setUpdatingOrderId(null);
        }
    };

    // Filter orders based on search query
    const filteredOrders = orders.filter(order => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        
        const orderIdMatch = order._id.toLowerCase().includes(query);
        const statusMatch = (order.status || 'pending').toLowerCase().includes(query);
        const processedByMatch = (order.processedBy || 'system').toLowerCase().includes(query);
        const dateStr = new Date(order.createdAt).toLocaleDateString().toLowerCase();
        const dateMatch = dateStr.includes(query);
        
        const customerName = (order.customerInfo?.name || order.user?.username || 'guest').toLowerCase();
        const customerEmail = (order.customerInfo?.email || order.user?.email || '').toLowerCase();
        const customerPhone = (order.customerInfo?.phone || '').toLowerCase();
        const customerMatch = customerName.includes(query) || customerEmail.includes(query) || customerPhone.includes(query);

        return orderIdMatch || statusMatch || processedByMatch || dateMatch || customerMatch;
    });

    // Calculate pagination
    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (error) {
        return <div className="p-4 text-red-500 bg-red-50 rounded-lg">{error}</div>;
    }

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
                <h1 className="text-xl md:text-3xl font-serif text-slate-900">Orders Management</h1>
                <div className="relative w-full md:w-64">
                    <input 
                        type="text" 
                        placeholder="Search orders..." 
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1); // Reset to first page on search
                        }}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all"
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>
            
            {orders.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                    <p className="text-slate-500">You have no orders yet.</p>
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                    <p className="text-slate-500">No orders match your search.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
                                    <th className="p-4">Order ID</th>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Customer</th>
                                    <th className="p-4">Items</th>
                                    <th className="p-4">Total</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Processed By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-sm">
                                {currentOrders.map(order => (
                                    <tr key={order._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-mono text-slate-600 truncate max-w-[120px]" title={order._id}>{order._id.substring(0, 8)}...</td>
                                        <td className="p-4 whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString()}</td>
                                        <td className="p-4">
                                            <div className="font-medium">{order.customerInfo?.name || (order.user?.username) || 'Guest'}</div>
                                            <div className="text-slate-500 text-xs">{order.customerInfo?.email || (order.user?.email) || 'N/A'}</div>
                                            <div className="text-slate-500 text-xs">{order.customerInfo?.phone || 'N/A'}</div>
                                        </td>
                                        <td className="p-4">
                                            <ul className="list-disc list-inside">
                                                {order.items.map((item, idx) => (
                                                    <li key={idx} className="truncate max-w-[200px]" title={item.name}>
                                                        {item.quantity}x {item.name}
                                                    </li>
                                                ))}
                                            </ul>
                                        </td>
                                        <td className="p-4 font-bold text-slate-900 border-l border-r">#{order.totalAmount?.toLocaleString()}</td>
                                        <td className="p-4 relative">
                                            {updatingOrderId === order._id ? (
                                                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                                                    <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                                                </div>
                                            ) : (
                                                <select
                                                    value={order.status || 'pending'}
                                                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                                    disabled={order.status === 'delivered'}
                                                    className={`appearance-none font-medium text-xs px-3 py-1.5 rounded-full border outline-none cursor-pointer pr-6 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed
                                                        ${order.status === 'pending' ? 'bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100' :
                                                        order.status === 'processing' ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100' :
                                                        order.status === 'delivered' || order.status === 'shipped' || order.status === 'paid' ? 'bg-green-50 text-green-800 border-green-200' :
                                                        order.status === 'cancelled' ? 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100' :
                                                        'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'}`}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="processing">Processing</option>
                                                    <option value="shipped">Shipped</option>
                                                    <option value="delivered">Delivered</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                            )}
                                        </td>
                                        <td className="p-4 text-slate-600 font-medium">
                                            {order.processedBy || 'System'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-200 sm:px-6">
                            <div className="flex justify-between flex-1 sm:hidden">
                                <button
                                    onClick={() => paginate(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => paginate(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Showing <span className="font-medium">{indexOfFirst + 1}</span> to <span className="font-medium">{Math.min(indexOfLast, filteredOrders.length)}</span> of <span className="font-medium">{filteredOrders.length}</span> results
                                        </p>
                                    </div>
                                <div>
                                    <nav className="inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                        <button
                                            onClick={() => paginate(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="relative inline-flex items-center px-2 py-2 text-gray-400 rounded-l-md ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 focus:z-20 focus:outline-offset-0"
                                        >
                                            <span className="sr-only">Previous</span>
                                            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                        {[...Array(totalPages)].map((_, i) => (
                                            <button
                                                key={i + 1}
                                                onClick={() => paginate(i + 1)}
                                                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === i + 1 ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600' : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'}`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => paginate(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="relative inline-flex items-center px-2 py-2 text-gray-400 rounded-r-md ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 focus:z-20 focus:outline-offset-0"
                                        >
                                            <span className="sr-only">Next</span>
                                            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminOrders;
