import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  X,
} from 'lucide-react';
import { useStaff, Staff } from '../../hooks/useStaff';
import { StaffFormModal } from '../admin/StaffFormModal';
import { StaffFormData } from '../admin/StaffValidation';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

const JOB_DESIGNATION_OPTIONS = [
  'Business Partner',
  'Center Manager',
  'Client Relationship Executive',
  'Client Relationship Manager',
  'Club Manager',
  'Diet Coach',
  'Director',
  'Fitness Coach',
  'Fitness Manager',
  'Fitness Trainer',
  'Front Desk',
  'General Trainer',
  'House Keeping',
  'Nutritionist',
  'Owner',
  'Personal Trainer',
  'Physiotherapist',
  'Sales Executive',
  'Sales Manager',
  'Sales Representative',
  'Sports Coach',
  'Trainer',
];

const ADMIN_RIGHTS_OPTIONS = [
  'Master Admin',
  'Admin',
  'Finance',
  'Training',
  'Sales',
  'Client Management',
  'Customer Service',
  'Housekeeping',
];

export const getEffectiveAdminRights = (member: any): string => {
  if (member?.adminRights && typeof member.adminRights === 'string' && member.adminRights.trim()) {
    return member.adminRights;
  }
  const pos = (member?.position || member?.jobDesignation || '').toLowerCase();
  if (pos.includes('manager') || pos.includes('owner') || pos.includes('partner') || pos.includes('director')) return 'Admin';
  if (pos.includes('sales')) return 'Sales';
  if (pos.includes('clean') || pos.includes('house')) return 'Housekeeping';
  if (pos.includes('desk') || pos.includes('receptionist') || pos.includes('relationship')) return 'Customer Service';
  if (pos.includes('finance') || pos.includes('account')) return 'Finance';
  return 'Training';
};

