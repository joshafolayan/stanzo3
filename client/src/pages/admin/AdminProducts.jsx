import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Edit, Trash2, X, Upload } from 'lucide-react';

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const { register, control, handleSubmit, reset, setValue, watch } = useForm({
        defaultValues: {
            name: '',
            price: '',
            colors: [{ name: '', hex: '' }],
            sizes: []
        }
    });

    const { fields: colorFields, append: appendColor, remove: removeColor } = useFieldArray({
        control,
        name: "colors"
    });

    const fetchProducts = async () => {
        try {
            const { data } = await axios.get('/api/admin/products');
            setProducts(data);
        } catch (error) {
            console.error('Failed to fetch products', error);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const onSubmit = async (data) => {
        const formData = new FormData();

        // Process sizes (convert comma separated string to array if needed, or handle array from checkboxes)
        // For simplicity, let's assume valid data or just simple text input for now split by comma
        const sizesArray = typeof data.sizes === 'string' ? data.sizes.split(',').map(s => s.trim()) : data.sizes;

        const productPayload = {
            name: data.name,
            price: Number(data.price),
            colors: data.colors,
            sizes: sizesArray
        };

        formData.append('productData', JSON.stringify(productPayload));
        if (data.image && data.image[0]) {
            formData.append('image', data.image[0]);
        }

        try {
            if (editingProduct) {
                await axios.put(`/api/admin/products/${editingProduct.id}`, formData);
            } else {
                await axios.post('/api/admin/products', formData);
            }
            fetchProducts();
            closeModal();
        } catch (error) {
            console.error('Error saving product', error);
            alert('Failed to save product');
        }
    };

    const deleteProduct = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await axios.delete(`/api/admin/products/${id}`);
                fetchProducts();
            } catch (error) {
                console.error('Error deleting product', error);
            }
        }
    };

    const openModal = (product = null) => {
        setEditingProduct(product);
        if (product) {
            setValue('name', product.name);
            setValue('price', product.price);
            setValue('colors', product.colors);
            setValue('sizes', product.sizes.join(', ')); // Simple text edit for sizes
        } else {
            reset({
                name: '',
                price: '',
                colors: [{ name: '', hex: '#000000' }],
                sizes: ''
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        reset();
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Product Management</h1>
                <button
                    onClick={() => openModal()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
                >
                    <Plus className="w-5 h-5" />
                    Add Product
                </button>
            </div>

            {/* Product List */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">Image</th>
                            <th className="p-4 font-semibold text-gray-600">Name</th>
                            <th className="p-4 font-semibold text-gray-600">Price</th>
                            <th className="p-4 font-semibold text-gray-600">Variants</th>
                            <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {products.map(product => (
                            <tr key={product.id} className="hover:bg-gray-50">
                                <td className="p-4">
                                    <img src={product.image} alt={product.name} className="w-12 h-12 rounded object-cover bg-gray-200" />
                                </td>
                                <td className="p-4 font-medium">{product.name}</td>
                                <td className="p-4 text-gray-600">₦{product.price.toLocaleString()}</td>
                                <td className="p-4 text-sm text-gray-500">
                                    {product.colors.length} colors, {product.sizes.length} sizes
                                </td>
                                <td className="p-4 text-right space-x-2">
                                    <button onClick={() => openModal(product)} className="text-blue-600 hover:bg-blue-50 p-2 rounded"><Edit className="w-4 h-4" /></button>
                                    <button onClick={() => deleteProduct(product.id)} className="text-red-600 hover:bg-red-50 p-2 rounded"><Trash2 className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                            <button onClick={closeModal}><X className="text-gray-500 hover:text-red-500" /></button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Product Name</label>
                                    <input {...register('name', { required: true })} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Price (₦)</label>
                                    <input type="number" {...register('price', { required: true })} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Product Image</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition">
                                    <input type="file" {...register('image')} accept="image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Colors</label>
                                <div className="space-y-2">
                                    {colorFields.map((field, index) => (
                                        <div key={field.id} className="flex gap-2 items-center">
                                            <input {...register(`colors.${index}.name`)} placeholder="Color Name" className="border rounded-lg p-2 flex-1" />
                                            <input type="color" {...register(`colors.${index}.hex`)} className="h-10 w-16 border rounded cursor-pointer" />
                                            <button type="button" onClick={() => removeColor(index)} className="text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => appendColor({ name: '', hex: '#000000' })} className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
                                        <Plus className="w-4 h-4" /> Add Color
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Sizes (comma separated)</label>
                                <input {...register('sizes')} placeholder="S, M, L, XL" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>

                            <div className="pt-4 border-t flex justify-end gap-3">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Save Product</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminProducts;
