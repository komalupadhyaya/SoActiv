import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export function SuperAdminLoginPage() {
    const navigate = useNavigate();
    const { refreshUser } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false); // Renamed to isLoading in snippet, but keeping original name for consistency
    const [isRedirecting, setIsRedirecting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true); // Using setLoading as per original component state

        try {
            const response = await axios.post(
                `${API_URL}/api/v1/super-admin/auth/login`,
                formData,
                { withCredentials: true }
            );

            if (response.data.success) {
                // ===== BROWSER-SCOPED AUTH (STANDARD KEYS) =====
                // Clear ALL auth data first (enforce single session per browser)
                localStorage.clear();

                // Store using STANDARD keys (same for all roles)
                const { token, user } = response.data.data;
                localStorage.setItem('accessToken', token);
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('role', user.role);

                // Verify user is actually a superadmin
                if (user.role !== 'superadmin') {
                    // If not superadmin, clear the stored data and throw an error
                    localStorage.clear();
                    throw new Error('Access denied. SuperAdmin privileges required.');
                }

                // Update AuthContext to refresh header
                await refreshUser();

                // Navigate to dashboard smoothly (SPA navigation)
                setIsRedirecting(true);
                navigate('/super-admin/dashboard');
                // Do NOT set loading(false) here to avoid UI flickering back to form
            } else {
                setLoading(false);
            }
        } catch (err: any) {
            setLoading(false);
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        }
    };

    if (isRedirecting) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-lg rounded-full mb-4 animate-bounce">
                        <Shield className="w-10 h-10 text-white" />
                    </div>
                    <div className="flex flex-col items-center mt-4 space-y-3">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                        <h2 className="text-2xl font-bold text-white">Redirecting...</h2>
                        <p className="text-indigo-200">Setting up your secure session</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo and Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-lg rounded-full mb-4">
                        <Shield className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2">Super Admin</h1>
                    <p className="text-indigo-200">SoActiv Platform Management</p>
                </div>

                {/* Login Card */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-100">{error}</p>
                            </div>
                        )}

                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-indigo-300" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="block w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                                    placeholder="superadmin@soactiv.com"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-indigo-300" />
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="block w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-indigo-900 py-3 px-4 rounded-lg font-semibold hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-indigo-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    {/* Security Notice */}
                    <div className="mt-6 pt-6 border-t border-white/20">
                        <p className="text-xs text-indigo-200 text-center">
                            🔒 All actions are logged and monitored for security purposes
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-indigo-300 text-sm mt-6">
                    SoActiv © {new Date().getFullYear()} • Platform v1.0
                </p>
            </div>
        </div>
    );
}
