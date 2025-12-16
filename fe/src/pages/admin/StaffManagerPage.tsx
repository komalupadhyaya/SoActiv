import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Filter,
    User,
    Phone,
    Calendar,
    DollarSign,
    Trash2,
    Upload,
    Edit,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { BulkUploadModal } from '../../components/common/BulkUploadModal';
import { UploadResultsReport } from '../../components/common/UploadResultsReport';
import { useStaff, type BulkUploadResult, Staff } from '../../hooks/useStaff';
import { useNavigate } from 'react-router-dom';
import { StaffFormModal } from '../admin/StaffFormModal';
import { StaffFormData } from '../admin/StaffValidation';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

const statusColors = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    inactive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export const StaffManagerPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, isLoading: authLoading } = useAuth();
    const { staff, createStaff, updateStaff, deleteStaff, bulkUpload, loading, error, fetchAllStaff } = useStaff();
    const { isToastVisible } = useToast();

    // ============================================================
    // [1] STRICT ACCESS CONTROL GUARD
    // ============================================================
    // Only Admin OR (Staff with Manager position) can access this page
    // All other staff positions must be redirected
    useEffect(() => {
        if (authLoading) return; // Wait for auth to load

        if (!user) {
            navigate('/login');
            return;
        }

        // Check if user has permission to access this page
        const isAdmin = user.role === 'admin' || user.role === 'superadmin';
        const isManager = user.role === 'staff' && user.position === 'manager';

        if (!isAdmin && !isManager) {
            // Redirect unauthorized staff (trainer, sales, maintenance, cleaner, etc.)
            navigate('/not-authorized');
        } else {
            // Fetch staff if authorized
            fetchAllStaff();
        }
    }, [user, authLoading, navigate, fetchAllStaff]);

    // ============================================================
    // [2] PERMISSION LEVELS
    // ============================================================
    // Admin: Full CRUD (Create, Read, Update, Delete)
    // Manager: CRU only (Create, Read, Update) - NO DELETE
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
    const isManager = user?.role === 'staff' && user?.position === 'manager';
    const canManageStaff = isAdmin || isManager;
    const canDelete = isAdmin; // ONLY Admin can delete

    // State Management
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
    const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<Staff | undefined>(undefined);
    const [deletingStaff, setDeletingStaff] = useState<Staff | null>(null);
    const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const filteredStaff = staff.filter((member) => {
        const matchesSearch =
            member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.contactNumber.includes(searchQuery) ||
            member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.position.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole =
            !roleFilter || member.position.toLowerCase().includes(roleFilter.toLowerCase());
        const matchesStatus = !statusFilter || member.status === statusFilter;

        return matchesSearch && matchesRole && matchesStatus;
    });

    // Handlers
    const handleCreate = () => {
        setSelectedStaff(undefined);
        setIsFormModalOpen(true);
    };

    const handleEdit = (staffMember: Staff) => {
        setSelectedStaff(staffMember);
        setIsFormModalOpen(true);
    };

    const handleDeleteClick = (staffMember: Staff) => {
        setDeletingStaff(staffMember);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingStaff) return;
        const result = await deleteStaff(deletingStaff._id);
        if (result) {
            setDeletingStaff(null);
            setIsDeleteModalOpen(false);
        }
    };

    const handleFormSubmit = async (formData: StaffFormData) => {
        setIsSubmitting(true);
        try {
            const submissionData = {
                ...formData,
                salary: Number(formData.salary),
            };

            let result;
            if (selectedStaff) {
                result = await updateStaff(selectedStaff._id, submissionData);
            } else {
                result = await createStaff(submissionData);
            }

            if (result) {
                setIsFormModalOpen(false);
                setSelectedStaff(undefined);
            }
        } catch (error) {
            // Error handled by useStaff hook (toast)
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBulkUpload = async (file: File) => {
        const result = await bulkUpload(file);
        if (result) {
            setUploadResult(result);
            setIsBulkUploadModalOpen(false);
            setIsResultsModalOpen(true);
        }
        return result;
    };

    if (loading && staff.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    if (error && staff.length === 0) {
        return <div className="p-6 text-red-500">Error: {error}</div>;
    }

    return (
        <div className="space-y-3 px-2 py-3 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Management</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage your gym staff, roles, and payroll
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    {/* Mark Attendance → ADMIN ONLY */}
                    {isAdmin && (
                        <Button
                            variant="outline"
                            onClick={() => navigate('/admin/staff-attendance')}
                            disabled={isToastVisible}
                        >
                            Mark Attendance
                        </Button>
                    )}

                    {canManageStaff && (
                        <>
                            {isAdmin && (
                                <Button variant="outline" onClick={() => setIsBulkUploadModalOpen(true)} disabled={isToastVisible}>
                                    <Upload size={16} className="mr-2" />
                                    Bulk Upload
                                </Button>
                            )}
                            <Button onClick={handleCreate} disabled={isToastVisible}>
                                <Plus size={16} className="mr-2" />
                                Add Staff
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Total Staff
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {staff.length}
                                </p>
                            </div>
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {staff.filter((s) => s.status === 'active').length}
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <User className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Trainers</p>
                                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                    {staff.filter((s) => s.position.toLowerCase().includes('trainer')).length}
                                </p>
                            </div>
                            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                <User className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Total Payroll
                                </p>
                                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                                    ₹{staff.reduce((sum, s) => sum + s.salary, 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                                <DollarSign className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Search by name, phone, email, or position..."
                                leftIcon={<Search size={16} />}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div className="w-full lg:w-48">
                            <Select
                                options={[
                                    { value: '', label: 'All Roles' },
                                    { value: 'trainer', label: 'Trainers' },
                                    { value: 'receptionist', label: 'Receptionists' },
                                    { value: 'manager', label: 'Managers' },
                                    { value: 'sales', label: 'Sales' },
                                    { value: 'cleaner', label: 'Cleaners' },
                                ]}
                                value={roleFilter}
                                onChange={(value) => setRoleFilter(value)}
                                placeholder="All Roles"
                            />
                        </div>
                        <div className="w-full lg:w-48">
                            <Select
                                options={[
                                    { value: '', label: 'All Status' },
                                    { value: 'active', label: 'Active' },
                                    { value: 'inactive', label: 'Inactive' },
                                ]}
                                value={statusFilter}
                                onChange={(value) => setStatusFilter(value)}
                                placeholder="All Status"
                            />
                        </div>
                        <Button variant="outline" className="lg:w-auto">
                            <Filter size={16} className="mr-2" />
                            More Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Staff Table (Desktop) */}
            <Card className="hidden md:block">
                <CardHeader>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        All Staff ({filteredStaff.length})
                    </h3>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Staff Member
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Joining Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Salary
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    {canManageStaff && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredStaff.map((member) => (
                                    <tr key={member._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                                                    <span className="text-orange-600 dark:text-orange-400 font-semibold">
                                                        {member.fullName.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {member.fullName}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {member.position}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="space-y-1">
                                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                    <Phone size={12} className="mr-1" />
                                                    {member.contactNumber}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {member.email}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                <Calendar size={12} className="mr-1" />
                                                {new Date(member.joiningDate).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm font-medium text-gray-900 dark:text-white">
                                                ₹ {member.salary.toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge className={statusColors[member.status as keyof typeof statusColors]}>
                                                {member.status}
                                            </Badge>
                                        </td>
                                        {canManageStaff && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleEdit(member)}
                                                        disabled={isToastVisible}
                                                    >
                                                        <Edit size={14} className="mr-1" />
                                                        Edit
                                                    </Button>
                                                    {/* [2] ONLY ADMIN CAN DELETE - Manager cannot */}
                                                    {canDelete && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900"
                                                            onClick={() => handleDeleteClick(member)}
                                                            disabled={isToastVisible}
                                                        >
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Staff Cards (Mobile & Tablet) */}
            <Card className="md:hidden">
                <CardHeader>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        All Staff ({filteredStaff.length})
                    </h3>
                </CardHeader>
                <CardContent className="space-y-4 p-4">
                    {filteredStaff.length === 0 ? (
                        <p className="text-center text-gray-500 dark:text-gray-400">No staff found.</p>
                    ) : (
                        filteredStaff.map((member) => (
                            <Card key={member._id} className="border border-gray-200 dark:border-gray-700">
                                <CardContent className="p-4">
                                    {/* Top: Avatar, name, position, status */}
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                                                <span className="text-orange-600 dark:text-orange-400 font-semibold">
                                                    {member.fullName.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="text-base font-semibold text-gray-900 dark:text-white">
                                                    {member.fullName}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {member.position}
                                                </div>
                                            </div>
                                        </div>
                                        <Badge className={statusColors[member.status as keyof typeof statusColors]}>
                                            {member.status}
                                        </Badge>
                                    </div>

                                    {/* Contact */}
                                    <div className="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-300 mb-2">
                                        <div className="flex items-center gap-2">
                                            <Phone size={14} className="text-gray-400" />
                                            <span>{member.contactNumber}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 pl-6">
                                            {member.email}
                                        </div>
                                    </div>

                                    {/* Joining date & salary */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm mb-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center text-gray-500 dark:text-gray-400 gap-2">
                                            <Calendar size={14} />
                                            <span>{new Date(member.joiningDate).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center font-medium text-gray-900 dark:text-white gap-1">
                                            <DollarSign size={14} />
                                            <span>₹ {member.salary.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {canManageStaff && (
                                        <div className="mt-2 flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleEdit(member)}
                                                className="flex-1"
                                                disabled={isToastVisible}
                                            >
                                                <Edit size={14} className="mr-1" />
                                                Edit
                                            </Button>
                                            {/* [2] ONLY ADMIN CAN DELETE - Manager cannot */}
                                            {canDelete && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900"
                                                    onClick={() => handleDeleteClick(member)}
                                                    disabled={isToastVisible}
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </CardContent>
            </Card>

            {/* Modals */}
            <StaffFormModal
                isOpen={isFormModalOpen}
                onClose={() => {
                    setIsFormModalOpen(false);
                    setSelectedStaff(undefined);
                }}
                onSubmit={handleFormSubmit}
                initialData={selectedStaff as StaffFormData}
                isSubmitting={isSubmitting}
            />

            {deletingStaff && (
                <Modal
                    isOpen={isDeleteModalOpen}
                    onClose={() => {
                        setIsDeleteModalOpen(false);
                        setDeletingStaff(null);
                    }}
                    title="Confirm Delete"
                    size="md"
                >
                    <div className="p-1">
                        <p className="text-gray-700 dark:text-gray-300 mb-6">
                            Are you sure you want to delete <strong>{deletingStaff.fullName}</strong>? This
                            action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <Button variant="outline" onClick={() => {
                                setIsDeleteModalOpen(false);
                                setDeletingStaff(null);
                            }}>
                                Cancel
                            </Button>
                            <Button
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={handleConfirmDelete}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            <BulkUploadModal
                isOpen={isBulkUploadModalOpen}
                onClose={() => setIsBulkUploadModalOpen(false)}
                onUpload={handleBulkUpload}
                type="staff"
            />

            <UploadResultsReport
                isOpen={isResultsModalOpen}
                onClose={() => setIsResultsModalOpen(false)}
                result={uploadResult}
                type="staff"
            />
        </div>
    );
};
