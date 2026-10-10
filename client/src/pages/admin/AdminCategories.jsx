import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Check, X, ImagePlus, Loader2 } from 'lucide-react';

const AdminCategories = () => {
    const [categories, setCategories] = useState([]);
    const [newName, setNewName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingId, setUploadingId] = useState(null);

    const fetchCategories = async () => {
        try {
            const { data } = await axios.get('/api/admin/categories');
            setCategories(data);
        } catch (error) {
            console.error('Failed to fetch categories', error);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const addCategory = async (e) => {
        e.preventDefault();
        if (!newName.trim()) return;
        setIsSubmitting(true);
        try {
            await axios.post('/api/admin/categories', { name: newName.trim() });
            setNewName('');
            fetchCategories();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to add category');
        } finally {
            setIsSubmitting(false);
        }
    };

    const startEdit = (category) => {
        setEditingId(category._id);
        setEditName(category.name);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName('');
    };

    const saveEdit = async (category) => {
        if (!editName.trim() || editName.trim() === category.name) {
            cancelEdit();
            return;
        }
        if (category.productCount > 0 && !window.confirm(`Rename "${category.name}" to "${editName.trim()}"? ${category.productCount} product(s) will be moved to the new name.`)) {
            return;
        }
        try {
            await axios.put(`/api/admin/categories/${category._id}`, { name: editName.trim() });
            cancelEdit();
            fetchCategories();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update category');
        }
    };

    const deleteCategory = async (category) => {
        if (!window.confirm(`Delete the "${category.name}" category?`)) return;
        try {
            await axios.delete(`/api/admin/categories/${category._id}`);
            fetchCategories();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete category');
        }
    };

    const uploadImage = async (category, file) => {
        if (!file) return;
        const formData = new FormData();
        formData.append('image', file);
        setUploadingId(category._id);
        try {
            await axios.put(`/api/admin/categories/${category._id}/image`, formData);
            fetchCategories();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to upload image');
        } finally {
            setUploadingId(null);
        }
    };

    const removeImage = async (category) => {
        if (!window.confirm(`Remove the image for "${category.name}"? The shop will use one of its product photos instead.`)) return;
        try {
            await axios.delete(`/api/admin/categories/${category._id}/image`);
            fetchCategories();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to remove image');
        }
    };

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 mb-6 md:mb-8">Category Management</h1>

            <form onSubmit={addCategory} className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3">
                <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="New category name"
                    className="flex-1 border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                    type="submit"
                    disabled={isSubmitting || !newName.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition disabled:opacity-50"
                >
                    <Plus className="w-5 h-5" />
                    Add Category
                </button>
            </form>

            <p className="text-sm text-gray-500 mb-3">Category images appear in the "Shop by category" row on the homepage. Without one, the newest product's photo is used.</p>

            <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">Image</th>
                            <th className="p-4 font-semibold text-gray-600">Name</th>
                            <th className="p-4 font-semibold text-gray-600">Products</th>
                            <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {categories.map(category => (
                            <tr key={category._id} className="hover:bg-gray-50">
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <label
                                            title={category.image ? 'Replace image' : 'Upload image (shown on the shop homepage)'}
                                            className="relative w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-500 shrink-0"
                                        >
                                            {uploadingId === category._id ? (
                                                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                                            ) : category.image ? (
                                                <img src={category.image} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <ImagePlus className="w-5 h-5 text-gray-400" />
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                disabled={uploadingId !== null}
                                                onChange={(e) => {
                                                    uploadImage(category, e.target.files[0]);
                                                    e.target.value = '';
                                                }}
                                            />
                                        </label>
                                        {category.image && (
                                            <button onClick={() => removeImage(category)} title="Remove image" className="text-gray-400 hover:text-red-600 p-1 rounded"><X className="w-4 h-4" /></button>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 font-medium">
                                    {editingId === category._id ? (
                                        <input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') saveEdit(category);
                                                if (e.key === 'Escape') cancelEdit();
                                            }}
                                            autoFocus
                                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    ) : category.name}
                                </td>
                                <td className="p-4 text-gray-600">{category.productCount}</td>
                                <td className="p-4 text-right space-x-2 whitespace-nowrap">
                                    {editingId === category._id ? (
                                        <>
                                            <button onClick={() => saveEdit(category)} className="text-green-600 hover:bg-green-50 p-2 rounded"><Check className="w-4 h-4" /></button>
                                            <button onClick={cancelEdit} className="text-gray-500 hover:bg-gray-100 p-2 rounded"><X className="w-4 h-4" /></button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => startEdit(category)} className="text-blue-600 hover:bg-blue-50 p-2 rounded"><Edit className="w-4 h-4" /></button>
                                            <button
                                                onClick={() => deleteCategory(category)}
                                                disabled={category.productCount > 0}
                                                title={category.productCount > 0 ? 'Move or delete its products first' : 'Delete category'}
                                                className="text-red-600 hover:bg-red-50 p-2 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {categories.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-500">No categories yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminCategories;
