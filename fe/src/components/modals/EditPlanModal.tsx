import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface EditPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    plan: {
        _id: string;
        name: string;
        displayName: string;
        description?: string;
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
        isActive: boolean;
    } | null;
}

interface PlanFormData {
    displayName: string;
    description: string;
    price: string;
    currency: string;
    billingCycle: 'monthly' | 'yearly';
    maxMembers: string;
    maxStaff: string;
    isUnlimitedMembers: boolean;
    isUnlimitedStaff: boolean;
    features: {
        payments: boolean;
        attendance: boolean;
        pt: boolean;
        classes: boolean;
        memberPortal: boolean;
    };
    isActive: boolean;
}

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '').replace(/\/api\/v1$/, '');

export default function EditPlanModal({ isOpen, onClose, onSuccess, plan }: EditPlanModalProps) {
    const [formData, setFormData] = useState<PlanFormData>({
        displayName: '',
        description: '',
        price: '0',
        currency: 'INR',
        billingCycle: 'monthly',
        maxMembers: '50',
        maxStaff: '3',
        isUnlimitedMembers: false,
        isUnlimitedStaff: false,
        features: {
            payments: true,
            attendance: true,
            pt: true,
            classes: true,
            memberPortal: true
        },
        isActive: true
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Populate form when plan changes
    useEffect(() => {
        if (plan) {
            setFormData({
                displayName: plan.displayName,
                description: plan.description || '',
                price: plan.price.toString(),
                currency: plan.currency,
                billingCycle: plan.billingCycle,
                maxMembers: plan.maxMembers === 0 ? '50' : plan.maxMembers.toString(),
                maxStaff: plan.maxStaff === 0 ? '3' : plan.maxStaff.toString(),
                isUnlimitedMembers: plan.maxMembers === 0,
                isUnlimitedStaff: plan.maxStaff === 0,
                features: plan.features,
                isActive: plan.isActive
            });
        }
    }, [plan]);

    if (!isOpen || !plan) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.displayName) {
            setError('Display Name is required');
            return;
        }

        if (parseFloat(formData.price) < 0) {
            setError('Price cannot be negative');
            return;
        }

        if (!formData.isUnlimitedMembers && parseInt(formData.maxMembers) <= 0) {
            setError('Max Members must be greater than 0 or set to Unlimited');
            return;
        }

        if (!formData.isUnlimitedStaff && parseInt(formData.maxStaff) <= 0) {
            setError('Max Staff must be greater than 0 or set to Unlimited');
            return;
        }

        try {
            setLoading(true);

            const payload = {
                displayName: formData.displayName.trim(),
                description: formData.description.trim() || undefined,
                price: parseFloat(formData.price),
                currency: formData.currency,
                billingCycle: formData.billingCycle,
                maxMembers: formData.isUnlimitedMembers ? 0 : parseInt(formData.maxMembers),
                maxStaff: formData.isUnlimitedStaff ? 0 : parseInt(formData.maxStaff),
                features: formData.features,
                isActive: formData.isActive
            };

            const response = await fetch(`${API_URL}/api/v1/super-admin/plans/${plan._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update plan');
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to update plan');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                    onClick={handleClose}
                ></div>

                {/* Modal */}
                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Edit Plan
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {plan.name} (name cannot be changed)
                            </p>
                        </div>
                        <button
                            onClick={handleClose}
                            disabled={loading}
                            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="px-6 py-4">
                        {error && (
                            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div className="space-y-6">
                            {/* Basic Info */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                    Basic Information
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Display Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.displayName}
                                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                            placeholder="e.g., Pro Plan"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Optional description"
                                            rows={2}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Pricing */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                    Pricing
                                </h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Price
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            min="0"
                                            step="0.01"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Currency
                                        </label>
                                        <select
                                            value={formData.currency}
                                            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="INR">INR</option>
                                            <option value="USD">USD</option>
                                            <option value="EUR">EUR</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Billing Cycle
                                        </label>
                                        <select
                                            value={formData.billingCycle}
                                            onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value as 'monthly' | 'yearly' })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="monthly">Monthly</option>
                                            <option value="yearly">Yearly</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Limits */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                    Limits
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Max Members
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                value={formData.maxMembers}
                                                onChange={(e) => setFormData({ ...formData, maxMembers: e.target.value })}
                                                disabled={formData.isUnlimitedMembers}
                                                min="1"
                                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                            />
                                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isUnlimitedMembers}
                                                    onChange={(e) => setFormData({ ...formData, isUnlimitedMembers: e.target.checked })}
                                                    className="rounded"
                                                />
                                                Unlimited
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Max Staff
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                value={formData.maxStaff}
                                                onChange={(e) => setFormData({ ...formData, maxStaff: e.target.value })}
                                                disabled={formData.isUnlimitedStaff}
                                                min="1"
                                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                            />
                                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isUnlimitedStaff}
                                                    onChange={(e) => setFormData({ ...formData, isUnlimitedStaff: e.target.checked })}
                                                    className="rounded"
                                                />
                                                Unlimited
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Features */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                    Features
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.entries(formData.features).map(([key, value]) => (
                                        <label key={key} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                            <input
                                                type="checkbox"
                                                checked={value}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    features: { ...formData.features, [key]: e.target.checked }
                                                })}
                                                className="rounded"
                                            />
                                            {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="rounded"
                                    />
                                    Active (plan is available for assignment)
                                </label>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={loading}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Updating...
                                    </>
                                ) : (
                                    'Update Plan'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
