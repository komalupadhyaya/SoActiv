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
    Check,
    X,
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
import { useNavigate, useSearchParams } from 'react-router-dom';
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
    const [searchParams] = useSearchParams();
    const targetId = searchParams.get('id');
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const { user, isLoading: authLoading } = useAuth();
    const { staff, createStaff, updateStaff, deleteStaff, approveStaff, rejectStaff, bulkUpload, loading, error, fetchAllStaff } = useStaff();
    const { isToastVisible } = useToast();

    // State Management
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

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

    // Adjust status/role filters if a specific staff ID is requested
    useEffect(() => {
        if (targetId && staff.length > 0) {
            const targetMember = staff.find(s => s._id === targetId);
            if (targetMember) {
                if (statusFilter !== '' && targetMember.status !== statusFilter) {
                    setStatusFilter('');
                }
                if (roleFilter !== '' && !targetMember.position.toLowerCase().includes(roleFilter.toLowerCase())) {
                    setRoleFilter('');
                }
            }
        }
    }, [targetId, staff, statusFilter, roleFilter]);

    // Handle scroll and highlight for target staff member
    useEffect(() => {
        if (!loading && targetId && staff.some(s => s._id === targetId)) {
            setHighlightedId(targetId);

            const timer = setTimeout(() => {
                const element = document.getElementById(`staff-${targetId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 250);

            const clearTimer = setTimeout(() => {
                setHighlightedId(null);
            }, 5000);

            return () => {
                clearTimeout(timer);
                clearTimeout(clearTimer);
            };
        }
    }, [loading, targetId, staff]);

    // ============================================================
    // [2] PERMISSION LEVELS
    // ============================================================
    // Admin: Full CRUD (Create, Read, Update, Delete)
    // Manager: CRU only (Create, Read, Update) - NO DELETE
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
    const isManager = user?.role === 'staff' && user?.position === 'manager';
    const canManageStaff = isAdmin || isManager;
    const canDelete = isAdmin || isManager; // Admin or Manager can delete

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
    const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<Staff | undefined>(undefined);
    const [deletingStaff, setDeletingStaff] = useState<Staff | null>(null);
    const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Approval states
    const [viewingChangesStaff, setViewingChangesStaff] = useState<Staff | null>(null);
    const [isChangesModalOpen, setIsChangesModalOpen] = useState(false);

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

    const handleApproveRequest = async (id: string) => {
        await approveStaff(id);
    };

    const handleRejectRequest = async (id: string) => {
        await rejectStaff(id);
    };

    const handleViewChanges = (staffMember: Staff) => {
        setViewingChangesStaff(staffMember);
        setIsChangesModalOpen(true);
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
                                    <tr 
                                        key={member._id} 
                                        id={`staff-${member._id}`}
                                        className={`transition-all duration-500 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                                            highlightedId === member._id
                                                ? 'ring-2 ring-orange-500 dark:ring-orange-450 bg-orange-50/50 dark:bg-orange-950/20'
                                                : ''
                                        }`}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {member.fullName}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {member.position}
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
                                            <div className="flex flex-col gap-1">
                                                <Badge className={statusColors[member.status as keyof typeof statusColors]}>
                                                    {member.status}
                                                </Badge>
                                                {member.approvalStatus && member.approvalStatus !== 'approved' && (
                                                    <Badge className={
                                                        member.approvalStatus === 'pending_create' ? 'bg-yellow-100 text-yellow-850 dark:bg-yellow-950/40 dark:text-yellow-400' :
                                                        member.approvalStatus === 'pending_update' ? 'bg-blue-100 text-blue-850 dark:bg-blue-950/40 dark:text-blue-400' :
                                                        'bg-rose-100 text-rose-850 dark:bg-rose-950/40 dark:text-rose-400'
                                                    }>
                                                        {member.approvalStatus === 'pending_create' ? 'Creation Pending' :
                                                         member.approvalStatus === 'pending_update' ? 'Update Pending' :
                                                         'Deletion Pending'}
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        {canManageStaff && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    {isAdmin && member.approvalStatus && member.approvalStatus !== 'approved' ? (
                                                        <>
                                                            {member.approvalStatus === 'pending_create' && (
                                                                 <>
                                                                     <Button
                                                                         size="sm"
                                                                         variant="ghost"
                                                                         className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30"
                                                                         onClick={() => handleRejectRequest(member._id)}
                                                                         disabled={isToastVisible}
                                                                         title="Reject Request"
                                                                     >
                                                                         <X size={16} />
                                                                     </Button>
                                                                     <Button
                                                                         size="sm"
                                                                         variant="ghost"
                                                                         className="text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30"
                                                                         onClick={() => handleApproveRequest(member._id)}
                                                                         disabled={isToastVisible}
                                                                         title="Approve Creation"
                                                                     >
                                                                         <Check size={16} />
                                                                     </Button>
                                                                 </>
                                                             )}
                                                            {member.approvalStatus === 'pending_update' && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleViewChanges(member)}
                                                                    disabled={isToastVisible}
                                                                >
                                                                    View Changes
                                                                </Button>
                                                            )}
                                                            {member.approvalStatus === 'pending_delete' && (
                                                                 <>
                                                                     <Button
                                                                         size="sm"
                                                                         variant="ghost"
                                                                         className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30"
                                                                         onClick={() => handleRejectRequest(member._id)}
                                                                         disabled={isToastVisible}
                                                                         title="Reject Request"
                                                                     >
                                                                         <X size={16} />
                                                                     </Button>
                                                                     <Button
                                                                         size="sm"
                                                                         variant="ghost"
                                                                         className="text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30"
                                                                         onClick={() => handleApproveRequest(member._id)}
                                                                         disabled={isToastVisible}
                                                                         title="Approve Deletion"
                                                                     >
                                                                         <Check size={16} />
                                                                     </Button>
                                                                 </>
                                                             )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                                                                title="Edit"
                                                                onClick={() => handleEdit(member)}
                                                                disabled={isToastVisible || (member.approvalStatus && member.approvalStatus !== 'approved')}
                                                            >
                                                                <Edit size={16} />

                                                            </Button>
                                                            {/* [2] ONLY ADMIN CAN DELETE - Manager cannot */}
                                                            {canDelete && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900"
                                                                    onClick={() => handleDeleteClick(member)}
                                                                    disabled={isToastVisible || (member.approvalStatus && member.approvalStatus !== 'approved')}
                                                                >
                                                                    <Trash2 size={14} />
                                                                </Button>
                                                            )}
                                                        </>
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
                            <Card 
                                key={member._id} 
                                id={`staff-${member._id}`}
                                className={`border transition-all duration-500 ${
                                    highlightedId === member._id
                                        ? 'ring-2 ring-orange-500 dark:ring-orange-450 bg-orange-50/50 dark:bg-orange-950/20 border-orange-500'
                                        : 'border-gray-200 dark:border-gray-700'
                                }`}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div>
                                            <div className="text-base font-semibold text-gray-900 dark:text-white">
                                                {member.fullName}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {member.position}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 items-end">
                                            <Badge className={statusColors[member.status as keyof typeof statusColors]}>
                                                {member.status}
                                            </Badge>
                                            {member.approvalStatus && member.approvalStatus !== 'approved' && (
                                                <Badge className={
                                                    member.approvalStatus === 'pending_create' ? 'bg-yellow-100 text-yellow-850 dark:bg-yellow-950/40 dark:text-yellow-400' :
                                                    member.approvalStatus === 'pending_update' ? 'bg-blue-100 text-blue-850 dark:bg-blue-950/40 dark:text-blue-400' :
                                                    'bg-rose-100 text-rose-850 dark:bg-rose-950/40 dark:text-rose-400'
                                                }>
                                                    {member.approvalStatus === 'pending_create' ? 'Creation Pending' :
                                                     member.approvalStatus === 'pending_update' ? 'Update Pending' :
                                                     'Deletion Pending'}
                                                </Badge>
                                            )}
                                        </div>
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
                                        <div className="mt-2 flex flex-wrap justify-end gap-2 w-full">
                                            {isAdmin && member.approvalStatus && member.approvalStatus !== 'approved' ? (
                                                <>
                                                    {member.approvalStatus === 'pending_create' && (
                                                         <>
                                                             <Button
                                                                 size="sm"
                                                                 variant="ghost"
                                                                 className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 flex-1"
                                                                 onClick={() => handleRejectRequest(member._id)}
                                                                 disabled={isToastVisible}
                                                                 title="Reject Request"
                                                             >
                                                                 <X size={16} />
                                                             </Button>
                                                             <Button
                                                                 size="sm"
                                                                 variant="ghost"
                                                                 className="text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 flex-1"
                                                                 onClick={() => handleApproveRequest(member._id)}
                                                                 disabled={isToastVisible}
                                                                 title="Approve Creation"
                                                             >
                                                                 <Check size={16} />
                                                             </Button>
                                                         </>
                                                     )}
                                                    {member.approvalStatus === 'pending_update' && (
                                                         <Button
                                                             size="sm"
                                                             variant="outline"
                                                             onClick={() => handleViewChanges(member)}
                                                             disabled={isToastVisible}
                                                             className="w-full"
                                                         >
                                                             View Changes
                                                         </Button>
                                                     )}
                                                    {member.approvalStatus === 'pending_delete' && (
                                                         <>
                                                             <Button
                                                                 size="sm"
                                                                 variant="ghost"
                                                                 className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 flex-1"
                                                                 onClick={() => handleRejectRequest(member._id)}
                                                                 disabled={isToastVisible}
                                                                 title="Reject Request"
                                                             >
                                                                 <X size={16} />
                                                             </Button>
                                                             <Button
                                                                 size="sm"
                                                                 variant="ghost"
                                                                 className="text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 flex-1"
                                                                 onClick={() => handleApproveRequest(member._id)}
                                                                 disabled={isToastVisible}
                                                                 title="Approve Deletion"
                                                             >
                                                                 <Check size={16} />
                                                             </Button>
                                                         </>
                                                     )}
                                                </>
                                            ) : (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleEdit(member)}
                                                        className="flex-1"
                                                        disabled={isToastVisible || (member.approvalStatus && member.approvalStatus !== 'approved')}
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
                                                            disabled={isToastVisible || (member.approvalStatus && member.approvalStatus !== 'approved')}
                                                        >
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    )}
                                                </>
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

            {viewingChangesStaff && viewingChangesStaff.pendingUpdates && (
                <Modal
                    isOpen={isChangesModalOpen}
                    onClose={() => {
                        setIsChangesModalOpen(false);
                        setViewingChangesStaff(null);
                    }}
                    title="Compare Proposed Updates"
                    size="md"
                >
                    <div className="p-1">
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Review changes proposed for staff member <strong>{viewingChangesStaff.fullName}</strong>.
                        </p>
                        <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg mb-6">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Field</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Current</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Proposed</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                    {Object.keys(viewingChangesStaff.pendingUpdates)
                                        .filter((key) => ['fullName', 'email', 'position', 'contactNumber', 'joiningDate', 'salary', 'status', 'notifications'].includes(key))
                                        .map((key) => {
                                            const currentValue = (viewingChangesStaff as any)[key];
                                            const proposedValue = (viewingChangesStaff.pendingUpdates as any)[key];

                                            const areEqual = (a: any, b: any, fieldKey: string) => {
                                                if (a === b) return true;
                                                if (fieldKey === 'joiningDate' && a && b) {
                                                    const timeA = Date.parse(a);
                                                    const timeB = Date.parse(b);
                                                    if (!isNaN(timeA) && !isNaN(timeB)) {
                                                        return new Date(timeA).toLocaleDateString() === new Date(timeB).toLocaleDateString();
                                                    }
                                                }
                                                if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
                                                    return JSON.stringify(a) === JSON.stringify(b);
                                                }
                                                return false;
                                            };

                                            if (areEqual(currentValue, proposedValue, key) || proposedValue === undefined) return null;

                                            const fieldLabel = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                                            const formatVal = (v: any, fieldKey: string) => {
                                                if (v instanceof Date || (typeof v === 'string' && !isNaN(Date.parse(v)) && v.includes('-'))) {
                                                    return new Date(v).toLocaleDateString();
                                                }
                                                if (fieldKey === 'notifications' && typeof v === 'object' && v !== null) {
                                                    const activeChannels = Object.entries(v)
                                                        .filter(([_, enabled]) => enabled === true)
                                                        .map(([channel]) => channel.toUpperCase());
                                                    return activeChannels.length > 0 ? activeChannels.join(', ') : 'None';
                                                }
                                                if (typeof v === 'object' && v !== null) {
                                                    return JSON.stringify(v);
                                                }
                                                return String(v);
                                            };

                                            return (
                                                <tr key={key} className="text-sm">
                                                    <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">{fieldLabel}</td>
                                                    <td className="px-4 py-2 text-gray-500 dark:text-gray-400 line-through">{formatVal(currentValue, key)}</td>
                                                    <td className="px-4 py-2 text-green-600 dark:text-green-400 font-semibold">{formatVal(proposedValue, key)}</td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <Button variant="outline" onClick={() => {
                                setIsChangesModalOpen(false);
                                setViewingChangesStaff(null);
                            }}>
                                Close
                            </Button>
                            <Button
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={async () => {
                                    await rejectStaff(viewingChangesStaff._id);
                                    setIsChangesModalOpen(false);
                                    setViewingChangesStaff(null);
                                }}
                            >
                                Reject Changes
                            </Button>
                            <Button
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={async () => {
                                    await approveStaff(viewingChangesStaff._id);
                                    setIsChangesModalOpen(false);
                                    setViewingChangesStaff(null);
                                }}
                            >
                                Approve Changes
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};
