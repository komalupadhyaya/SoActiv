// pages/StaffPage.tsx
import React, { useState } from 'react';
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
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { StaffRegistrationForm } from '../../components/forms/newStaffForm';
import { Modal } from '../../components/ui/Modal';
import { BulkUploadModal } from '../../components/common/BulkUploadModal';
import { UploadResultsReport } from '../../components/common/UploadResultsReport';
import { useStaff, type BulkUploadResult, Staff } from '../../hooks/useStaff';
import { useNavigate } from 'react-router-dom';

const statusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  inactive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export const StaffPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [deletingStaff, setDeletingStaff] = useState<Staff | null>(null);

  const navigate = useNavigate();

  const { staff, createStaff, updateStaff, deleteStaff, bulkUpload, loading, error } = useStaff();

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

  const handleSaveStaff = async (formData: any) => {
    let result;

    if (editingStaff) {
      result = await updateStaff(editingStaff._id, formData);
    } else {
      result = await createStaff(formData);
    }

    if (result) {
      setIsAddStaffModalOpen(false);
      setEditingStaff(null);
    }
  };

  const handleDeleteClick = (staffMember: Staff) => {
    setDeletingStaff(staffMember);
  };

  const handleConfirmDelete = async () => {
    if (!deletingStaff) return;
    const result = await deleteStaff(deletingStaff._id);
    if (result) {
      setDeletingStaff(null);
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
    return <div className="p-6">Loading staff...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your gym staff and their information
          </p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <Button variant="outline" onClick={() => navigate('/admin/staff-attendance')}>
            Mark Attendance
          </Button>
          <Button variant="outline" onClick={() => setIsBulkUploadModalOpen(true)}>
            <Upload size={16} className="mr-2" />
            Bulk Upload
          </Button>
          <Button
            onClick={() => {
              setEditingStaff(null);
              setIsAddStaffModalOpen(true);
            }}
          >
            <Plus size={16} className="mr-2" />
            Add New Staff
          </Button>
        </div>
      </div>

      {/* Stats */}
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
              <User className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {staff.filter((s) => s.status === 'active').length}
                </p>
              </div>
              <User className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Trainers</p>
                <p className="text-2xl font-bold text-orange-600">
                  {staff.filter((s) => s.position.toLowerCase().includes('trainer')).length}
                </p>
              </div>
              <User className="w-8 h-8 text-orange-500" />
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
                <p className="text-2xl font-bold text-teal-600">
                  ₹{staff.reduce((sum, s) => sum + s.salary, 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-teal-500" />
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
                className="!w-[20rem]"
              />
            </div>
            <Select
              options={[
                { value: '', label: 'All Roles' },
                { value: 'trainer', label: 'Trainers' },
                { value: 'receptionist', label: 'Receptionists' },
                { value: 'manager', label: 'Managers' },
                { value: 'sales', label: 'Sales' },
                { value: 'housekeep', label: 'Housekeeps' },
              ]}
              value={roleFilter}
              onChange={(value) => setRoleFilter(value)}
            />
            <Select
              options={[
                { value: '', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
            />
            <Button variant="outline">
              <Filter size={16} className="mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table (desktop) */}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredStaff.map((member) => (
                  <tr key={member._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <User size={20} className="text-gray-600 dark:text-gray-300" />
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
                      <Badge className={statusColors[member.status]}>
                        {member.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingStaff(member);
                            setIsAddStaffModalOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900"
                          onClick={() => handleDeleteClick(member)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Staff Cards (tablet & mobile) */}
      <Card className="md:hidden">
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            All Staff ({filteredStaff.length})
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredStaff.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">No staff found.</p>
          ) : (
            filteredStaff.map((member) => (
              <Card key={member._id}>
                <CardContent className="p-4">
                  {/* Top: Avatar, name, position, status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <User size={20} className="text-gray-700 dark:text-gray-200" />
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
                    <Badge className={statusColors[member.status]}>
                      {member.status}
                    </Badge>
                  </div>

                  {/* Contact */}
                  <div className="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-300 mb-2">
                    <div className="flex items-center gap-2">
                      <Phone size={14} />
                      <span>{member.contactNumber}</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {member.email}
                    </div>
                  </div>

                  {/* Joining date & salary */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm mb-3">
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
                  <div className="mt-2 flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingStaff(member);
                        setIsAddStaffModalOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900"
                      onClick={() => handleDeleteClick(member)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Staff Modal */}
      <Modal
        isOpen={isAddStaffModalOpen}
        onClose={() => {
          setIsAddStaffModalOpen(false);
          setEditingStaff(null);
        }}
        title={editingStaff ? 'Edit Staff Member' : 'Add New Staff'}
        size="xl"
      >
        <div className="flex flex-col h-full max-h-[90vh]">
          <StaffRegistrationForm
            onClose={() => {
              setIsAddStaffModalOpen(false);
              setEditingStaff(null);
            }}
            onSubmit={handleSaveStaff}
            initialData={editingStaff || undefined}
          />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      {deletingStaff && (
        <Modal
          isOpen={true}
          onClose={() => setDeletingStaff(null)}
          title="Confirm Delete"
          size="md"
        >
          <div className="p-6">
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete <strong>{deletingStaff.fullName}</strong>? This
              action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setDeletingStaff(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={isBulkUploadModalOpen}
        onClose={() => setIsBulkUploadModalOpen(false)}
        onUpload={handleBulkUpload}
        type="staff"
      />

      {/* Upload Results Modal */}
      <UploadResultsReport
        isOpen={isResultsModalOpen}
        onClose={() => setIsResultsModalOpen(false)}
        result={uploadResult}
        type="staff"
      />
    </div>
  );
};

export default StaffPage;
