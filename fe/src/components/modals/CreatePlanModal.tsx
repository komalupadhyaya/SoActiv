import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface CreatePlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface PlanFormData {
    name: string;
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

interface FieldErrors {
    name?: string;
    displayName?: string;
    price?: string;
    maxMembers?: string;
    maxStaff?: string;
}

const PLAN_NAME_REGEX = /^[a-z0-9_-]+$/;

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '').replace(/\/api\/v1$/, '');

export default function CreatePlanModal({ isOpen, onClose, onSuccess }: CreatePlanModalProps) {
    const [formData, setFormData] = useState<PlanFormData>({
        name: '',
        displayName: '',
        description: '',
        price: '0',
        currency: 'INR',
        billingCycle: 'monthly',
        maxMembers: '0',
        maxStaff: '0',
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
    const [submitError, setSubmitError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    // Reset form every time the modal is opened
    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: '',
                displayName: '',
                description: '',
                price: '0',
                currency: 'INR',
                billingCycle: 'monthly',
                maxMembers: '0',
                maxStaff: '0',
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
            setSubmitError('');
            setFieldErrors({});
            setTouched({});
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // --- Validation ---
    const validateField = (field: string, value: string, extra?: Partial<PlanFormData>): string | undefined => {
        const data = { ...formData, ...extra };
        switch (field) {
            case 'name':
                if (!value.trim()) return 'Name is required';
                if (value.trim().length < 2) return 'Name must be at least 2 characters';
                if (value.trim().length > 50) return 'Name must be under 50 characters';
                if (!PLAN_NAME_REGEX.test(value.trim())) return 'Only lowercase letters, numbers, hyphens and underscores allowed';
                break;
            case 'displayName':
                if (!value.trim()) return 'Display name is required';
                if (value.trim().length < 2) return 'Display name must be at least 2 characters';
                if (value.trim().length > 80) return 'Display name must be under 80 characters';
                break;
            case 'price': {
                const num = parseFloat(value);
                if (value === '' || isNaN(num)) return 'Price is required';
                if (num < 0) return 'Price cannot be negative';
                break;
            }
            case 'maxMembers':
                if (!data.isUnlimitedMembers) {
                    const n = parseInt(value);
                    if (value === '' || isNaN(n)) return 'Max Members is required';
                    if (n < 0) return 'Cannot be negative';
                }
                break;
            case 'maxStaff':
                if (!data.isUnlimitedStaff) {
                    const n = parseInt(value);
                    if (value === '' || isNaN(n)) return 'Max Staff is required';
                    if (n < 0) return 'Cannot be negative';
                }
                break;
        }
        return undefined;
    };

    const validateAll = (data = formData): FieldErrors => {
        const errors: FieldErrors = {};
        const fields = ['name', 'displayName', 'price', 'maxMembers', 'maxStaff'];
        for (const field of fields) {
            const value = data[field as keyof PlanFormData] as string;
            const err = validateField(field, value, data);
            if (err) errors[field as keyof FieldErrors] = err;
        }
        return errors;
    };

    const handleChange = (field: string, value: string, extra?: Partial<PlanFormData>) => {
        const updated = { ...formData, [field]: value, ...extra };
        setFormData(updated);
        if (touched[field]) {
            const err = validateField(field, value, updated);
            setFieldErrors(prev => ({ ...prev, [field]: err }));
        }
        if (submitError) setSubmitError('');
    };

    const handleBlur = (field: string, value: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        const err = validateField(field, value);
        setFieldErrors(prev => ({ ...prev, [field]: err }));
    };

    // --- Helpers ---
    const inputClass = (field: string, extra = '') =>
        `w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-colors ${extra} ${
            fieldErrors[field as keyof FieldErrors]
                ? 'border-red-400 dark:border-red-500 focus:ring-red-400'
                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
        }`;

    const FieldError = ({ field }: { field: string }) =>
        fieldErrors[field as keyof FieldErrors] ? (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                {fieldErrors[field as keyof FieldErrors]}
            </p>
        ) : null;

    // --- Submit ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError('');

        // Touch all validated fields
        const allFields = ['name', 'displayName', 'price', 'maxMembers', 'maxStaff'];
        setTouched(allFields.reduce((acc, f) => ({ ...acc, [f]: true }), {}));

        const errors = validateAll();
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setSubmitError('Please fix the errors below before submitting.');
            return;
        }

        try {
            setLoading(true);

            const payload = {
                name: formData.name.toLowerCase().trim(),
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

            const response = await fetch(`${API_URL}/api/v1/super-admin/plans`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create plan');
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setSubmitError(err.message || 'Failed to create plan');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) onClose();
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
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Create New Plan
                        </h3>
                        <button
                            onClick={handleClose}
                            disabled={loading}
                            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} noValidate className="px-6 py-4">
                        {/* Top-level submit error */}
                        {submitError && (
                            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <span className="text-sm">{submitError}</span>
                            </div>
                        )}

                        <div className="space-y-6">
                            {/* Basic Info */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                    Basic Information
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => handleChange('name', e.target.value)}
                                            onBlur={(e) => handleBlur('name', e.target.value)}
                                            placeholder="e.g., pro, enterprise"
                                            className={inputClass('name')}
                                        />
                                        {fieldErrors.name ? (
                                            <FieldError field="name" />
                                        ) : (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Lowercase, unique identifier
                                            </p>
                                        )}
                                    </div>

                                    {/* Display Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Display Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.displayName}
                                            onChange={(e) => handleChange('displayName', e.target.value)}
                                            onBlur={(e) => handleBlur('displayName', e.target.value)}
                                            placeholder="e.g., Pro Plan"
                                            className={inputClass('displayName')}
                                        />
                                        <FieldError field="displayName" />
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Optional description"
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Pricing */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                    Pricing
                                </h4>
                                <div className="grid grid-cols-3 gap-4">
                                    {/* Price */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Price <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.price}
                                            onChange={(e) => handleChange('price', e.target.value)}
                                            onFocus={() => {
                                                if (formData.price === '0') {
                                                    setFormData(prev => ({ ...prev, price: '' }));
                                                }
                                            }}
                                            onBlur={(e) => {
                                                const val = e.target.value === '' ? '0' : e.target.value;
                                                setFormData(prev => ({ ...prev, price: val }));
                                                handleBlur('price', val);
                                            }}
                                            min="0"
                                            step="0.01"
                                            className={inputClass('price')}
                                        />
                                        <FieldError field="price" />
                                    </div>

                                    {/* Currency */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Currency
                                        </label>
                                        <select
                                            value={formData.currency}
                                            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        >
                                            <option value="INR">INR</option>
                                            <option value="USD">USD</option>
                                            <option value="EUR">EUR</option>
                                        </select>
                                    </div>

                                    {/* Billing Cycle */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Billing Cycle
                                        </label>
                                        <select
                                            value={formData.billingCycle}
                                            onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value as 'monthly' | 'yearly' })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                                    {/* Max Members */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Max Members
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.isUnlimitedMembers ? '' : formData.maxMembers}
                                            onChange={(e) => handleChange('maxMembers', e.target.value)}
                                            onFocus={() => {
                                                if (formData.maxMembers === '0') {
                                                    setFormData(prev => ({ ...prev, maxMembers: '' }));
                                                }
                                            }}
                                            onBlur={(e) => {
                                                const val = e.target.value === '' ? '0' : e.target.value;
                                                setFormData(prev => ({ ...prev, maxMembers: val }));
                                                handleBlur('maxMembers', val);
                                            }}
                                            disabled={formData.isUnlimitedMembers}
                                            placeholder={formData.isUnlimitedMembers ? 'Unlimited' : '0'}
                                            min="0"
                                            className={inputClass('maxMembers', 'disabled:opacity-50')}
                                        />
                                        <FieldError field="maxMembers" />
                                        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={formData.isUnlimitedMembers}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        isUnlimitedMembers: checked,
                                                        maxMembers: checked ? '' : (prev.maxMembers || '0')
                                                    }));
                                                    if (checked) setFieldErrors(prev => ({ ...prev, maxMembers: undefined }));
                                                }}
                                                className="rounded"
                                            />
                                            Unlimited
                                        </label>
                                    </div>

                                    {/* Max Staff */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Max Staff
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.isUnlimitedStaff ? '' : formData.maxStaff}
                                            onChange={(e) => handleChange('maxStaff', e.target.value)}
                                            onFocus={() => {
                                                if (formData.maxStaff === '0') {
                                                    setFormData(prev => ({ ...prev, maxStaff: '' }));
                                                }
                                            }}
                                            onBlur={(e) => {
                                                const val = e.target.value === '' ? '0' : e.target.value;
                                                setFormData(prev => ({ ...prev, maxStaff: val }));
                                                handleBlur('maxStaff', val);
                                            }}
                                            disabled={formData.isUnlimitedStaff}
                                            placeholder={formData.isUnlimitedStaff ? 'Unlimited' : '0'}
                                            min="0"
                                            className={inputClass('maxStaff', 'disabled:opacity-50')}
                                        />
                                        <FieldError field="maxStaff" />
                                        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={formData.isUnlimitedStaff}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        isUnlimitedStaff: checked,
                                                        maxStaff: checked ? '' : (prev.maxStaff || '0')
                                                    }));
                                                    if (checked) setFieldErrors(prev => ({ ...prev, maxStaff: undefined }));
                                                }}
                                                className="rounded"
                                            />
                                            Unlimited
                                        </label>
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
                                        <label key={key} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
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
                                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
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
                                        Creating...
                                    </>
                                ) : (
                                    'Create Plan'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
