import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

// Guests' wishlists live in this browser; once signed in they move to the account
const STORAGE_KEY = 'wishlist';
// An expired session shouldn't bounce the shopper to the login page just for the wishlist
const BACKGROUND = { skipAuthRedirect: true };

const readLocal = () => {
    try {
        const ids = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(ids) ? ids.filter(id => typeof id === 'string') : [];
    } catch {
        return [];
    }
};

const writeLocal = (ids) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
        // Storage full or blocked - the wishlist just won't survive a refresh
    }
};

export const WishlistProvider = ({ children }) => {
    const { user } = useAuth();
    const accountKey = user?.username || null; // usernames are unique
    const [localIds, setLocalIds] = useState(readLocal);
    const [account, setAccount] = useState(null); // { key, ids } as loaded from the signed-in account

    // Only use the account's list while that same account is signed in
    const inAccount = accountKey !== null && account?.key === accountKey;
    const ids = inAccount ? account.ids : localIds;
    const setIds = (next) => (inAccount ? setAccount({ key: accountKey, ids: next }) : setLocalIds(next));

    useEffect(() => {
        if (!accountKey) return;
        let cancelled = false;
        const local = readLocal();
        const request = local.length > 0
            ? axios.post('/api/wishlist/merge', { ids: local }, BACKGROUND)
            : axios.get('/api/wishlist', BACKGROUND);
        request
            .then(({ data }) => {
                if (cancelled) return;
                setAccount({ key: accountKey, ids: data.ids });
                writeLocal([]); // now saved in the account
                setLocalIds([]);
            })
            .catch(err => console.error('Failed to load wishlist:', err)); // keep using this browser's list
        return () => { cancelled = true; };
    }, [accountKey]);

    const isInWishlist = (product) => ids.includes(product._id);

    const toggleWishlist = (product) => {
        const id = product._id;
        const saved = ids.includes(id);
        const previous = ids;
        const next = saved ? ids.filter(x => x !== id) : [...ids, id];
        setIds(next); // update straight away, roll back if the server says no

        if (!inAccount) {
            writeLocal(next);
            return;
        }
        const request = saved
            ? axios.delete(`/api/wishlist/${id}`, BACKGROUND)
            : axios.put(`/api/wishlist/${id}`, {}, BACKGROUND);
        request
            .then(({ data }) => setIds(data.ids))
            .catch(err => {
                setIds(previous);
                alert(err.response?.data?.message || 'Could not update your wishlist. Please try again.');
            });
    };

    return (
        <WishlistContext.Provider value={{ wishlistIds: ids, isInWishlist, toggleWishlist, wishlistInAccount: inAccount }}>
            {children}
        </WishlistContext.Provider>
    );
};
