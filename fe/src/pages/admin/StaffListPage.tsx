import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Search,
  User,
  Phone,
  Calendar,
  Trash2,
  Upload,
  Edit,
  ChevronDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { BulkUploadModal } from '../../components/common/BulkUploadModal';
import { UploadResultsReport } from '../../components/common/UploadResultsReport';
import { useStaff, type BulkUploadResult, Staff } from '../../hooks/useStaff';

const statusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  inactive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

// Dropdown button for mobile/tablet
const StaffActionsDropdown: React.FC<{ onBulkUploadOpen: () => void }> = ({
  onBulkUploadOpen,
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center gap-1"
      >
        + More <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50 border border-gray-200 dark:border-gray-700">
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/admin/staff-attendance');
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <User size={16} /> Mark Attendance
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                onBulkUploadOpen();
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <Upload size={16} /> Bulk Upload
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/admin/staff-form');
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <Plus size={16} /> Add New Staff
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const StaffListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [deletingStaff, setDeletingStaff] = useState<Staff | null>(null);

  const { staff, deleteStaff, bulkUpload, loading } = useStaff();

  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.contactNumber.includes(searchQuery) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.position.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = !roleFilter || member.position.toLowerCase().includes(roleFilter.toLowerCase());
    const matchesStatus = !statusFilter || member.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleDeleteClick = (staff: Staff) => {
    setDeletingStaff(staff);
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-0">
        {/* Left: Title + Description (always stacked on mobile, inline on desktop+) */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-4">
          <div className="lg:min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm lg:text-base">Manage your staff and their information</p>
          </div>
        </div>

        {/* Right: Actions (dropdown on mobile/tablet, full buttons on desktop) */}
        <div className="flex items-center justify-end flex-shrink-0">
          {/* Desktop buttons */}
          <div className="hidden lg:flex space-x-3">
            <Button variant="outline" onClick={() => navigate("/admin/staff-attendance")}>
              Mark Attendance
            </Button>
            <Button variant="outline" onClick={() => setIsBulkUploadModalOpen(true)}>
              <Upload size={16} className="mr-2" />
              Bulk Upload
            </Button>
            <Button onClick={() => navigate('/admin/staff-form')}>
              <Plus size={16} className="mr-2" />
              Add New Staff
            </Button>
          </div>

          {/* Mobile/tablet dropdown */}
          <div className="flex lg:hidden ml-auto">
            <StaffActionsDropdown onBulkUploadOpen={() => setIsBulkUploadModalOpen(true)} />
          </div>
        </div>
      </div>


      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{staff.length}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <User className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {staff.filter((s) => s.status === 'active').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <User className="text-green-600 dark:text-green-400" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Inactive</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {staff.filter((s) => s.status === 'inactive').length}
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <User className="text-red-600 dark:text-red-400" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                type="text"
                placeholder="Search by name, position, phone, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="sm:w-48">
              <Select
                value={roleFilter}
                onChange={(value) => setRoleFilter(value)}
                options={[
                  { value: '', label: 'All Roles' },
                  { value: 'trainer', label: 'Trainer' },
                  { value: 'manager', label: 'Manager' },
                  { value: 'receptionist', label: 'Receptionist' },
                  { value: 'cleaner', label: 'Cleaner' }
                ]}
                placeholder="All Roles"
              />
            </div>
            <div className="sm:w-48">
              <Select
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                options={[
                  { value: '', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' }
                ]}
                placeholder="All Status"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table (Desktop: md+) */}
      <Card className="hidden md:block">
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            All Staff ({filteredStaff.length})
          </h2>
        </CardHeader>
        <CardContent>
          {filteredStaff.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No staff members found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Staff Member
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Joining Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredStaff.map((member) => (
                    <tr key={member._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                            <span className="text-orange-600 dark:text-orange-400 font-semibold">
                              {member.fullName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {member.fullName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{member.position}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white flex items-center gap-1">
                          <Phone size={14} />
                          {member.contactNumber}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          {member.email}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(member.joiningDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge className={statusColors[member.status as keyof typeof statusColors]}>
                          {member.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/staff-form/${member._id}`)}
                          >
                            <Edit size={14} className="mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(member)}
                            className="text-red-600 hover:text-red-700"
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
          )}
        </CardContent>
      </Card>

      {/* Staff Cards (Mobile & Tablet: below md) */}
      <Card className="md:hidden">
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            All Staff ({filteredStaff.length})
          </h2>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {filteredStaff.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No staff members found</p>
            </div>
          ) : (
            filteredStaff.map((member) => (
              <Card key={member._id} className="h-full">
                <CardContent className="p-4 flex flex-col h-full">
                  {/* Header: Avatar + Name + Position + Status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-shrink-0 h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 dark:text-orange-400 font-semibold text-lg">
                          {member.fullName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {member.fullName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {member.position}
                        </div>
                      </div>
                    </div>
                    <Badge className={statusColors[member.status as keyof typeof statusColors]}>
                      {member.status}
                    </Badge>
                  </div>

                  {/* Contact Info */}
                  <div className="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-300 mb-3">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-gray-400 flex-shrink-0" />
                      <span>{member.contactNumber}</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {member.email}
                    </div>
                  </div>

                  {/* Joining Date */}
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <Calendar size={14} className="flex-shrink-0" />
                    <span>{new Date(member.joiningDate).toLocaleDateString()}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-auto pt-3 border-t border-gray-100 dark:border-gray-800">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/staff-form/${member._id}`)}
                      className="h-9 px-3 flex-1"
                    >
                      <Edit size={14} className="mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(member)}
                      className="h-9 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
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

      {/* Delete Confirmation Modal */}
      {deletingStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete <strong>{deletingStaff.fullName}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeletingStaff(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
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
