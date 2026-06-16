import { useState, useEffect } from 'react';
import { X, AlertCircle, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';
import CreatePlanModal from './CreatePlanModal';

interface GymModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    gym?: {
        _id: string;
        name: string;
        phone?: string;
        address?: string;
        plan: string;
        status: string;
    } | null;
}

interface Plan {
    _id: string;
    name: string;
    price: number;
    billingCycle: string;
    currency: string;
}

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export default function GymModal({ isOpen, onClose, onSuccess, gym }: GymModalProps) {
    const { addToast } = useToast();
    const isEdit = !!gym;

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        status: 'active',
        plan: '', // Default empty, will pick first available or 'pro'
        ownerName: '',
        ownerEmail: '',
        ownerPassword: ''
    });

    const [plans, setPlans] = useState<Plan[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Fetch Plans on mount
    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoadingPlans(true);
            const response = await axios.get(`${API_URL}/api/v1/super-admin/plans`, {
                params: { includeInactive: 'true' }, // We need all plans, maybe filter active ones for new gyms
                withCredentials: true
            });
            if (response.data.success) {
                setPlans(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch plans:', error);
            addToast('Failed to load plans', 'error');
        } finally {
            setLoadingPlans(false);
        }
    };

    // Reset/Populate form
    useEffect(() => {
        if (isOpen) {
            setError('');
            setShowPassword(false);

            if (gym) {
                setFormData({
                    name: gym.name,
                    address: gym.address || '',
                    phone: gym.phone || '',
                    status: gym.status,
                    plan: gym.plan || '',
                    ownerName: '',    // Not editable here
                    ownerEmail: '',   // Not editable here
                    ownerPassword: '' // Not editable here
                });
            } else {
                setFormData({
                    name: '',
                    address: '',
                    phone: '',
                    status: 'trial',
                    plan: '',
                    ownerName: '',
                    ownerEmail: '',
                    ownerPassword: ''
                });
            }
        }
    }, [isOpen, gym]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Basic Validation
        if (!formData.name) {
            setError('Gym name is required');
            return;
        }

        if (!formData.plan) {
            setError('Please select a plan');
            return;
        }

        if (!isEdit) {
            if (!formData.ownerName || !formData.ownerEmail || !formData.ownerPassword) {
                setError('Owner details are required for new gyms');
                return;
            }
            if (formData.ownerPassword.length < 6) {
                setError('Owner password must be at least 6 characters');
                return;
            }
        }

        try {
            setLoading(true);

            if (isEdit) {
                await axios.patch(
                    `${API_URL}/api/v1/super-admin/gyms/${gym._id}`,
                    {
                        name: formData.name,
                        address: formData.address,
                        phone: formData.phone,
                        status: formData.status,
                        plan: formData.plan
                    },
                    { withCredentials: true }
                );
                addToast('Gym updated successfully', 'success');
            } else {
                await axios.post(
                    `${API_URL}/api/v1/super-admin/gyms`,
                    formData,
                    { withCredentials: true }
                );
                addToast('Gym created successfully', 'success');
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Failed to save gym:', err);
            const msg = err.response?.data?.message || (isEdit ? 'Failed to update gym' : 'Failed to create gym');
            setError(msg);
            addToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div
                    className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                    onClick={onClose}
                ></div>

                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {isEdit ? 'Edit Gym' : 'Create New Gym'}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="px-6 py-4">
                        {error && (
                            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Gym Details */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                                    Gym Details
                                </h4>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Gym Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Plan <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.plan}
                                            onChange={(e) => {
                                                if (e.target.value === 'create_new_plan') {
                                                    setShowCreatePlanModal(true);
                                                } else {
                                                    setFormData({ ...formData, plan: e.target.value });
                                                }
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                            disabled={loadingPlans}
                                            required
                                        >
                                            <option value="">{loadingPlans ? 'Loading plans...' : 'Select Plan'}</option>
                                            {!loadingPlans && (
                                                <option value="create_new_plan" className="text-blue-600 font-semibold bg-blue-50 dark:bg-blue-900/20">
                                                    + Create Plan
                                                </option>
                                            )}
                                            {plans.map(p => (
                                                <option key={p._id} value={p.name.toLowerCase()}>
                                                    {p.name} ({p.currency} {p.price}/{p.billingCycle === 'monthly' ? 'mo' : 'yr'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Status
                                        </label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="active">Active</option>
                                            <option value="trial">Trial</option>
                                            <option value="suspended">Suspended</option>
                                            <option value="expired">Expired</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Address
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Phone
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Owner Details - Only for Create */}
                            {!isEdit && (
                                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                                        Owner Details
                                    </h4>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Owner Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.ownerName}
                                            onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Owner Email <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.ownerEmail}
                                            onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Owner Password <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.ownerPassword}
                                                onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
                                                className="w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                minLength={6}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Min 6 characters</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                {isEdit ? 'Update Gym' : 'Create Gym'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <CreatePlanModal
                isOpen={showCreatePlanModal}
                onClose={() => setShowCreatePlanModal(false)}
                onSuccess={async () => {
                    const oldPlanIds = new Set(plans.map(p => p._id));
                    try {
                        setLoadingPlans(true);
                        const response = await axios.get(`${API_URL}/api/v1/super-admin/plans`, {
                            params: { includeInactive: 'true' },
                            withCredentials: true
                        });
                        if (response.data.success) {
                            const newPlans = response.data.data;
                            setPlans(newPlans);
                            
                            // Auto-select the newly created plan
                            const addedPlan = newPlans.find((p: any) => !oldPlanIds.has(p._id));
                            if (addedPlan) {
                                setFormData(prev => ({ ...prev, plan: addedPlan.name.toLowerCase() }));
                            }
                        }
                    } catch (error) {
                        console.error('Failed to auto-select new plan:', error);
                    } finally {
                        setLoadingPlans(false);
                    }
                    addToast('Subscription plan created successfully!', 'success');
                }}
            />
        </div>
    );
}
