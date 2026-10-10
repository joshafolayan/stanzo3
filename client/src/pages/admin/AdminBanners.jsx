import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, X, Eye, EyeOff, ImagePlus } from 'lucide-react';

const EMPTY_FORM = { eyebrow: '', title: '', subtitle: '', buttonText: '', buttonLink: '', active: true, sortOrder: 0 };

const LINK_SUGGESTIONS = ['/shop', '/shop?filter=deals', '/shop?filter=new', '/shop?category=Bags'];

const AdminBanners = () => {
    const [banners, setBanners] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editing, setEditing] = useState(null); // banner being edited, or null when adding
    const [form, setForm] = useState(EMPTY_FORM);
    const [image, setImage] = useState(null); // { file, preview } chosen but not uploaded yet
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchBanners = async () => {
        try {
            const { data } = await axios.get('/api/admin/banners');
            setBanners(data);
        } catch (error) {
            console.error('Failed to fetch banners', error);
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    const clearImage = () => {
        if (image) URL.revokeObjectURL(image.preview);
        setImage(null);
    };

    const openForm = (banner = null) => {
        setEditing(banner);
        setForm(banner
            ? { eyebrow: banner.eyebrow, title: banner.title, subtitle: banner.subtitle, buttonText: banner.buttonText, buttonLink: banner.buttonLink, active: banner.active, sortOrder: banner.sortOrder }
            : { ...EMPTY_FORM, sortOrder: banners.length });
        clearImage();
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditing(null);
        clearImage();
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleImageSelect = (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        clearImage();
        setImage({ file, preview: URL.createObjectURL(file) });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!editing && !image) {
            alert('Please choose an image for the banner.');
            return;
        }
        const formData = new FormData();
        Object.entries(form).forEach(([key, value]) => formData.append(key, value));
        if (image) formData.append('image', image.file);

        setIsSubmitting(true);
        try {
            if (editing) {
                await axios.put(`/api/admin/banners/${editing._id}`, formData);
            } else {
                await axios.post('/api/admin/banners', formData);
            }
            closeForm();
            fetchBanners();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to save banner');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleActive = async (banner) => {
        const formData = new FormData();
        formData.append('active', !banner.active);
        try {
            await axios.put(`/api/admin/banners/${banner._id}`, formData);
            fetchBanners();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update banner');
        }
    };

    const deleteBanner = async (banner) => {
        if (!window.confirm(`Delete the banner "${banner.title}"?`)) return;
        try {
            await axios.delete(`/api/admin/banners/${banner._id}`);
            fetchBanners();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete banner');
        }
    };

    const previewSrc = image?.preview || editing?.image;
    const inputClass = 'w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none';

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-800">Homepage Banners</h1>
                    <p className="text-sm text-gray-500 mt-1">Visible banners rotate at the top of the homepage. With none visible, the standard welcome banner is shown.</p>
                </div>
                <button onClick={() => openForm()} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition shrink-0">
                    <Plus className="w-5 h-5" />
                    Add Banner
                </button>
            </div>

            <div className="space-y-4">
                {banners.map(banner => (
                    <div key={banner._id} className={`bg-white rounded-xl shadow-sm overflow-hidden flex flex-col sm:flex-row ${banner.active ? '' : 'opacity-60'}`}>
                        <img src={banner.image} alt="" className="w-full sm:w-56 h-32 object-cover bg-gray-100 shrink-0" />
                        <div className="flex-1 p-4 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-gray-400">#{banner.sortOrder}</span>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${banner.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {banner.active ? 'Visible' : 'Hidden'}
                                </span>
                            </div>
                            <p className="font-semibold text-slate-800 truncate">{banner.title}</p>
                            {banner.subtitle && <p className="text-sm text-gray-500 line-clamp-2">{banner.subtitle}</p>}
                            {banner.buttonText && (
                                <p className="text-xs text-gray-400 mt-1 truncate">Button: “{banner.buttonText}” → {banner.buttonLink || '(no link)'}</p>
                            )}
                        </div>
                        <div className="flex sm:flex-col items-center justify-end gap-1 p-3 border-t sm:border-t-0 sm:border-l">
                            <button onClick={() => toggleActive(banner)} title={banner.active ? 'Hide' : 'Show'} className="text-slate-600 hover:bg-gray-100 p-2 rounded">
                                {banner.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button onClick={() => openForm(banner)} title="Edit" className="text-blue-600 hover:bg-blue-50 p-2 rounded"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => deleteBanner(banner)} title="Delete" className="text-red-600 hover:bg-red-50 p-2 rounded"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </div>
                ))}
                {banners.length === 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">No banners yet.</div>
                )}
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold">{editing ? 'Edit Banner' : 'Add Banner'}</h2>
                            <button onClick={closeForm}><X className="text-gray-500 hover:text-red-500" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium mb-1">Image</label>
                                <label className="relative flex items-center justify-center w-full aspect-[21/9] rounded-lg bg-gray-100 overflow-hidden cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-500">
                                    {previewSrc ? (
                                        <img src={previewSrc} alt="" className="absolute inset-0 w-full h-full object-cover" />
                                    ) : (
                                        <span className="flex flex-col items-center text-gray-500 text-sm">
                                            <ImagePlus className="w-8 h-8 mb-2" />
                                            Choose an image
                                        </span>
                                    )}
                                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageSelect} className="hidden" />
                                </label>
                                <p className="text-xs text-gray-500 mt-1">Wide photos work best (about 2000 × 850). Text sits on the left, so keep the subject to the right. Max 10MB.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Small line above title <span className="font-normal text-gray-400">(optional)</span></label>
                                    <input name="eyebrow" value={form.eyebrow} onChange={handleChange} maxLength={80} placeholder="e.g. New season" className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Title</label>
                                    <input name="title" value={form.title} onChange={handleChange} maxLength={120} required placeholder="e.g. Fresh bags just landed" className={inputClass} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Text <span className="font-normal text-gray-400">(optional)</span></label>
                                <textarea name="subtitle" value={form.subtitle} onChange={handleChange} maxLength={300} rows={2} className={inputClass} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Button text <span className="font-normal text-gray-400">(optional)</span></label>
                                    <input name="buttonText" value={form.buttonText} onChange={handleChange} maxLength={40} placeholder="e.g. Shop now" className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Button link</label>
                                    <input name="buttonLink" value={form.buttonLink} onChange={handleChange} maxLength={500} list="banner-link-suggestions" placeholder="/shop?filter=deals" className={inputClass} />
                                    <datalist id="banner-link-suggestions">
                                        {LINK_SUGGESTIONS.map(link => <option key={link} value={link} />)}
                                    </datalist>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 items-end">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Order</label>
                                    <input type="number" step="1" name="sortOrder" value={form.sortOrder} onChange={handleChange} className={inputClass} />
                                    <p className="text-xs text-gray-500 mt-1">Lower numbers show first.</p>
                                </div>
                                <label className="flex items-center gap-2 pb-7 cursor-pointer">
                                    <input type="checkbox" name="active" checked={form.active} onChange={handleChange} className="w-4 h-4" />
                                    <span className="text-sm font-medium">Visible on homepage</span>
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={closeForm} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                                    {isSubmitting ? 'Saving...' : 'Save Banner'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBanners;
