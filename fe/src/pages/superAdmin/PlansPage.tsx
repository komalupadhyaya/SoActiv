import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Plus, Edit, Trash2, Loader2, Building2 } from 'lucide-react';
import CreatePlanModal from '../../components/modals/CreatePlanModal';
import EditPlanModal from '../../components/modals/EditPlanModal';
import { useToast } from '../../contexts/ToastContext';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

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
    isActive: boolean;
    gymCount: number;
}

export default function PlansPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { addToast } = useToast();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

    useEffect(() => {
        fetchPlans();
        if (location.state?.openCreateModal) {
            setShowCreateModal(true);
            // Clear history state so refresh/back doesn't re-trigger
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/api/v1/super-admin/plans`, {
                params: { includeInactive: 'true' },
                withCredentials: true
            });

            if (response.data.success) {
                setPlans(response.data.data);
            }
        } catch (error: any) {
            console.error('Failed to fetch plans:', error);
            if (error.response?.status === 401) {
                navigate('/super-admin/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePlan = async (planId: string, planName: string, gymCount: number) => {
        if (gymCount > 0) {
            addToast(`Cannot delete plan. ${gymCount} gym(s) are currently using this plan.`, 'error');
            return;
        }

        if (!confirm(`Delete plan "${planName}"? This action cannot be undone.`)) return;

        try {
            await axios.delete(`${API_URL}/api/v1/super-admin/plans/${planId}`, {
                withCredentials: true
            });
            addToast('Plan deleted successfully', 'success');
            fetchPlans();
        } catch (error: any) {
            console.error('Failed to delete plan:', error);
            addToast(error.response?.data?.message || 'Failed to delete plan', 'error');
        }
    };

    const handleEditPlan = (plan: Plan) => {
        setSelectedPlan(plan);
        setShowEditModal(true);
    };

    const handleEditSuccess = () => {
        addToast('Plan updated successfully', 'success');
        fetchPlans();
    };

    const handleCreateSuccess = () => {
        addToast('Plan created successfully', 'success');
        fetchPlans();
    };

    const formatPrice = (price: number, currency: string, cycle: string) => {
        if (price === 0) return 'Free';
        return `${currency === 'INR' ? '₹' : '$'}${price}/${cycle === 'monthly' ? 'mo' : 'yr'}`;
    };

    const formatLimit = (limit: number) => {
        return limit === Infinity || limit === 0 ? '∞' : limit.toString();
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Subscription Plans
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage pricing and limits for gym subscriptions
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Create Plan
                </button>
            </div>

            {/* Plans Grid */}
            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                        <div
                            key={plan._id}
                            className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 ${plan.isActive
                                ? 'border-blue-500'
                                : 'border-gray-300 dark:border-gray-600 opacity-60'
                                }`}
                        >
                            {/* Plan Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {plan.displayName}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {plan.name}
                                    </p>
                                </div>
                                {!plan.isActive && (
                                    <span className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                                        Inactive
                                    </span>
                                )}
                            </div>

                            {/* Price */}
                            <div className="mb-6">
                                <div className="text-3xl font-bold text-blue-600">
                                    {formatPrice(plan.price, plan.currency, plan.billingCycle)}
                                </div>
                            </div>

                            {/* Limits */}
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        Max Members
                                    </span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {formatLimit(plan.maxMembers)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        Max Staff
                                    </span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {formatLimit(plan.maxStaff)}
                                    </span>
                                </div>
                            </div>

                            {/* Features */}
                            <div className="mb-6">
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                    Features
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {plan.features.payments && (
                                        <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                                            Payments
                                        </span>
                                    )}
                                    {plan.features.attendance && (
                                        <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                                            Attendance
                                        </span>
                                    )}
                                    {plan.features.pt && (
                                        <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                                            PT
                                        </span>
                                    )}
                                    {plan.features.classes && (
                                        <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                                            Classes
                                        </span>
                                    )}
                                    {plan.features.memberPortal && (
                                        <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                                            Member Portal
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Gym Count */}
                            <div className="flex items-center gap-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
                                <Building2 className="w-4 h-4" />
                                <span>{plan.gymCount} gym{plan.gymCount !== 1 ? 's' : ''} using this plan</span>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEditPlan(plan)}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDeletePlan(plan._id, plan.displayName, plan.gymCount)}
                                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                    title="Delete Plan"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {plans.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No plans found. Create your first plan to get started.
                </div>
            )}

            {/* Create Plan Modal */}
            <CreatePlanModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={handleCreateSuccess}
            />

            {/* Edit Plan Modal */}
            <EditPlanModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedPlan(null);
                }}
                onSuccess={handleEditSuccess}
                plan={selectedPlan}
            />
        </div>
    );
}
