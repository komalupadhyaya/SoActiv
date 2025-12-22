import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Dumbbell, Shield, Zap, Star, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { PublicNavbar } from '../components/layout/PublicNavbar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Plan {
    _id: string;
    name: string;
    displayName: string;
    price: number;
    currency: string;
    billingCycle: 'monthly' | 'yearly';
    maxMembers: number;
    maxStaff: number;
    features: {
        payments: boolean;
        attendance: boolean;
        pt: boolean;
        classes: boolean;
        memberPortal: boolean;
    };
    description?: string;
}

export function PricingPage() {
    const navigate = useNavigate();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/v1/super-admin/plans`);
                if (response.data.success) {
                    setPlans(response.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch pricing plans:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    // Filter plans based on selected billing cycle
    const displayPlans = plans.filter(p => p.billingCycle === billingCycle);

    const formatLimit = (limit: number) => (limit === 0 ? 'Unlimited' : limit.toLocaleString());

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            <PublicNavbar />

            {/* Hero Section */}
            <div className="pt-32 pb-20 px-4 text-center">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6">
                        Predictable Pricing for <span className="text-orange-600">Unstoppable</span> Growth
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 mb-10">
                        Choose the perfect plan for your fitness or sports facility. No hidden fees, just pure performance.
                    </p>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-4 mb-12">
                        <span className={`text-sm font-semibold ${billingCycle === 'monthly' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>Monthly</span>
                        <button
                            onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                            className="w-14 h-7 bg-orange-600 rounded-full relative p-1 transition-all duration-300"
                        >
                            <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 transform ${billingCycle === 'yearly' ? 'translate-x-7' : 'translate-x-0'}`}></div>
                        </button>
                        <span className={`text-sm font-semibold flex items-center gap-2 ${billingCycle === 'yearly' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                            Yearly <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs rounded-full">Save ~15%</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Pricing Grid */}
            <div className="max-w-7xl mx-auto px-4 pb-32">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
                        <p className="text-gray-500 font-medium">Loading our best plans for you...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {displayPlans.map((plan, idx) => {
                            const isPro = plan.name.includes('pro') || plan.name.includes('enterprise');

                            return (
                                <div
                                    key={plan._id}
                                    className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border-2 transition-transform hover:-translate-y-2 duration-300 flex flex-col ${isPro ? 'border-orange-500 ring-4 ring-orange-500/10' : 'border-transparent'
                                        }`}
                                >
                                    {isPro && (
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
                                            Most Popular
                                        </div>
                                    )}

                                    <div className="mb-8">
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.displayName}</h3>
                                        <p className="text-gray-500 text-sm h-10 line-clamp-2">{plan.description || "The entry point for scaling your fitness brand."}</p>
                                    </div>

                                    <div className="mb-8">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                                                {plan.currency === 'INR' ? '₹' : '$'}{plan.price.toLocaleString()}
                                            </span>
                                            <span className="text-gray-500 font-medium">/{plan.billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-10 flex-grow">
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Everything in {idx > 0 ? displayPlans[idx - 1].displayName : 'Core'}:</p>

                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                            <span className="text-gray-700 dark:text-gray-200">Up to <strong>{formatLimit(plan.maxMembers)}</strong> Members</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                            <span className="text-gray-700 dark:text-gray-200">Up to <strong>{formatLimit(plan.maxStaff)}</strong> Staff Accounts</span>
                                        </div>

                                        {Object.entries(plan.features).map(([key, value]) => value && (
                                            <div key={key} className="flex items-center gap-3">
                                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                                <span className="text-gray-700 dark:text-gray-200 capitalize">
                                                    {key.replace(/([A-Z])/g, ' $1')}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => navigate('/register')}
                                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isPro
                                            ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-600/30'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                                            }`}
                                    >
                                        Start 14-Day Free Trial <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* FAQ / Trust Section */}
                <div className="mt-20 flex flex-wrap justify-center gap-12 border-t border-gray-200 dark:border-gray-800 pt-20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400"><Shield className="w-6 h-6" /></div>
                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-white">Secure Payments</h4>
                            <p className="text-sm text-gray-500">PCI-DSS compliant handling</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400"><Zap className="w-6 h-6" /></div>
                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-white">Instant Setup</h4>
                            <p className="text-sm text-gray-500">Go live in under 5 minutes</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400"><Star className="w-6 h-6" /></div>
                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-white">Award Winning Support</h4>
                            <p className="text-sm text-gray-500">24/7 dedicated assistance</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 py-20 px-4 text-center border-t border-white/10">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="flex items-center justify-center space-x-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                            <Dumbbell className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-white tracking-widest uppercase">SOACTIV</span>
                    </div>
                    <p className="text-gray-400">Join the elite fitness brands powered by our platform.</p>
                    <div className="flex justify-center gap-8 text-sm text-gray-500">
                        <Link to="/" className="hover:text-white">Home</Link>
                        <Link to="/login" className="hover:text-white">Login</Link>
                        <Link to="/contact" className="hover:text-white">Contact Sales</Link>
                        <a href="#privacy" className="hover:text-white">Privacy</a>
                    </div>
                    <div className="text-xs text-gray-600 pt-8">&copy; 2024 SoActiv. All rights reserved.</div>
                </div>
            </footer>
        </div>
    );
}

export default PricingPage;
