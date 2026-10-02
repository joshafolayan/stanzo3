import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm, useFieldArray } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, X, Star } from 'lucide-react';
import { getImageUrl } from '../../utils/image';
import { getNearestColorName } from '../../utils/colors';
import { stockMode, getTotalStock } from '../../utils/stock';

const parseSizes = (sizes) => (typeof sizes === 'string' ? sizes.split(',') : (sizes || []))
    .map(s => s.trim()).filter(Boolean);
const optionKey = (color, size) => `${color}|${size}`;

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [categories, setCategories] = useState([]);
    const [existingImages, setExistingImages] = useState([]); // URLs already saved on the product
    const [newImages, setNewImages] = useState([]); // { file, preview } selected but not yet uploaded
    const itemsPerPage = 10;
    const MAX_NEW_IMAGES = 5;
    const [variantQty, setVariantQty] = useState({}); // "colour|size" -> quantity typed in the stock grid
    const [showStockErrors, setShowStockErrors] = useState(false);
    const [bulkQty, setBulkQty] = useState('');

    const { register, control, handleSubmit, reset, setValue, watch } = useForm({
        defaultValues: {
            name: '',
            price: '',
            discountPercentage: '',
            stockQuantity: '',
            category: 'Bags',
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

    const fetchCategories = async () => {
        try {
            const { data } = await axios.get('/api/admin/categories');
            setCategories(data.map(c => c.name));
        } catch (error) {
            console.error('Failed to fetch categories', error);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const clearNewImages = () => {
        setNewImages(prev => {
            prev.forEach(img => URL.revokeObjectURL(img.preview));
            return [];
        });
    };

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files || []);
        e.target.value = ''; // allow re-selecting the same file
        const room = MAX_NEW_IMAGES - newImages.length;
        if (files.length > room) {
            alert(`You can upload up to ${MAX_NEW_IMAGES} new images at a time.`);
        }
        const added = files.slice(0, Math.max(room, 0)).map(file => ({ file, preview: URL.createObjectURL(file) }));
        setNewImages(prev => [...prev, ...added]);
    };

    const removeNewImage = (index) => {
        setNewImages(prev => {
            URL.revokeObjectURL(prev[index].preview);
            return prev.filter((_, i) => i !== index);
        });
    };

    const removeExistingImage = (index) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    const makeCoverImage = (index) => {
        setExistingImages(prev => [prev[index], ...prev.filter((_, i) => i !== index)]);
    };

    // Calculate pagination
    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentProducts = products.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(products.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // The stock grid follows whatever colours and sizes are currently in the form
    const watchedColors = watch('colors') || [];
    const watchedSizes = watch('sizes');
    const stockColors = watchedColors.map(c => (c?.name || '').trim()).filter(Boolean);
    const stockSizes = parseSizes(watchedSizes);
    const hasOptions = stockColors.length > 0 || stockSizes.length > 0;
    const stockCombos = hasOptions
        ? (stockColors.length > 0 ? stockColors : ['']).flatMap(color =>
            (stockSizes.length > 0 ? stockSizes : ['']).map(size => ({ color, size })))
        : [];
    const isValidQty = (value) => value !== undefined && value !== '' && Number.isInteger(Number(value)) && Number(value) >= 0;
    const missingCombos = stockCombos.filter(({ color, size }) => !isValidQty(variantQty[optionKey(color, size)]));

    const setQty = (color, size, value) => setVariantQty(prev => ({ ...prev, [optionKey(color, size)]: value }));
    const applyBulkQty = () => {
        if (!isValidQty(bulkQty)) return;
        setVariantQty(prev => {
            const next = { ...prev };
            stockCombos.forEach(({ color, size }) => { next[optionKey(color, size)] = bulkQty; });
            return next;
        });
    };

    const onSubmit = async (data) => {
        // Every option needs a stock number - nothing is guessed
        if (hasOptions && missingCombos.length > 0) {
            setShowStockErrors(true);
            return;
        }
        if (!hasOptions && !isValidQty(data.stockQuantity)) {
            setShowStockErrors(true);
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();

        const productPayload = {
            name: data.name,
            price: Number(data.price),
            discountPercentage: data.discountPercentage ? Number(data.discountPercentage) : 0,
            category: data.category,
            colors: data.colors,
            sizes: parseSizes(data.sizes)
        };
        if (hasOptions) {
            productPayload.variantStock = stockCombos.map(({ color, size }) => ({ color, size, quantity: Number(variantQty[optionKey(color, size)]) }));
        } else {
            productPayload.stockQuantity = Number(data.stockQuantity);
        }
        if (editingProduct) {
            productPayload.images = existingImages; // images kept; anything left out gets deleted
        }

        formData.append('productData', JSON.stringify(productPayload));
        newImages.forEach(img => formData.append('images', img.file));

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
            alert(error.response?.data?.message || 'Failed to save product');
        } finally {
            setIsSubmitting(false);
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
        clearNewImages();
        fetchCategories();
        setShowStockErrors(false);
        setBulkQty('');
        setVariantQty(Object.fromEntries((product?.variantStock || []).map(v => [optionKey(v.color, v.size), String(v.quantity)])));
        if (product) {
            reset({
                name: product.name,
                price: product.price,
                discountPercentage: product.discountPercentage || '',
                // The single number only carries over for products without colours/sizes
                stockQuantity: stockMode(product) === 'single' && !product.colors?.length && !product.sizes?.length ? product.stockQuantity : '',
                category: product.category || categories[0] || '',
                colors: product.colors,
                sizes: product.sizes.join(', ') // Simple text edit for sizes
            });
            setExistingImages(product.images || []);
        } else {
            reset({
                name: '',
                price: '',
                discountPercentage: '',
                stockQuantity: '',
                category: categories[0] || '',
                colors: [{ name: 'Black', hex: '#000000' }],
                sizes: ''
            });
            setExistingImages([]);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        setExistingImages([]);
        clearNewImages();
        reset();
    };

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8">
                <h1 className="text-xl md:text-2xl font-bold text-slate-800">Product Management</h1>
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
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">Image</th>
                            <th className="p-4 font-semibold text-gray-600">Name</th>
                            <th className="p-4 font-semibold text-gray-600">Price</th>
                            <th className="p-4 font-semibold text-gray-600">Stock</th>
                            <th className="p-4 font-semibold text-gray-600">Variants</th>
                            <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {currentProducts.map(product => (
                            <tr key={product.id} className="hover:bg-gray-50">
                                <td className="p-4">
                                    <img src={product.images && product.images.length > 0 ? getImageUrl(product.images[0]) : '/placeholder.jpg'} alt={product.name} className="w-12 h-12 rounded object-cover bg-gray-200" />
                                </td>
                                <td className="p-4 font-medium">
                                    {product.name}
                                    <div className="text-xs text-gray-500 font-normal mt-1">{product.category || 'Uncategorized'}</div>
                                </td>
                                <td className="p-4 text-gray-600">#{product.price.toLocaleString()}</td>
                                <td className="p-4 text-sm">
                                    {(() => {
                                        const total = getTotalStock(product);
                                        const soldOutOptions = (product.variantStock || []).filter(v => v.quantity <= 0).length;
                                        if (total === null) return <span className="text-gray-400">Not tracked</span>;
                                        if (total <= 0) return <span className="bg-red-50 text-red-700 font-semibold px-2 py-0.5 rounded">Sold out</span>;
                                        return (
                                            <>
                                                <span className={total <= 5 ? 'text-amber-600 font-semibold' : 'text-gray-700'}>{total} left</span>
                                                {soldOutOptions > 0 && (
                                                    <div className="text-xs text-red-600 mt-0.5">{soldOutOptions} option{soldOutOptions > 1 ? 's' : ''} sold out</div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </td>
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
                                    Showing <span className="font-medium">{indexOfFirst + 1}</span> to <span className="font-medium">{Math.min(indexOfLast, products.length)}</span> of <span className="font-medium">{products.length}</span> results
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

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                            <button onClick={closeModal}><X className="text-gray-500 hover:text-red-500" /></button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Product Name</label>
                                    <input {...register('name', { required: true })} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Price (#)</label>
                                    <input type="number" {...register('price', { required: true })} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Discount (%)</label>
                                    <input type="number" min="0" max="100" {...register('discountPercentage')} placeholder="e.g. 10" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium">Category</label>
                                    <Link to="/admin/categories" className="text-xs text-blue-600 hover:underline">Manage categories</Link>
                                </div>
                                <select {...register('category', { required: true })} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                    <option value="" disabled>Select a category</option>
                                    {/* Keep the product's current category selectable even if it was removed from the list */}
                                    {editingProduct?.category && !categories.includes(editingProduct.category) && (
                                        <option value={editingProduct.category}>{editingProduct.category}</option>
                                    )}
                                    {categories.map(name => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Product Images</label>
                                {(existingImages.length > 0 || newImages.length > 0) && (
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-3">
                                        {existingImages.map((img, index) => (
                                            <div key={img} className="relative group aspect-square rounded-lg overflow-hidden border bg-gray-100">
                                                <img src={getImageUrl(img)} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                                                {index === 0 && (
                                                    <span className="absolute bottom-1 left-1 bg-blue-600 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">Cover</span>
                                                )}
                                                <button type="button" onClick={() => removeExistingImage(index)} title="Remove image" className="absolute top-1 right-1 bg-white/90 text-red-600 rounded-full p-1 shadow hover:bg-red-50">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                                {index > 0 && (
                                                    <button type="button" onClick={() => makeCoverImage(index)} title="Make cover image" className="absolute top-1 left-1 bg-white/90 text-gray-600 rounded-full p-1 shadow hover:text-blue-600">
                                                        <Star className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {newImages.map((img, index) => (
                                            <div key={img.preview} className="relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-blue-400 bg-gray-100">
                                                <img src={img.preview} alt={img.file.name} className="w-full h-full object-cover" />
                                                <span className="absolute bottom-1 left-1 bg-green-600 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">New</span>
                                                <button type="button" onClick={() => removeNewImage(index)} title="Remove image" className="absolute top-1 right-1 bg-white/90 text-red-600 rounded-full p-1 shadow hover:bg-red-50">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {editingProduct && existingImages.length < (editingProduct.images?.length || 0) && (
                                    <p className="text-xs text-amber-600 mb-2">Removed images will be deleted when you save.</p>
                                )}
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition">
                                    <input type="file" onChange={handleImageSelect} multiple accept="image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                    <p className="text-xs text-gray-400 mt-2">Up to {MAX_NEW_IMAGES} new images per save. New images are added after existing ones.</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Colors</label>
                                <div className="space-y-2">
                                    {colorFields.map((field, index) => (
                                        <div key={field.id} className="flex gap-2 items-center">
                                            <input {...register(`colors.${index}.name`)} placeholder="Color Name" className="border rounded-lg p-2 flex-1" />
                                            <input 
                                                type="color" 
                                                {...register(`colors.${index}.hex`, {
                                                    onChange: (e) => {
                                                        setValue(`colors.${index}.name`, getNearestColorName(e.target.value));
                                                    }
                                                })} 
                                                className="h-10 w-16 border rounded cursor-pointer" 
                                            />
                                            <button type="button" onClick={() => removeColor(index)} className="text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => appendColor({ name: 'Black', hex: '#000000' })} className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
                                        <Plus className="w-4 h-4" /> Add Color
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Sizes (comma separated)</label>
                                <input {...register('sizes')} placeholder="S, M, L, XL" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Quantity in Stock</label>
                                {!hasOptions ? (
                                    <>
                                        <input
                                            type="number" min="0" step="1"
                                            {...register('stockQuantity')}
                                            placeholder="e.g. 10"
                                            className={`w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none ${showStockErrors && !isValidQty(watch('stockQuantity')) ? 'border-red-500 bg-red-50' : ''}`}
                                        />
                                        {showStockErrors && !isValidQty(watch('stockQuantity')) && (
                                            <p className="text-xs text-red-600 mt-1">Enter how many are in stock (0 if none).</p>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {editingProduct && stockMode(editingProduct) === 'single' && (
                                            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mb-2">
                                                This product had one stock number ({editingProduct.stockQuantity}) for all options. Enter stock for each option below.
                                            </p>
                                        )}
                                        <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                                            <span>Set all to</span>
                                            <input type="number" min="0" step="1" value={bulkQty} onChange={(e) => setBulkQty(e.target.value)} className="w-16 border rounded p-1" />
                                            <button type="button" onClick={applyBulkQty} disabled={!isValidQty(bulkQty)} className="text-blue-600 font-medium hover:underline disabled:opacity-40 disabled:no-underline">Apply</button>
                                        </div>
                                        <div className="overflow-x-auto border rounded-lg">
                                            <table className="text-sm w-full">
                                                {stockSizes.length > 0 && (
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            {stockColors.length > 0 && <th className="p-2 text-left font-medium text-gray-500">Colour</th>}
                                                            {stockSizes.map(size => <th key={size} className="p-2 font-medium text-gray-500 text-center">{size}</th>)}
                                                        </tr>
                                                    </thead>
                                                )}
                                                <tbody className="divide-y">
                                                    {(stockColors.length > 0 ? stockColors : ['']).map(color => (
                                                        <tr key={color || 'all'}>
                                                            {stockColors.length > 0 && <td className="p-2 font-medium text-gray-700 whitespace-nowrap">{color}</td>}
                                                            {(stockSizes.length > 0 ? stockSizes : ['']).map(size => {
                                                                const value = variantQty[optionKey(color, size)] ?? '';
                                                                const invalid = showStockErrors && !isValidQty(value);
                                                                return (
                                                                    <td key={size || 'qty'} className="p-1.5 text-center">
                                                                        <input
                                                                            type="number" min="0" step="1"
                                                                            value={value}
                                                                            onChange={(e) => setQty(color, size, e.target.value)}
                                                                            aria-label={`Stock for ${[color, size].filter(Boolean).join(' ')}`}
                                                                            className={`w-16 border rounded p-1 text-center focus:ring-2 focus:ring-blue-500 outline-none ${invalid ? 'border-red-500 bg-red-50' : ''}`}
                                                                        />
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        {showStockErrors && missingCombos.length > 0 && (
                                            <p className="text-xs text-red-600 mt-1">Enter a quantity for every option ({missingCombos.length} missing). Use 0 for options you don't have.</p>
                                        )}
                                    </>
                                )}
                                <p className="text-xs text-gray-400 mt-1">Stock goes down when you mark an order as paid. Options at 0 can't be bought.</p>
                            </div>

                            <div className="pt-4 border-t flex justify-end gap-3">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className={`px-4 py-2 text-white font-bold rounded-lg transition-colors ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                                >
                                    {isSubmitting ? 'Saving...' : 'Save Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminProducts;
