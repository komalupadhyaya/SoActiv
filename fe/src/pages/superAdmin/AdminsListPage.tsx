import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Search, Key, LogOut as LogOutIcon, Loader2, RefreshCw, Eye, EyeOff } from 'lucide-react';
import GymModal from '../../components/modals/GymModal';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../hooks/useConfirm';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

import { Modal } from '../../components/ui/Modal'; // Import Modal

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Admin {
    _id: string;
    fullname: string;
    email: string;
    phone?: string;
    gym: {
        _id: string;
        name: string;
    };
    createdAt: string;
    lastActiveAt?: string;
}

export default function AdminsListPage() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Password Reset State
    const [passwordResetState, setPasswordResetState] = useState<{
        adminId: string | null;
        adminName: string;
        newPassword: string;
    }>({
        adminId: null,
        adminName: '',
        newPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        fetchAdmins();
    }, [page, searchTerm]);

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/api/v1/super-admin/admins`, {
                params: {
                    page,
                    limit: 20,
                    search: searchTerm || undefined
                },
                withCredentials: true
            });

            if (response.data.success) {
                setAdmins(response.data.data.admins);
                setTotalPages(response.data.data.pagination.pages);
            }
        } catch (error: any) {
            console.error('Failed to fetch admins:', error);
            if (error.response?.status === 401) {
                navigate('/super-admin/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = (adminId: string, adminName: string) => {
        setPasswordResetState({
            adminId,
            adminName,
            newPassword: ''
        });
    };

    const handlePasswordResetSubmit = async () => {
        const { adminId, adminName, newPassword } = passwordResetState;
        if (!adminId || !newPassword) return;

        if (newPassword.length < 6) {
            addToast('Password must be at least 6 characters', 'error');
            return;
        }

        // Close password modal first to avoid overlap, or keep open until partial success?
        // Let's close it after success or confirmation.

        // Optional: We can still use confirm() here or just proceed since they explicitly typed a password and clicked "Reset" in a dedicated modal.
        // The previous flow had a confirm dialog AFTER the prompt. 
        // Let's keep the confirm dialog for safety, but maybe it's redundant if they hit "Reset Password" button?
        // User asked to replace alert with toast/modal. A dedicated modal is "intentional" enough.
        // I will skipping the extra "Are you sure?" confirm step to make it smoother, as typing the password is intent enough.

        try {
            await axios.post(
                `${API_URL}/api/v1/super-admin/admins/${adminId}/reset-password`,
                { newPassword },
                { withCredentials: true }
            );
            addToast(`Password reset successfully for ${adminName}`, 'success');
            setPasswordResetState({ adminId: null, adminName: '', newPassword: '' });
            setShowPassword(false);
        } catch (error: any) {
            console.error('Failed to reset password:', error);
            addToast(error.response?.data?.message || 'Failed to reset password', 'error');
        }
    };

    const handleForceLogout = async (adminId: string, adminName: string, lastActiveAt?: string) => {
        const isActive = isOnline(lastActiveAt);

        if (!isActive) {
            addToast(`Cannot force logout ${adminName} because they are already INACTIVE.`, 'info');
            return;
        }

        if (!await confirm(`Force logout ${adminName}? They are currently ACTIVE.`, {
            title: 'Force Logout',
            type: 'warning'
        })) return;

        try {
            await axios.post(
                `${API_URL}/api/v1/super-admin/admins/${adminId}/force-logout`,
                {},
                { withCredentials: true }
            );
            addToast('Admin logged out successfully', 'success');
            fetchAdmins(); // Auto-refresh the list
        } catch (error: any) {
            console.error('Failed to force logout:', error);
            addToast(error.response?.data?.message || 'Failed to force logout', 'error');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const isOnline = (dateString?: string) => {
        if (!dateString) return false;
        const lastActive = new Date(dateString);
        const now = new Date();
        // Consider online if active within last 2 minutes
        const diffInMinutes = (now.getTime() - lastActive.getTime()) / 1000 / 60;
        return diffInMinutes < 5;
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Gym Admins
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage gym owners and administrators
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchAdmins}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        title="Refresh List"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Create Admin
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : (
                <>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Gym
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Created
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {admins.map((admin) => (
                                        <tr key={admin._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {admin.fullname}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {isOnline(admin.lastActiveAt) ? (
                                                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                                            Inactive
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    {admin.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {admin.gym?.name || 'No Gym'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    {formatDate(admin.createdAt)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleResetPassword(admin._id, admin.fullname)}
                                                        className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400"
                                                        title="Reset Password"
                                                    >
                                                        <Key className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleForceLogout(admin._id, admin.fullname, admin.lastActiveAt)}
                                                        className="text-orange-600 hover:text-orange-900 dark:hover:text-orange-400"
                                                        title="Force Logout"
                                                    >
                                                        <LogOutIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {admins.length === 0 && (
                                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                    No admins found
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-6">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                Previous
                            </button>
                            <span className="px-4 py-2 text-gray-900 dark:text-white">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Create Admin (Gym Owner) Modal */}
            <GymModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={fetchAdmins}
            />

            {/* Password Reset Modal */}
            <Modal
                isOpen={!!passwordResetState.adminId}
                onClose={() => {
                    setPasswordResetState({ adminId: null, adminName: '', newPassword: '' });
                    setShowPassword(false);
                }}
                title={`Reset Password for ${passwordResetState.adminName}`}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={passwordResetState.newPassword}
                                onChange={(e) => setPasswordResetState({ ...passwordResetState, newPassword: e.target.value })}
                                className="w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter new password (min 6 chars)"
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={() => {
                                setPasswordResetState({ adminId: null, adminName: '', newPassword: '' });
                                setShowPassword(false);
                            }}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handlePasswordResetSubmit}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Reset Password
                        </button>
                    </div>
                </div>
            </Modal>

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
