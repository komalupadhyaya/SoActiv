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

interface FieldErrors {
    name?: string;
    plan?: string;
    phone?: string;
    ownerName?: string;
    ownerEmail?: string;
    ownerPassword?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[\d\s\-().]{7,15}$/;

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '').replace(/\/api\/v1$/, '');

export default function GymModal({ isOpen, onClose, onSuccess, gym }: GymModalProps) {
    const { addToast } = useToast();
    const isEdit = !!gym;

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        status: 'active',
        plan: '',
        ownerName: '',
        ownerEmail: '',
        ownerPassword: ''
    });

    const [plans, setPlans] = useState<Plan[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
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
                params: { includeInactive: 'true' },
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
            setSubmitError('');
            setFieldErrors({});
            setTouched({});
            setShowPassword(false);

            if (gym) {
                setFormData({
                    name: gym.name,
                    address: gym.address || '',
                    phone: gym.phone || '',
                    status: gym.status,
                    plan: gym.plan || '',
                    ownerName: '',
                    ownerEmail: '',
                    ownerPassword: ''
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

    // Validate a single field and return error string or undefined
    const validateField = (field: string, value: string): string | undefined => {
        switch (field) {
            case 'name':
                if (!value.trim()) return 'Gym name is required';
                if (value.trim().length < 2) return 'Gym name must be at least 2 characters';
                if (value.trim().length > 100) return 'Gym name must be under 100 characters';
                break;
            case 'plan':
                if (!value) return 'Please select a plan';
                break;
            case 'phone':
                if (value && !PHONE_REGEX.test(value)) return 'Enter a valid phone number';
                break;
            case 'ownerName':
                if (!isEdit) {
                    if (!value.trim()) return 'Owner name is required';
                    if (value.trim().length < 2) return 'Owner name must be at least 2 characters';
                }
                break;
            case 'ownerEmail':
                if (!isEdit) {
                    if (!value.trim()) return 'Owner email is required';
                    if (!EMAIL_REGEX.test(value.trim())) return 'Enter a valid email address';
                }
                break;
            case 'ownerPassword':
                if (!isEdit) {
                    if (!value) return 'Owner password is required';
                    if (value.length < 6) return 'Password must be at least 6 characters';
                    if (value.length > 128) return 'Password must be under 128 characters';
                }
                break;
        }
        return undefined;
    };

    // Validate all fields and return errors map
    const validateAll = (): FieldErrors => {
        const errors: FieldErrors = {};
        const fields = isEdit
            ? ['name', 'plan', 'phone']
            : ['name', 'plan', 'phone', 'ownerName', 'ownerEmail', 'ownerPassword'];

        for (const field of fields) {
            const value = formData[field as keyof typeof formData];
            const err = validateField(field, value);
            if (err) errors[field as keyof FieldErrors] = err;
        }
        return errors;
    };

    // Handle field change with live validation for touched fields
    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (touched[field]) {
            const err = validateField(field, value);
            setFieldErrors(prev => ({ ...prev, [field]: err }));
        }
        if (submitError) setSubmitError('');
    };

    // Mark field as touched on blur and validate
    const handleBlur = (field: string, value: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        const err = validateField(field, value);
        setFieldErrors(prev => ({ ...prev, [field]: err }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError('');

        // Touch all fields so errors show
        const allFields = isEdit
            ? ['name', 'plan', 'phone']
            : ['name', 'plan', 'phone', 'ownerName', 'ownerEmail', 'ownerPassword'];
        const newTouched = allFields.reduce((acc, f) => ({ ...acc, [f]: true }), {});
        setTouched(newTouched);

        const errors = validateAll();
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setSubmitError('Please fix the errors below before submitting.');
            return;
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
            setSubmitError(msg);
            addToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Helper: input class based on field error
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

                    <form onSubmit={handleSubmit} noValidate className="px-6 py-4">
                        {/* Top-level submit error */}
                        {submitError && (
                            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <span className="text-sm">{submitError}</span>
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Gym Details */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                                    Gym Details
                                </h4>

                                {/* Gym Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Gym Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        onBlur={(e) => handleBlur('name', e.target.value)}
                                        className={inputClass('name')}
                                        placeholder="e.g. FitZone Gym"
                                    />
                                    <FieldError field="name" />
                                </div>

                                {/* Plan & Status */}
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
                                                    handleChange('plan', e.target.value);
                                                }
                                            }}
                                            onBlur={(e) => handleBlur('plan', e.target.value)}
                                            className={inputClass('plan')}
                                            disabled={loadingPlans}
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
                                        <FieldError field="plan" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Status
                                        </label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className={inputClass('status')}
                                        >
                                            <option value="active">Active</option>
                                            <option value="trial">Trial</option>
                                            <option value="suspended">Suspended</option>
                                            <option value="expired">Expired</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Address */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Address
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className={inputClass('address')}
                                        placeholder="e.g. 123 Main St, City"
                                    />
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Phone
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                        onBlur={(e) => handleBlur('phone', e.target.value)}
                                        className={inputClass('phone')}
                                        placeholder="e.g. +91 98765 43210"
                                    />
                                    <FieldError field="phone" />
                                </div>
                            </div>

                            {/* Owner Details - Only for Create */}
                            {!isEdit && (
                                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                                        Owner Details
                                    </h4>

                                    {/* Owner Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Owner Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.ownerName}
                                            onChange={(e) => handleChange('ownerName', e.target.value)}
                                            onBlur={(e) => handleBlur('ownerName', e.target.value)}
                                            className={inputClass('ownerName')}
                                            placeholder="e.g. John Doe"
                                        />
                                        <FieldError field="ownerName" />
                                    </div>

                                    {/* Owner Email */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Owner Email <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.ownerEmail}
                                            onChange={(e) => handleChange('ownerEmail', e.target.value)}
                                            onBlur={(e) => handleBlur('ownerEmail', e.target.value)}
                                            className={inputClass('ownerEmail')}
                                            placeholder="e.g. owner@example.com"
                                        />
                                        <FieldError field="ownerEmail" />
                                    </div>

                                    {/* Owner Password */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Owner Password <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.ownerPassword}
                                                onChange={(e) => handleChange('ownerPassword', e.target.value)}
                                                onBlur={(e) => handleBlur('ownerPassword', e.target.value)}
                                                className={inputClass('ownerPassword', 'pr-10')}
                                                placeholder="Min 6 characters"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <FieldError field="ownerPassword" />
                                        {!fieldErrors.ownerPassword && (
                                            <p className="text-xs text-gray-500 mt-1">Min 6 characters</p>
                                        )}
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
