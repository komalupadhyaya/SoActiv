import React, { useState } from 'react';
import {
    MessageSquare,
    Send,
    CheckCircle2,
    Loader2,
    ShieldCheck,
    Smartphone,
    CreditCard,
    Lightbulb
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useSupport } from '../../hooks/useSupport';
import { useAuth } from '../../contexts/AuthContext';

export const ContactSupportPage: React.FC = () => {
    const { user } = useAuth();
    const { sendSupportMessage, loading } = useSupport();
    const [submitted, setSubmitted] = useState(false);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: '',
        category: 'support',
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await sendSupportMessage({
            ...formData,
            gymId: user?.gym
        });
        if (success) {
            setSubmitted(true);
        }
    };

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Support Ticket Created</h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8">
                    Your message has been sent directly to the SoActiv SuperAdmin team. We typically respond within 12-24 hours.
                </p>
                <Button onClick={() => setSubmitted(false)}>Send Another Message</Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Contact & Support</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Need help with your gym management or have a feature request? Our team is here to help.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-3">
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 w-fit rounded-xl">
                        <Smartphone className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white">App Support</h3>
                    <p className="text-sm text-gray-500">Fixing bugs, crashes, or login issues.</p>
                </div>
                <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 w-fit rounded-xl">
                        <CreditCard className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Billing Queries</h3>
                    <p className="text-sm text-gray-500">Questions about your plan or invoices.</p>
                </div>
                <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-3">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 w-fit rounded-xl">
                        <Lightbulb className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Feature Requests</h3>
                    <p className="text-sm text-gray-500">Ideas to make SoActiv even better.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-orange-600" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">New Support Message</h3>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Full Name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                disabled
                                required
                            />
                            <Input
                                label="Email Address"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                disabled
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Phone (Optional)"
                                placeholder="+1 (555) 000-0000"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                                <select
                                    className="w-full h-10 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:text-white transition-colors"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    required
                                >
                                    <option value="support">Technical Support</option>
                                    <option value="billing">Billing & Subscriptions</option>
                                    <option value="feature_request">Feature Request</option>
                                    <option value="sales">Sales & Partnerships</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                            <textarea
                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:text-white transition-colors min-h-[150px]"
                                placeholder="Describe your issue or request in detail..."
                                value={formData.message}
                                onChange={e => setFormData({ ...formData, message: e.target.value })}
                                required
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50">
                            <div className="flex items-center gap-3 text-blue-700 dark:text-blue-300">
                                <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                                <p className="text-xs">Your gym ID ({user?.gym || 'N/A'}) will be automatically included for faster resolution.</p>
                            </div>
                            <Button type="submit" disabled={loading} className="gap-2">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Send Message
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ContactSupportPage;
