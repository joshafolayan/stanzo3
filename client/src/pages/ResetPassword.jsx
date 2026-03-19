import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            await axios.post('/api/auth/reset-password', {
                token,
                newPassword
            });
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to reset password. Link may be invalid or expired.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full">
                    <div className="text-red-500 mb-4 mx-auto w-12 h-12 flex items-center justify-center bg-red-50 rounded-full">
                        <Lock size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Invalid Link</h2>
                    <p className="text-gray-600 mb-6">This password reset link is invalid or missing a token.</p>
                    <button onClick={() => navigate('/login')} className="text-blue-600 font-bold hover:underline">
                        Return to Login
                    </button>
                    <div className="mt-4">
                        <button onClick={() => navigate('/forgot-password')} className="text-blue-600 font-bold hover:underline">
                            Request New Link
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Reset Password</h1>
                    <p className="text-gray-500 mt-2">Create a new secure password.</p>
                </div>

                {success ? (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-6 rounded-lg text-center">
                        <p className="font-bold text-lg mb-2">Success!</p>
                        <p>Your password has been reset.</p>
                        <p className="text-sm mt-4 text-green-600">Redirecting to login...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all pr-12"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                                >
                                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all pr-12"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full text-white font-bold py-3 rounded-lg transition-all duration-200 shadow-lg shadow-blue-200 flex items-center justify-center gap-2 ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {isSubmitting ? 'Resetting...' : 'Reset Password'}
                            {!isSubmitting && <ArrowRight size={18} />}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
