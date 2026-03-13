import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await register(username, email, password);
        if (result.success) {
            setIsSuccess(true);
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="min-h-screen bg-brand-white flex flex-col">
            <Header />
            <div className="flex-1 flex items-center justify-center py-20 px-4 md:px-0 mt-16 md:mt-20">
                <div className="bg-white p-8 md:p-10 rounded-xl shadow-lg border border-gray-100 w-full max-w-md animate-fade-in-up">
                    {isSuccess ? (
                        <div className="text-center py-8">
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-serif text-brand-black mb-2">Registration Successful</h2>
                            <p className="text-gray-500">Redirecting to your dashboard...</p>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-3xl font-serif text-center text-brand-black mb-2">Create Account</h2>
                            <p className="text-gray-500 text-center text-sm mb-8">Join us to manage orders and track history</p>

                    {error && (
                        <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-6 text-sm text-center border border-red-100">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-brand-black focus:border-brand-black outline-none transition-colors"
                                placeholder="Choose a username"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-brand-black focus:border-brand-black outline-none transition-colors"
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-brand-black focus:border-brand-black outline-none transition-colors"
                                placeholder="Create a strong password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 bg-brand-black text-brand-white rounded-lg font-medium tracking-wide hover:bg-gray-800 transition-colors mt-4"
                        >
                            Create Account
                        </button>

                        <div className="text-center mt-6 text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link
                                to="/login"
                                className="font-medium text-brand-black hover:underline"
                            >
                                Log in
                            </Link>
                        </div>
                    </form>
                    </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Register;
