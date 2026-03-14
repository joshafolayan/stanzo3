/**
 * Utility for formatting product image URLs.
 * Handles both relative local paths and absolute Cloudinary URLs.
 */
export const getImageUrl = (path) => {
    if (!path) return '/placeholder.jpg';
    
    // Cloudinary URLs, data URIs, or any absolute URLs
    if (path.startsWith('http') || path.startsWith('data:')) {
        return path;
    }
    
    // For legacy local paths (e.g., "/products/image.jpg"), 
    // simply return the relative path. The browser will automatically 
    // resolve it against the current domain in both Dev and Production.
    return path.startsWith('/') ? path : `/${path}`;
};
