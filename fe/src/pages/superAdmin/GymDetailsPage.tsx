import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, TrendingUp, Shield, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../hooks/useConfirm';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '').replace(/\/api\/v1$/, '');

interface GymDetails {
    _id: string;
    name: string;
    address?: string;
    phone?: string;
    plan: string;
    status: string;
    trialEndsAt?: string;
    features: {
        payments: boolean;
        attendance: boolean;
        pt: boolean;
        classes: boolean;
        memberPortal: boolean;
    };
    owner: { fullname: string; email: string };
    createdAt: string;
}

export function GymDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
    const [gym, setGym] = useState<GymDetails | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGymDetails();
    }, [id]);

    const fetchGymDetails = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/v1/super-admin/gyms/${id}`, {
                withCredentials: true
            });
            setGym(response.data.data.gym);
            setStats(response.data.data.stats);
        } catch (error) {
            console.error('Failed to fetch gym details:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleFeature = async (featureName: string, currentValue: boolean) => {
        if (!await confirm(`Are you sure you want to ${currentValue ? 'disable' : 'enable'} ${featureName}?`, { title: 'Confirm Feature Toggle' })) {
            return;
        }

        try {
            await axios.patch(
                `${API_URL}/api/v1/super-admin/gyms/${id}/features/${featureName}`,
                { enabled: !currentValue },
                { withCredentials: true }
            );
            addToast('Feature toggled successfully', 'success');
            fetchGymDetails();
        } catch (error) {
            console.error('Failed to toggle feature:', error);
            addToast('Failed to toggle feature', 'error');
        }
    };

    const updateStatus = async (newStatus: string) => {
        if (!await confirm(`Are you sure you want to change status to ${newStatus}?`, { title: 'Confirm Status Change' })) {
            return;
        }

        try {
            await axios.patch(
                `${API_URL}/api/v1/super-admin/gyms/${id}/status`,
                { status: newStatus },
                { withCredentials: true }
            );
            addToast('Status updated successfully', 'success');
            fetchGymDetails();
        } catch (error) {
            console.error('Failed to update status:', error);
            addToast('Failed to update status', 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!gym) {
        return <div>Gym not found</div>;
    }

    const features = [
        { key: 'payments', label: 'Payments', icon: '💳', description: 'Payment gateway integration' },
        { key: 'attendance', label: 'Attendance', icon: '✅', description: 'Member check-in/out system' },
        { key: 'pt', label: 'Personal Training', icon: '💪', description: 'PT packages and sessions' },
        { key: 'classes', label: 'Classes', icon: '🏋️', description: 'Group class management' },
        { key: 'memberPortal', label: 'Member Portal', icon: '👤', description: 'Member self-service' }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <button
                        onClick={() => navigate('/super-admin/gyms')}
                        className="text-indigo-600 hover:text-indigo-800 mb-2 flex items-center gap-1"
                    >
                        ← Back to Gyms
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{gym.name}</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Gym Details & Management</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Members</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalMembers || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Active Members</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.activeMembers || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                            <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Staff</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.staff || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gym Info & Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Gym Information</h3>
                    <div className="space-y-3">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Owner</p>
                            <p className="font-medium text-gray-900 dark:text-white">{gym.owner.fullname}</p>
                            <p className="text-sm text-gray-500">{gym.owner.email}</p>
                        </div>
                        {gym.address && (
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
                                <p className="font-medium text-gray-900 dark:text-white">{gym.address}</p>
                            </div>
                        )}
                        {gym.phone && (
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                                <p className="font-medium text-gray-900 dark:text-white">{gym.phone}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                                {new Date(gym.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Plan & Status</h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Plan</p>
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                                {gym.plan.toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Status</p>
                            <div className="flex gap-2">
                                {['active', 'trial', 'suspended', 'expired'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => updateStatus(status)}
                                        className={`px-3 py-1 rounded-full text-sm font-semibold ${gym.status === status
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {gym.trialEndsAt && gym.status === 'trial' && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Trial Period</p>
                                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                            Ends on {new Date(gym.trialEndsAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Feature Toggles */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Feature Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {features.map((feature) => (
                        <div
                            key={feature.key}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-indigo-300 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{feature.icon}</span>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{feature.label}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{feature.description}</p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => toggleFeature(feature.key, gym.features[feature.key as keyof typeof gym.features])}
                                className={`w-full mt-3 px-4 py-2 rounded-lg font-medium transition-colors ${gym.features[feature.key as keyof typeof gym.features]
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                    }`}
                            >
                                {gym.features[feature.key as keyof typeof gym.features] ? 'Enabled' : 'Disabled'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            <ConfirmModal
                isOpen={confirmState.isOpen}
                onClose={handleCancel}
                onConfirm={handleConfirm}
                title={confirmState.title}
                message={confirmState.message}
                confirmText={confirmState.confirmText}
                cancelText={confirmState.cancelText}
                type={confirmState.type}
            />
        </div>
    );
}
