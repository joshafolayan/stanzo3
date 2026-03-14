import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updatingOrderId, setUpdatingOrderId] = useState(null);

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
            alert('Failed to update order status');
        } finally {
            setUpdatingOrderId(null);
        }
    };

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
            <h1 className="text-xl md:text-3xl font-serif text-slate-900 mb-6 md:mb-8">Orders Management</h1>
            {orders.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                    <p className="text-slate-500">You have no orders yet.</p>
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
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-sm">
                                {orders.map(order => (
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
                                        <td className="p-4 font-bold text-slate-900 border-l border-r">₦{order.totalAmount?.toLocaleString()}</td>
                                        <td className="p-4 relative">
                                            {updatingOrderId === order._id ? (
                                                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                                                    <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                                                </div>
                                            ) : (
                                                <select
                                                    value={order.status || 'pending'}
                                                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                                    className={`appearance-none font-medium text-xs px-3 py-1.5 rounded-full border outline-none cursor-pointer pr-6 shadow-sm
                                                        ${order.status === 'pending' ? 'bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100' :
                                                        order.status === 'processing' ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100' :
                                                        order.status === 'completed' || order.status === 'paid' ? 'bg-green-50 text-green-800 border-green-200 hover:bg-green-100' :
                                                        order.status === 'cancelled' ? 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100' :
                                                        'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'}`}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="processing">Processing</option>
                                                    <option value="completed">Completed</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrders;
