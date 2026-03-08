import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Optionally redirect back to where they came from (e.g., checkout)
    const from = location.state?.from?.pathname || '/dashboard';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await login(username, password);
        if (result.success) {
            navigate(from, { replace: true });
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="min-h-screen bg-brand-white flex flex-col">
            <Header />
            <div className="flex-1 flex items-center justify-center py-20 px-4 md:px-0 mt-16 md:mt-20">
                <div className="bg-white p-8 md:p-10 rounded-xl shadow-lg border border-gray-100 w-full max-w-md animate-fade-in-up">
                    <h2 className="text-3xl font-serif text-center text-brand-black mb-2">Welcome Back</h2>
                    <p className="text-gray-500 text-center text-sm mb-8">Sign in to your account to continue</p>

                    {error && (
                        <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-6 text-sm text-center border border-red-100">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-1 focus:ring-brand-black focus:border-brand-black outline-none transition-colors"
                                placeholder="Enter your username"
                                required
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-gray-700">Password</label>
                                <Link to="/forgot-password" className="text-xs text-gray-500 hover:text-brand-black transition-colors">Forgot Password?</Link>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-1 focus:ring-brand-black focus:border-brand-black outline-none transition-colors"
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 bg-brand-black text-brand-white rounded-lg font-medium tracking-wide hover:bg-gray-800 transition-colors mt-2"
                        >
                            Log In
                        </button>

                        <div className="text-center mt-6 text-sm text-gray-600">
                            Don't have an account?{' '}
                            <Link
                                to="/register"
                                className="font-medium text-brand-black hover:underline"
                            >
                                Register here
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
