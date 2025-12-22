import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Dumbbell,
    Mail,
    Phone,
    MessageSquare,
    Send,
    CheckCircle2,
    Loader2,
    ArrowLeft
} from 'lucide-react';
import { useEnquiry } from '../../hooks/useEnquiry';

export default function ContactPage() {
    const { createPublicEnquiry, loading } = useEnquiry();
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        interests: '',
        comments: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await createPublicEnquiry(formData);
        if (success) {
            setSubmitted(true);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center border border-gray-100 dark:border-gray-700">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Message Sent!</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        Thank you for reaching out. Our team will get back to you within 24 hours.
                    </p>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-orange-600 font-bold hover:text-orange-700 transition"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            {/* Header / Navigation */}
            <nav className="fixed top-0 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link to="/" className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                                <Dumbbell className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold">
                                <span className="text-orange-600">SO</span>
                                <span className="text-gray-900 dark:text-white">ACTIV</span>
                            </span>
                        </Link>
                        <div className="flex items-center space-x-4">
                            <Link to="/pricing" className="text-gray-700 dark:text-gray-300 hover:text-orange-600 font-medium">Pricing</Link>
                            <Link to="/login" className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition">Login</Link>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="pt-32 pb-20 px-4">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

                    {/* Left Column: Info */}
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6">
                                Let's Build Your <span className="text-orange-600">Fitness Legacy</span>
                            </h1>
                            <p className="text-xl text-gray-600 dark:text-gray-400">
                                Have questions about our features, pricing, or custom enterprise solutions? We're here to help you scale.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">Email Us</h4>
                                    <p className="text-gray-600 dark:text-gray-400">support@soactiv.com</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                                    <Phone className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">Call Support</h4>
                                    <p className="text-gray-600 dark:text-gray-400">+1 (555) 123-4567</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl">
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">Live Chat</h4>
                                    <p className="text-gray-600 dark:text-gray-400">Available Mon-Fri, 9am - 6pm EST</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-gray-900 rounded-2xl text-white">
                            <h3 className="text-xl font-bold mb-4 italic">"SoActiv helped us double our membership in just 6 months. The support is world-class."</h3>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-orange-500 overflow-hidden text-center text-xs flex items-center justify-center font-bold">JD</div>
                                <div>
                                    <p className="font-bold text-sm">John Doe</p>
                                    <p className="text-gray-400 text-xs">CEO, Peak Performance Gym</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Form */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-10 border border-gray-100 dark:border-gray-700">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Name *</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-orange-500 outline-none transition dark:text-white"
                                        placeholder="Alex Johnson"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone Number *</label>
                                    <input
                                        type="tel"
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-orange-500 outline-none transition dark:text-white"
                                        placeholder="+1 (555) 000-0000"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email Address (Optional)</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-orange-500 outline-none transition dark:text-white"
                                    placeholder="chon@example.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">What are you interested in?</label>
                                <select
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-orange-500 outline-none transition dark:text-white appearance-none"
                                    value={formData.interests}
                                    onChange={e => setFormData({ ...formData, interests: e.target.value })}
                                >
                                    <option value="">Select an option</option>
                                    <option value="Gym Management">Gym Management</option>
                                    <option value="Personal Training">Personal Training</option>
                                    <option value="Member App">Member App</option>
                                    <option value="Enterprise Solution">Enterprise Solution</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">How can we help you? *</label>
                                <textarea
                                    required
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-orange-500 outline-none transition dark:text-white"
                                    placeholder="Tell us about your business and goals..."
                                    value={formData.comments}
                                    onChange={e => setFormData({ ...formData, comments: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-orange-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-700 transition shadow-lg shadow-orange-600/30 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                Send Message
                            </button>
                            <p className="text-center text-xs text-gray-500">
                                By clicking "Send Message", you agree to our <Link to="/terms" className="underline">Terms of Service</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link>.
                            </p>
                        </form>
                    </div>
                </div>
            </div>

            {/* Simple Footer */}
            <footer className="bg-white dark:bg-gray-950 py-10 px-4 border-t border-gray-100 dark:border-gray-800">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center space-x-2">
                        <Dumbbell className="w-6 h-6 text-orange-600" />
                        <span className="font-bold text-gray-900 dark:text-white tracking-widest uppercase">SOACTIV</span>
                    </div>
                    <div className="text-sm text-gray-500">
                        &copy; 2024 SoActiv. All rights reserved.
                    </div>
                    <div className="flex gap-6">
                        <Link to="/" className="text-gray-400 hover:text-orange-600 transition text-sm">Home</Link>
                        <Link to="/pricing" className="text-gray-400 hover:text-orange-600 transition text-sm">Pricing</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