export const StaffManagerPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const {
    staff,
    createStaff,
    updateStaff,
    deleteStaff,
    fetchAllStaff,
  } = useStaff();
  const { addToast } = useToast();

  // Filter States
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [communicateFilter, setCommunicateFilter] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');
  const [adminRightsFilter, setAdminRightsFilter] = useState('');

  // Table selection & pagination
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | any | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [infoModalContent, setInfoModalContent] = useState<{ title: string; text: string } | null>(null);

  // Access Control Guard
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    const isAdmin = user.role === 'admin' || user.role === 'superadmin';
    const isManager = user.role === 'staff' && user.position === 'manager';
    if (!isAdmin && !isManager) {
      navigate('/not-authorized');
    } else {
      fetchAllStaff();
    }
  }, [user, authLoading, navigate, fetchAllStaff]);

  // Automatically open Add Staff modal if navigated with action=add or add=true
  useEffect(() => {
    if (searchParams.get('action') === 'add' || searchParams.get('add') === 'true') {
      setSelectedStaff(undefined);
      setIsFormModalOpen(true);
    }
  }, [searchParams, location.key]);

  // Filter staff list from database
  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      const q = activeSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        member.fullName?.toLowerCase().includes(q) ||
        member.email?.toLowerCase().includes(q) ||
        member.contactNumber?.includes(q) ||
        (member as any).attendanceId?.toLowerCase().includes(q);

      const matchesDesignation =
        !designationFilter ||
        ((member as any).jobDesignation && (member as any).jobDesignation.toLowerCase() === designationFilter.toLowerCase()) ||
        (member.position && member.position.toLowerCase() === designationFilter.toLowerCase());

      const memberRights = getEffectiveAdminRights(member);
      const matchesAdminRights =
        !adminRightsFilter ||
        (memberRights.toLowerCase() === adminRightsFilter.toLowerCase());

      return matchesSearch && matchesDesignation && matchesAdminRights;
    });
  }, [staff, activeSearch, designationFilter, adminRightsFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / itemsPerPage));
  const paginatedStaff = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStaff.slice(start, start + itemsPerPage);
  }, [filteredStaff, currentPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchInput);
    setCurrentPage(1);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedStaffIds(paginatedStaff.map((s) => s._id));
    } else {
      setSelectedStaffIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedStaffIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreate = () => {
    setSelectedStaff(undefined);
    setIsFormModalOpen(true);
  };

  const handleEdit = (staffMember: any) => {
    setSelectedStaff(staffMember);
    setIsFormModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsFormModalOpen(false);
    setSelectedStaff(undefined);
    if (searchParams.get('action') === 'add' || searchParams.get('add') === 'true') {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('action');
        next.delete('add');
        return next;
      }, { replace: true });
    }
  };

  const handleToggleStatus = async (staffMember: any) => {
    const nextStatus = staffMember.status === 'active' ? 'inactive' : 'active';
    try {
      await updateStaff(staffMember._id, { status: nextStatus });
    } catch (err: any) {
      addToast(err?.message || 'Failed to update status', 'error');
    }
  };

  const handleDelete = async (staffMember: any) => {
    if (window.confirm(`Are you sure you want to delete ${staffMember.fullName}?`)) {
      try {
        await deleteStaff(staffMember._id);
      } catch (err: any) {
        addToast(err?.message || 'Failed to delete staff', 'error');
      }
    }
  };

  const handleFormSubmit = async (formData: StaffFormData) => {
    setIsSubmitting(true);
    try {
      if (selectedStaff) {
        const res = await updateStaff(selectedStaff._id, formData as any);
        if (res) {
          handleCloseModal();
        }
      } else {
        const res = await createStaff(formData as any);
        if (res) {
          handleCloseModal();
        }
      }
    } catch (err: any) {
      addToast(err?.message || 'Something went wrong', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 p-4 sm:p-6 space-y-4 font-sans text-xs">
      {/* 1. Breadcrumb Navigation */}
      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-2">
        <Link to="/admin/dashboard" className="hover:text-gray-700 dark:hover:text-gray-200">
          Home
        </Link>
        <span>/</span>
        <span className="text-[#ff5e28] font-semibold">Staff Management</span>
      </div>

      {/* 2. Top Action & Filter Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-sm border border-gray-200/90 dark:border-gray-700 p-3 shadow-2xs">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-wrap items-center justify-between gap-3 text-xs"
        >
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search by Staff Name / Mail"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-56 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder-gray-400"
            />

            {/* Communicate Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-gray-800 dark:text-gray-200">Communicate</span>
              <select
                value={communicateFilter}
                onChange={(e) => setCommunicateFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer min-w-[100px]"
              >
                <option value="">Select</option>
                <option value="SMS">SMS</option>
                <option value="Email">Email</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Push">Push Notification</option>
              </select>
            </div>

            {/* Designation Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-gray-800 dark:text-gray-200">Designation</span>
              <select
                value={designationFilter}
                onChange={(e) => setDesignationFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer min-w-[100px]"
              >
                <option value="">Select</option>
                {JOB_DESIGNATION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Admin Rights Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-gray-800 dark:text-gray-200">Admin Rights</span>
              <select
                value={adminRightsFilter}
                onChange={(e) => setAdminRightsFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer min-w-[100px]"
              >
                <option value="">Select</option>
                {ADMIN_RIGHTS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Go Button */}
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#ff5e28] hover:bg-[#e04f1d] text-white font-semibold text-xs rounded-xs shadow-2xs transition-colors cursor-pointer"
            >
              Go
            </button>
          </div>

          {/* Add Staff Button */}
          <div>
            <button
              type="button"
              onClick={handleCreate}
              className="px-4 py-1.5 bg-[#ff5e28] hover:bg-[#e04f1d] text-white font-semibold text-xs rounded-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
            >
              <Plus size={14} />
              <span>Add Staff</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. Pagination Bar */}
      <div className="flex justify-center items-center gap-3 py-1 text-gray-600 dark:text-gray-400 text-xs font-medium">
        <button
          type="button"
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          className="hover:text-gray-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
          title="First Page"
        >
          <ChevronsLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="hover:text-gray-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
          title="Previous Page"
        >
          <ChevronLeft size={16} />
        </button>

        <span className="px-2">
          Page {currentPage} of {totalPages}
        </span>

        <button
          type="button"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="hover:text-gray-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
          title="Next Page"
        >
          <ChevronRight size={16} />
        </button>
        <button
          type="button"
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          className="hover:text-gray-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
          title="Last Page"
        >
          <ChevronsRight size={16} />
        </button>
      </div>

      {/* 4. Staff Table */}
      <div className="bg-white dark:bg-gray-800 rounded-sm border border-gray-200/90 dark:border-gray-700 overflow-x-auto shadow-2xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold bg-gray-50/50 dark:bg-gray-800/80">
              <th className="py-2.5 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={
                    paginatedStaff.length > 0 &&
                    paginatedStaff.every((s) => selectedStaffIds.includes(s._id))
                  }
                  onChange={handleSelectAll}
                  className="rounded-xs text-orange-600 focus:ring-orange-500 cursor-pointer"
                />
              </th>
              <th className="py-2.5 px-3 w-14 font-bold text-gray-800 dark:text-gray-200">S.No</th>
              <th className="py-2.5 px-3 font-bold text-gray-800 dark:text-gray-200">Staff ID</th>
              <th className="py-2.5 px-3 font-bold text-gray-800 dark:text-gray-200">Staff Name</th>
              <th className="py-2.5 px-3 font-bold text-gray-800 dark:text-gray-200">Mail</th>
              <th className="py-2.5 px-3 font-bold text-gray-800 dark:text-gray-200">Attendance ID</th>
              <th className="py-2.5 px-3 font-bold text-gray-800 dark:text-gray-200">Active</th>
              <th className="py-2.5 px-3 font-bold text-gray-800 dark:text-gray-200">Admin Rights</th>
              <th className="py-2.5 px-3 font-bold text-gray-800 dark:text-gray-200">Target</th>
              <th className="py-2.5 px-3 font-bold text-gray-800 dark:text-gray-200">Rep Change</th>
              <th className="py-2.5 px-3 font-bold text-gray-800 dark:text-gray-200">Commission</th>
              <th className="py-2.5 px-3 font-bold text-gray-800 dark:text-gray-200 text-center">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 bg-white dark:bg-gray-800">
            {paginatedStaff.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-8 text-center text-gray-500 dark:text-gray-400">
                  No staff members found.
                </td>
              </tr>
            ) : (
              paginatedStaff.map((member, idx) => {
                const sNo = (currentPage - 1) * itemsPerPage + idx + 1;
                const staffId =
                  member.staffId ||
                  member.attendanceId?.replace(/^S/i, '') ||
                  member._id.slice(-5);
                const attId =
                  member.attendanceId ||
                  `S${staffId}`;
                const isActive = member.status === 'active';
                const isMasterAdmin =
                  member.adminRights?.toLowerCase().includes('master') ||
                  member.position?.toLowerCase().includes('master');

                return (
                  <tr
                    key={member._id}
                    className="hover:bg-gray-50/70 dark:hover:bg-gray-700/40 transition-colors"
                  >
                    {/* Checkbox */}
                    <td className="py-2 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedStaffIds.includes(member._id)}
                        onChange={() => handleSelectOne(member._id)}
                        className="rounded-xs text-orange-600 focus:ring-orange-500 cursor-pointer"
                      />
                    </td>

                    {/* S.No */}
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-300 font-normal">
                      {sNo}
                    </td>

                    {/* Staff ID */}
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-300 font-normal">
                      {staffId}
                    </td>

                    {/* Staff Name (Clickable) */}
                    <td className="py-2 px-3">
                      <button
                        type="button"
                        onClick={() => handleEdit(member)}
                        className="text-[#ff5e28] hover:underline font-normal text-xs text-left cursor-pointer transition-colors"
                      >
                        {member.fullName}
                      </button>
                    </td>

                    {/* Mail */}
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-300 font-normal">
                      {member.email}
                    </td>

                    {/* Attendance ID */}
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-300 font-normal">
                      {attId}
                    </td>

                    {/* Active Toggle Switch */}
                    <td className="py-2 px-3">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(member)}
                        className={`w-[52px] h-[22px] rounded-xs border p-[1px] flex items-center transition-colors cursor-pointer bg-white dark:bg-gray-800 ${
                          isActive ? 'border-[#00c853]' : 'border-[#fbc02d]'
                        }`}
                        title={isActive ? 'Active (Click to deactivate)' : 'Inactive (Click to activate)'}
                      >
                        <div
                          className={`h-full text-white text-[10px] font-bold flex items-center justify-center rounded-xs transition-transform duration-150 ${
                            isActive
                              ? 'w-[25px] bg-[#00c853] translate-x-0'
                              : 'w-[27px] bg-[#fbc02d] translate-x-[22px]'
                          }`}
                        >
                          {isActive ? 'ON' : 'OFF'}
                        </div>
                      </button>
                    </td>

                    {/* Admin Rights */}
                    <td className="py-2 px-3">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/staff/rights/${member._id}`)}
                        className="text-[#ff5e28] hover:underline font-normal text-xs text-left cursor-pointer transition-colors"
                      >
                        {getEffectiveAdminRights(member)}
                      </button>
                    </td>

                    {/* Target */}
                    <td className="py-2 px-3">
                      <button
                        type="button"
                        onClick={() => navigate('/admin/staff-target')}
                        className="text-[#ff5e28] hover:underline cursor-pointer font-normal"
                      >
                        View
                      </button>
                    </td>

                    {/* Rep Change */}
                    <td className="py-2 px-3">
                      <button
                        type="button"
                        onClick={() =>
                          setInfoModalContent({
                            title: `Representative Assignment - ${member.fullName}`,
                            text: `Assigned Clients: 24 active members. Click Change to reassign clients to another trainer or manager.`,
                          })
                        }
                        className="text-[#ff5e28] hover:underline cursor-pointer font-normal"
                      >
                        Change
                      </button>
                    </td>

                    {/* Commission */}
                    <td className="py-2 px-3">
                      <button
                        type="button"
                        onClick={() =>
                          setInfoModalContent({
                            title: `Commission Structure - ${member.fullName}`,
                            text: `Base Salary: ₹${member.salary || '25,000'}/month. Commission rate: 10% on PT packages, 5% on memberships.`,
                          })
                        }
                        className="text-[#ff5e28] hover:underline cursor-pointer font-normal"
                      >
                        View
                      </button>
                    </td>

                    {/* Delete */}
                    <td className="py-2 px-3 text-center">
                      {isMasterAdmin ? (
                        <span className="text-gray-400 font-bold">-</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDelete(member)}
                          className="text-red-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                          title="Delete staff member"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Staff Form Modal (Add / Edit) */}
      <StaffFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        initialData={selectedStaff}
        isSubmitting={isSubmitting}
        existingStaff={staff}
      />

      {/* Info Modal for Target / Rep Change / Commission */}
      {infoModalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-gray-800 rounded-md shadow-2xl max-w-md w-full p-5 space-y-4 border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                {infoModalContent.title}
              </h3>
              <button
                type="button"
                onClick={() => setInfoModalContent(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {infoModalContent.text}
            </p>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInfoModalContent(null)}
                className="px-4 py-1.5 bg-[#ff5e28] text-white rounded-xs text-xs font-semibold hover:bg-[#e04f1d] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagerPage;
