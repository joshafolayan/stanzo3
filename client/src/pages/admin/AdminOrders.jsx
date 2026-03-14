import React from 'react';

const AdminOrders = () => {
    return (
        <div className="p-4 md:p-8">
            <h1 className="text-xl md:text-3xl font-serif text-slate-900 mb-6 md:mb-8">Orders Management</h1>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                <p className="text-slate-500 mb-4">You have no orders yet.</p>
                <p className="text-sm text-slate-400">Order management system is under construction.</p>
            </div>
        </div>
    );
};

export default AdminOrders;
