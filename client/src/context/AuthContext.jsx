import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        setLoading(false);

        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                // A 401 from login/register just means wrong credentials - let the form show the error
                const isAuthAttempt = /\/api\/auth\/(login|register)$/.test(error.config?.url || '');
                if (error.response && error.response.status === 401 && !isAuthAttempt) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    delete axios.defaults.headers.common['Authorization'];
                    setUser(null);
                    if (window.location.pathname.startsWith('/admin')) {
                        window.location.href = '/admin/login';
                    } else {
                        window.location.href = '/login';
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => axios.interceptors.response.eject(interceptor);
    }, []);

    const login = async (username, password) => {
        try {
            const { data } = await axios.post('/api/auth/login', { username, password });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
            setUser(data.user);
            return { success: true, user: data.user };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const register = async (username, email, password, phone) => {
        try {
            const { data } = await axios.post('/api/auth/register', { username, email, password, phone });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
            setUser(data.user);
            return { success: true, user: data.user };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    const updateProfile = async (email) => {
        try {
            const { data } = await axios.put('/api/auth/profile', { email });
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
            return { success: true, user: data.user };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to update profile'
            };
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
};
