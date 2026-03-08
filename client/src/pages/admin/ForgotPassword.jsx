import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage('');

        try {
            const { data } = await axios.post('/api/auth/forgot-password', { email });
            setMessage(data.message);
        } catch (error) {
            setMessage(error.response?.data?.message || 'An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Forgot Password</h1>
                    <p className="text-gray-500 mt-2">Enter your email address to receive a reset link.</p>
                </div>

                {message ? (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-lg mb-6 text-center">
                        <p className="font-medium">{message}</p>
                        <Link to="/admin/login" className="block mt-4 text-blue-600 font-bold hover:underline">
                            Return to Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                placeholder="Enter your email address"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg shadow-blue-200 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Sending Link...' : 'Send Reset Link'}
                        </button>
                    </form>
                )}

                {!message && (
                    <div className="mt-6 text-center">
                        <Link to="/admin/login" className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors">
                            <ArrowLeft size={16} className="mr-1" />
                            Back to Login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
