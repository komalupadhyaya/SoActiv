// fe/src/pages/admin/EnquiriesPage.tsx

import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  SlidersHorizontal,
  X,
  Edit,
  Trash2,
  Phone,
  Mail,
  Calendar,
  Eye,
  Activity,
  CheckCircle,
  Clock,
  User,
  Upload,
} from 'lucide-react';
import { useEnquiry, IEnquiry } from '../../hooks/useEnquiry';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { BulkUploadModal } from '../../components/enquiry/BulkUploadModal';
import { UploadResultsReport } from '../../components/enquiry/UploadResultsReport';
import type { BulkUploadResult } from '../../hooks/useEnquiry';
import { useStaff } from '../../hooks/useStaff';
import { useConfirm } from '../../hooks/useConfirm';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { useToast } from '../../contexts/ToastContext';

const getStaffName = (staff: any): string => {
  if (!staff) return 'Unassigned';
  if (typeof staff === 'string') return staff;
  if (typeof staff === 'object' && staff.fullName) return staff.fullName;
  if (typeof staff === 'object' && staff.name) return staff.name;
  return 'Unassigned';
};

interface EnquiriesPageProps {
  isArchivePage?: boolean;
}

export const EnquiriesPage: React.FC<EnquiriesPageProps> = ({ isArchivePage = false }) => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const isArchiveFromQuery =
    searchParams.get('Archive') === '1' ||
    searchParams.get('archive') === '1' ||
    searchParams.get('archive') === 'true';
  const isArchiveFromPath =
    location.pathname.includes('/archive') ||
    location.pathname.includes('-archive');
  const isArchiveMode = isArchivePage || isArchiveFromQuery || isArchiveFromPath;

  const targetId = searchParams.get('id');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Top Date / Quick filter
  const [quickDateFilter, setQuickDateFilter] = useState<string>(isArchiveMode ? 'today' : 'last_30_days');
  const [appliedQuickDateFilter, setAppliedQuickDateFilter] = useState<string>(isArchiveMode ? 'today' : '');

  useEffect(() => {
    if (isArchiveMode) {
      setQuickDateFilter('today');
      setAppliedQuickDateFilter('today');
      document.title = 'SoActiv - Archived List';
    } else {
      setQuickDateFilter('last_30_days');
      setAppliedQuickDateFilter('');
      document.title = 'SoActiv - Enquiries';
    }
  }, [isArchiveMode]);

  const handleArchiveToggle = () => {
    if (isArchiveMode) {
      navigate('/admin/enquiries');
    } else {
      navigate('/admin/enquiries/archive');
    }
  };

  // Filter popup form states matching Image 1
  const [showFilters, setShowFilters] = useState(false);
  const [filterService, setFilterService] = useState('');
  const [filterLeadSource, setFilterLeadSource] = useState('');
  const [filterEnquiryStage, setFilterEnquiryStage] = useState('');
  const [filterEnquiryType, setFilterEnquiryType] = useState('');
  const [filterCustomerType, setFilterCustomerType] = useState('');
  const [filterLeads, setFilterLeads] = useState(false);
  const [filterMembers, setFilterMembers] = useState(false);
  const [filterStaff, setFilterStaff] = useState('');
  const [filterMale, setFilterMale] = useState(false);
  const [filterFemale, setFilterFemale] = useState(false);
  const [filterFitnessGoal, setFilterFitnessGoal] = useState('');
  const [filterMissedCall, setFilterMissedCall] = useState(false);
  const [filterCold, setFilterCold] = useState(false);
  const [filterHot, setFilterHot] = useState(false);
  const [filterWarm, setFilterWarm] = useState(false);
  const [filterLastCallStatus, setFilterLastCallStatus] = useState('');

  // Search & Status filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [staffFilter, setStaffFilter] = useState('');

  // Bulk / Action Bar
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedCommunicate, setSelectedCommunicate] = useState('');
  const [selectedEnquiryIds, setSelectedEnquiryIds] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const itemsPerPage = 20;

  // Modals
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);

  // Invoice / Convert Modal
  const [convertModalEnquiry, setConvertModalEnquiry] = useState<any | null>(null);
  const [convertComments, setConvertComments] = useState('');

  // Quick Call Log Modal
  const [callLogModalEnquiry, setCallLogModalEnquiry] = useState<IEnquiry | null>(null);
  const [callLogMessage, setCallLogMessage] = useState('');
  const [callLogTag, setCallLogTag] = useState<'hot' | 'warm' | 'cold' | ''>('warm');
  const [callLogFollowUpDate, setCallLogFollowUpDate] = useState('');

  // Fitness Log Modal
  const [fitnessModalEnquiry, setFitnessModalEnquiry] = useState<IEnquiry | null>(null);
  const [fitnessGoalText, setFitnessGoalText] = useState('');

  // Staff Change Modal
  const [isStaffChangeModalOpen, setIsStaffChangeModalOpen] = useState(false);
  const [newAssignedStaffId, setNewAssignedStaffId] = useState('');

  const {
    enquiries: allEnquiries,
    myEnquiries,
    loading,
    error,
    refreshEnquiries,
    deleteEnquiry,
    updateEnquiry,
    assignStaff,
    isAdmin,
  } = useEnquiry();

  const { staff, fetchAllStaff } = useStaff();

  useEffect(() => {
    fetchAllStaff();
    refreshEnquiries();
  }, [fetchAllStaff, refreshEnquiries]);

  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const { addToast } = useToast();

  const displayedEnquiries = isAdmin ? allEnquiries : myEnquiries;

  // Handle Target ID deep linking
  useEffect(() => {
    if (targetId && displayedEnquiries.length > 0) {
      const targetEnquiry = displayedEnquiries.find((e) => e._id === targetId);
      if (targetEnquiry) {
        setHighlightedId(targetId);
        const timer = setTimeout(() => {
          const element = document.getElementById(`enquiry-row-${targetId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 250);
        const clearTimer = setTimeout(() => setHighlightedId(null), 5000);
        return () => {
          clearTimeout(timer);
          clearTimeout(clearTimer);
        };
      }
    }
  }, [targetId, displayedEnquiries]);

  // Options for Dropdowns
  const staffOptions = useMemo(() => {
    const staffSet = new Set<string>();
    staff.forEach((s) => {
      const name = s.fullName || (s as any).name;
      if (name) staffSet.add(name);
    });
    displayedEnquiries.forEach((e) => {
      const name = getStaffName(e.assignedStaff);
      if (name && name !== 'Unassigned') staffSet.add(name);
    });
    return [{ value: '', label: 'All' }, ...Array.from(staffSet).map((name) => ({ value: name, label: name }))];
  }, [staff, displayedEnquiries]);

  const serviceOptions = useMemo(() => {
    const defaultServices = [
      'CLUB MEMBERSHIP',
      'Gym Membership',
      'Diet',
      'Freezing',
      'Group Workout',
      'happy hours',
      'Personal Session',
      'Transfer Fee',
    ];
    const sSet = new Set<string>(defaultServices);
    displayedEnquiries.forEach((e) => {
      if (e.serviceName) sSet.add(e.serviceName);
    });
    return Array.from(sSet);
  }, [displayedEnquiries]);

  // Format Helper: 17-09-2026 (DD-MM-YYYY)
  const formatDateDMY = (dateStr?: string | Date) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Enquiry Numeric ID generator
  const getEnquiryId = (enquiry: any, index: number) => {
    if (enquiry.enquiryNumber) return enquiry.enquiryNumber;
    if (enquiry.enquiryId) return enquiry.enquiryId;
    if (enquiry._id && typeof enquiry._id === 'string' && enquiry._id.length >= 6) {
      let hash = 0;
      for (let i = 0; i < enquiry._id.length; i++) {
        hash = (hash * 31 + enquiry._id.charCodeAt(i)) % 9000000;
      }
      return String(1000000 + Math.abs(hash));
    }
    return String(5233880 + index + 1);
  };

  // Filter Logic
  const filteredEnquiries = useMemo(() => {
    return displayedEnquiries.filter((enquiry) => {
      // Archive Filter
      if (isArchiveMode) {
        if (enquiry.status !== 'lost') return false;
      } else {
        if (enquiry.status === 'lost') return false;
      }

      // Quick Date Filter
      if (appliedQuickDateFilter) {
        const now = new Date();
        const enqDate = new Date(
          isArchiveMode
            ? (enquiry.updatedAt || enquiry.createdAt || (enquiry as any).enquiryDate || now)
            : (enquiry.createdAt || (enquiry as any).enquiryDate || now)
        );
        const isToday =
          (enqDate.getDate() === now.getDate() &&
           enqDate.getMonth() === now.getMonth() &&
           enqDate.getFullYear() === now.getFullYear()) ||
          (isArchiveMode &&
           enquiry.createdAt &&
           new Date(enquiry.createdAt).getDate() === now.getDate() &&
           new Date(enquiry.createdAt).getMonth() === now.getMonth() &&
           new Date(enquiry.createdAt).getFullYear() === now.getFullYear());

        if (appliedQuickDateFilter === 'today' && !isToday) return false;
        if (appliedQuickDateFilter === 'yesterday') {
          const yest = new Date(now);
          yest.setDate(yest.getDate() - 1);
          const isYest =
            enqDate.getDate() === yest.getDate() &&
            enqDate.getMonth() === yest.getMonth() &&
            enqDate.getFullYear() === yest.getFullYear();
          if (!isYest) return false;
        }
        if (appliedQuickDateFilter === 'last_7_days') {
          const sevenDaysAgo = new Date(now);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          sevenDaysAgo.setHours(0, 0, 0, 0);
          if (enqDate < sevenDaysAgo) return false;
        }
        if (appliedQuickDateFilter === 'last_30_days') {
          const thirtyDaysAgo = new Date(now);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          thirtyDaysAgo.setHours(0, 0, 0, 0);
          if (enqDate < thirtyDaysAgo) return false;
        }
        if (appliedQuickDateFilter === 'this_month') {
          if (enqDate.getMonth() !== now.getMonth() || enqDate.getFullYear() !== now.getFullYear()) return false;
        }
      }

      const matchesSearch =
        !searchQuery ||
        enquiry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        enquiry.phone.includes(searchQuery) ||
        (enquiry.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

      // Enquiry Stage matching
      let matchesStage = true;
      if (filterEnquiryStage) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const trialDateStr = enquiry.trialDateTime || (enquiry as any).trialClassDate || (enquiry as any).trialSessionDate;
        const hasTrial = Boolean(enquiry.trialType && enquiry.trialType !== 'no-trial');
        const isTrialPast = Boolean(hasTrial && trialDateStr && new Date(trialDateStr) < todayStart);

        if (filterEnquiryStage === 'Enquiry') {
          matchesStage = !hasTrial && enquiry.status !== 'converted' && enquiry.status !== 'lost';
        } else if (filterEnquiryStage === 'Trial Scheduled') {
          matchesStage = hasTrial && !isTrialPast && enquiry.status !== 'converted' && enquiry.status !== 'lost';
        } else if (filterEnquiryStage === 'Post Trial') {
          matchesStage = hasTrial && isTrialPast && enquiry.status !== 'converted' && enquiry.status !== 'lost';
        } else if (filterEnquiryStage === 'Sale') {
          matchesStage = enquiry.status === 'converted';
        } else {
          matchesStage = enquiry.status === filterEnquiryStage;
        }
      }

      const matchesStatus = (!statusFilter || enquiry.status === statusFilter) && matchesStage;

      const staffName = getStaffName(enquiry.assignedStaff);
      const matchesStaff =
        (!staffFilter || staffName === staffFilter) && (!filterStaff || staffName === filterStaff);

      const matchesService =
        !filterService || enquiry.serviceName?.toLowerCase() === filterService.toLowerCase();

      const matchesSource =
        !filterLeadSource ||
        (enquiry as any).leadSource?.toLowerCase() === filterLeadSource.toLowerCase() ||
        enquiry.source?.toLowerCase() === filterLeadSource.toLowerCase();

      const matchesType =
        !filterEnquiryType || (enquiry as any).enquiryType?.toLowerCase() === filterEnquiryType.toLowerCase();

      const matchesGender =
        (!filterMale && !filterFemale) ||
        (filterMale && (enquiry as any).gender === 'male') ||
        (filterFemale && (enquiry as any).gender === 'female');

      const matchesCallTag =
        (!filterCold && !filterHot && !filterWarm) ||
        (filterCold && (enquiry as any).callTag === 'cold') ||
        (filterHot && (enquiry as any).callTag === 'hot') ||
        (filterWarm && (enquiry as any).callTag === 'warm');

      const matchesMemberLead =
        (!filterLeads && !filterMembers) ||
        (filterLeads && enquiry.status !== 'converted') ||
        (filterMembers && enquiry.status === 'converted');

      return (
        matchesSearch &&
        matchesStatus &&
        matchesStaff &&
        matchesService &&
        matchesSource &&
        matchesType &&
        matchesGender &&
        matchesCallTag &&
        matchesMemberLead
      );
    });
  }, [
    displayedEnquiries,
    isArchiveMode,
    appliedQuickDateFilter,
    searchQuery,
    statusFilter,
    staffFilter,
    filterService,
    filterLeadSource,
    filterEnquiryStage,
    filterEnquiryType,
    filterStaff,
    filterMale,
    filterFemale,
    filterCold,
    filterHot,
    filterWarm,
    filterLeads,
    filterMembers,
  ]);

  // Reset Filters Handler
  const handleResetFilters = () => {
    setFilterService('');
    setFilterLeadSource('');
    setFilterEnquiryStage('');
    setFilterEnquiryType('');
    setFilterCustomerType('');
    setFilterLeads(false);
    setFilterMembers(false);
    setFilterStaff('');
    setFilterMale(false);
    setFilterFemale(false);
    setFilterFitnessGoal('');
    setFilterMissedCall(false);
    setFilterCold(false);
    setFilterHot(false);
    setFilterWarm(false);
    setFilterLastCallStatus('');
    setSearchQuery('');
    setStatusFilter('');
    setStaffFilter('');
    setQuickDateFilter('');
    setAppliedQuickDateFilter('');
    setShowOnlyArchive(false);
  };

  // 3 KPI Cards Stats Calculation matching Image 1
  const enquiryStats = useMemo(() => {
    const total = displayedEnquiries.length;
    const openEnquiriesList = displayedEnquiries.filter(
      (e) => e.status !== 'converted' && e.status !== 'lost'
    );
    const open = openEnquiriesList.length;
    const converted = displayedEnquiries.filter((e) => e.status === 'converted').length;
    const lost = displayedEnquiries.filter((e) => e.status === 'lost').length;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const isTrialDatePast = (e: any) => {
      const trialDateStr = e.trialDateTime || e.trialClassDate || e.trialSessionDate;
      if (!trialDateStr) return false;
      return new Date(trialDateStr) < todayStart;
    };

    // Open Enquiries Breakdown
    const openEnquiry = openEnquiriesList.filter((e) => !e.trialType || e.trialType === 'no-trial').length;
    const openTrialScheduled = openEnquiriesList.filter(
      (e) => e.trialType && e.trialType !== 'no-trial' && !isTrialDatePast(e)
    ).length;
    const openPostTrial = openEnquiriesList.filter(
      (e) => e.trialType && e.trialType !== 'no-trial' && isTrialDatePast(e)
    ).length;
    const openSalesStage = openEnquiriesList.filter(
      (e) => (e as any).enquiryStage === 'Sale' || (e as any).stage === 'sales'
    ).length;

    // Trial Status
    const trialScheduled = displayedEnquiries.filter(
      (e) => e.trialType && e.trialType !== 'no-trial' && !isTrialDatePast(e)
    ).length;
    const trialCompleted = displayedEnquiries.filter(
      (e) => e.trialType && e.trialType !== 'no-trial' && isTrialDatePast(e)
    ).length;
    const trialConverted = displayedEnquiries.filter(
      (e) => e.trialType && e.trialType !== 'no-trial' && e.status === 'converted'
    ).length;

    return {
      total,
      open,
      converted,
      lost,
      openEnquiry,
      openTrialScheduled,
      openPostTrial,
      openSalesStage: openSalesStage > 0 ? openSalesStage : Math.max(0, open - openEnquiry - openTrialScheduled - openPostTrial),
      trialScheduled,
      trialCompleted,
      trialConverted,
    };
  }, [displayedEnquiries]);

  // Pagination slicing
  const totalPages = Math.max(1, Math.ceil(filteredEnquiries.length / itemsPerPage));
  const paginatedEnquiries = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEnquiries.slice(start, start + itemsPerPage);
  }, [filteredEnquiries, currentPage, itemsPerPage]);

  const handlePageJump = () => {
    const p = parseInt(pageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      setCurrentPage(p);
    } else {
      setPageInput(String(currentPage));
    }
  };

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  // Convert to Member
  const handleOpenConvertModal = (enquiry: any) => {
    setConvertModalEnquiry(enquiry);
    setConvertComments('');
  };

  const handleConfirmConvert = () => {
    if (!convertModalEnquiry) return;
    const enquiry = convertModalEnquiry;
    const comments = convertComments;
    setConvertModalEnquiry(null);

    const queryParams = new URLSearchParams({
      enquiryId: enquiry._id,
      name: enquiry.name || '',
      phone: enquiry.phone || '',
      email: enquiry.email || '',
      gender: enquiry.gender || '',
      service: enquiry.serviceName || '',
      budget: enquiry.budget || '',
      comments: comments || enquiry.comments || '',
      convert: 'true',
    });

    navigate(`/admin/client-form?${queryParams.toString()}`, {
      state: {
        enquiry: {
          fullName: enquiry.name || '',
          contactNumber: enquiry.phone || '',
          email: enquiry.email || '',
          gender: enquiry.gender || '',
          salesRep: enquiry.assignedStaff || '',
          trainer: enquiry.trialStaff || enquiry.assignedStaff || '',
          address: enquiry.address || '',
          emergencyContactName: enquiry.emergencyContactName || '',
          emergencyContactNumber: enquiry.emergencyContactNumber || '',
          packagePrice: enquiry.budget || '',
          timing: enquiry.timing || '',
          comments: comments || enquiry.comments || '',
          notes: comments || enquiry.comments || '',
          serviceName: enquiry.serviceName || '',
          enquiryId: enquiry._id,
        },
        convertFromEnquiry: true,
      },
    });
  };

  // Save Call Log
  const handleSaveCallLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callLogModalEnquiry) return;
    try {
      await updateEnquiry(callLogModalEnquiry._id, {
        followUpMessage: callLogMessage,
        callTag: callLogTag,
        followUpDate: callLogFollowUpDate || undefined,
      });
      addToast('Call log updated successfully!', 'success');
      setCallLogModalEnquiry(null);
    } catch {
      addToast('Failed to update call log', 'error');
    }
  };

  // Save Fitness Goal
  const handleSaveFitnessGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fitnessModalEnquiry) return;
    try {
      await updateEnquiry(fitnessModalEnquiry._id, {
        interests: fitnessGoalText,
      });
      addToast('Fitness log updated successfully!', 'success');
      setFitnessModalEnquiry(null);
    } catch {
      addToast('Failed to update fitness log', 'error');
    }
  };

  // Action Handler (Move to Archive, Staff Change, Print)
  const handleApplyAction = async (action: string) => {
    if (!action) return;
    if (selectedEnquiryIds.length === 0) {
      addToast('Please select at least one enquiry from the table checkboxes.', 'warning');
      return;
    }

    if (action === 'Restore to Active') {
      if (await confirm(`Are you sure you want to restore ${selectedEnquiryIds.length} enquiries to active?`)) {
        for (const id of selectedEnquiryIds) {
          await updateEnquiry(id, { status: 'contacted' });
        }
        addToast(`Restored ${selectedEnquiryIds.length} enquiries to Active.`, 'success');
        setSelectedEnquiryIds([]);
      }
    } else if (action === 'Move to Archive') {
      if (await confirm(`Are you sure you want to move ${selectedEnquiryIds.length} enquiries to Archive/Lost?`)) {
        for (const id of selectedEnquiryIds) {
          await updateEnquiry(id, { status: 'lost' });
        }
        addToast(`Moved ${selectedEnquiryIds.length} enquiries to Archive.`, 'success');
        setSelectedEnquiryIds([]);
      }
    } else if (action === 'Staff Change') {
      setIsStaffChangeModalOpen(true);
    } else if (action === 'Print') {
      window.print();
    }
    setSelectedAction('');
  };

  const handleConfirmStaffChange = async () => {
    if (!newAssignedStaffId) {
      addToast('Please select a staff member.', 'warning');
      return;
    }
    for (const id of selectedEnquiryIds) {
      await assignStaff(id, newAssignedStaffId);
    }
    addToast(`Reassigned ${selectedEnquiryIds.length} enquiries successfully!`, 'success');
    setIsStaffChangeModalOpen(false);
    setSelectedEnquiryIds([]);
    setNewAssignedStaffId('');
  };

  const renderCallTag = (tag?: string, status?: string) => {
    const currentTag = tag || (status === 'contacted' ? 'Warm' : status === 'interested' ? 'Hot' : 'Cold');
    if (currentTag.toLowerCase() === 'warm') {
      return (
        <span className="inline-block px-2 py-0.5 text-[11px] font-semibold rounded-full border border-amber-500 text-amber-600 bg-white dark:bg-gray-800">
          Warm
        </span>
      );
    }
    if (currentTag.toLowerCase() === 'hot') {
      return (
        <span className="inline-block px-2 py-0.5 text-[11px] font-semibold rounded-full border border-red-500 text-red-600 bg-white dark:bg-gray-800">
          Hot
        </span>
      );
    }
    return (
      <span className="inline-block px-2 py-0.5 text-[11px] font-semibold rounded-full border border-sky-500 text-sky-600 bg-white dark:bg-gray-800">
        Cold
      </span>
    );
  };

  const renderEnquiryStage = (enquiry: any) => {
    const stage = (enquiry as any).enquiryStage || (enquiry.status === 'converted' ? 'Sale' : enquiry.status === 'lost' ? 'Lost' : 'Enquiry');
    return (
      <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
        {stage}
      </span>
    );
  };

  if (loading && displayedEnquiries.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-600 dark:text-gray-400 font-medium">Loading enquiries...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-1 sm:px-2 w-full max-w-full pb-12">
      {/* Top Breadcrumb matching Image 1 & 2 */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <Link to="/admin/dashboard" className="text-[#ff5722] hover:underline font-medium">
          Home
        </Link>
        <span className="text-gray-400">/</span>
        {isArchiveMode ? (
          <>
            <Link to="/admin/enquiries" className="text-[#ff5722] hover:underline font-medium">
              Enquiries
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-[#ff5722] font-semibold">Archived List</span>
          </>
        ) : (
          <span className="text-[#ff5722] font-semibold">Enquiries</span>
        )}
      </div>

      {/* Main Centered Title matching Image 1 & 2 */}
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white text-center my-2">
        {isArchiveMode ? 'Archived List' : 'All Enquiries'}
      </h1>

      {/* Top Filter & Archive Row matching Image 1 & 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left: Quick Dropdown + Go */}
        <div className="flex items-center space-x-2">
          <select
            value={quickDateFilter}
            onChange={(e) => setQuickDateFilter(e.target.value)}
            className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#ff5722] min-w-[150px] cursor-pointer shadow-xs"
          >
            <option value="">Select</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last_7_days">Last 7 days</option>
            <option value="last_30_days">Last 30 days</option>
            <option value="this_month">This Month</option>
            <option value="all">All Enquiries</option>
          </select>
          <button
            onClick={() => setAppliedQuickDateFilter(quickDateFilter)}
            className="bg-[#ff5722] hover:bg-orange-600 text-white font-semibold text-sm px-4 py-1.5 rounded transition-colors shadow-xs cursor-pointer"
          >
            Go
          </button>
        </div>

        {/* Right: Enquiry Archive button & Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleArchiveToggle}
            className="border rounded px-3 py-1.5 text-sm font-medium transition-colors shadow-xs cursor-pointer bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Enquiry Archive
          </button>
          {!isArchiveMode && (
            <>
              <button
                onClick={() => setIsBulkUploadModalOpen(true)}
                className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 rounded px-3 py-1.5 text-sm font-medium shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Upload size={14} /> Bulk Upload
              </button>
              <button
                onClick={() => navigate('/admin/enquiry-form')}
                className="bg-[#ff5722] hover:bg-orange-600 text-white font-semibold text-sm px-3.5 py-1.5 rounded shadow-xs transition-colors cursor-pointer flex items-center gap-1"
              >
                <Plus size={15} /> Add Enquiry
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm w-full flex justify-between items-center">
          <span><strong>Error:</strong> {error}</span>
          <button onClick={() => refreshEnquiries()} className="underline font-bold text-xs">Retry</button>
        </div>
      )}

      {/* Summary KPI Cards matching Image 1 & 2 */}
      {isArchiveMode ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xs p-4 text-center">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3">
              Enquiries - {filteredEnquiries.length}
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Open</div>
                <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">0</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Converted</div>
                <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">0</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Archived/Lost</div>
                <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{filteredEnquiries.length}</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Enquiries - Total */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xs p-4 text-center">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3">
              Enquiries - {enquiryStats.total}
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Open</div>
                <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{enquiryStats.open}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Converted</div>
                <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{enquiryStats.converted}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Archived/Lost</div>
                <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{enquiryStats.lost}</div>
              </div>
            </div>
          </div>

          {/* Card 2: Open Enquiries */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xs p-4 text-center">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3">
              Open Enquiries
            </h3>
            <div className="grid grid-cols-4 gap-1 text-center">
              <div>
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Enquiry</div>
                <div className="text-lg sm:text-xl font-bold text-[#22c55e]">{enquiryStats.openEnquiry}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Trial Scheduled</div>
                <div className="text-lg sm:text-xl font-bold text-[#f97316]">{enquiryStats.openTrialScheduled}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Post Trial</div>
                <div className="text-lg sm:text-xl font-bold text-[#ef4444]">{enquiryStats.openPostTrial}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Sales Stage</div>
                <div className="text-lg sm:text-xl font-bold text-[#ef4444]">{enquiryStats.openSalesStage}</div>
              </div>
            </div>
          </div>

          {/* Card 3: Trial Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xs p-4 text-center">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3">
              Trial Status
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Trial Scheduled</div>
                <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{enquiryStats.trialScheduled}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Trial Completed</div>
                <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{enquiryStats.trialCompleted}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Converted</div>
                <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{enquiryStats.trialConverted}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action / Communicate Bar matching Image 1 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xs p-3 w-full">
        <div className="flex flex-wrap items-center">
          {/* Sliders/Filter Button */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            title="Toggle Detailed Filters"
            className={`w-8 h-8 flex items-center justify-center rounded border transition-colors cursor-pointer ${
              showFilters
                ? 'bg-[#ff5722] text-white border-[#ff5722] shadow-xs'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <SlidersHorizontal size={15} />
          </button>

          {/* Action Dropdown */}
          <div className="flex items-center space-x-3 ml-6 sm:ml-12">
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Action</span>
            <select
              value={selectedAction}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedAction(val);
                if (val) handleApplyAction(val);
              }}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#ff5722] min-w-[100px] cursor-pointer"
            >
              <option value="">Select</option>
              {isArchiveMode ? (
                <option value="Restore to Active">Restore to Active</option>
              ) : (
                <option value="Move to Archive">Move to Archive</option>
              )}
              <option value="Staff Change">Staff Change</option>
              <option value="Print">Print</option>
            </select>
          </div>

          {/* Communicate Dropdown */}
          <div className="flex items-center space-x-3 ml-6 sm:ml-16">
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Communicate</span>
            <select
              value={selectedCommunicate}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedCommunicate(val);
                if (val) {
                  if (selectedEnquiryIds.length === 0) {
                    addToast('Please select enquiries to communicate with.', 'warning');
                  } else {
                    addToast(`Ready to ${val} to ${selectedEnquiryIds.length} enquiries`, 'info');
                  }
                }
              }}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#ff5722] min-w-[100px] cursor-pointer"
            >
              <option value="">Select</option>
              <option value="Send E-mail">Send E-mail</option>
              <option value="Send SMS">Send SMS</option>
              <option value="Send WhatsApp">Send WhatsApp</option>
            </select>
          </div>
        </div>

        {/* Filter Popup Panel matching Image 1 */}
        {showFilters && (
          <div className="mt-3 pt-6 pb-5 px-6 border-2 border-orange-400 dark:border-orange-500 rounded-lg bg-white dark:bg-gray-800 shadow-xs w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Service */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-normal text-gray-800 dark:text-gray-200 w-36">Service</label>
                  <select
                    value={filterService}
                    onChange={(e) => setFilterService(e.target.value)}
                    className="w-48 sm:w-56 h-8 px-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                  >
                    <option value="">All</option>
                    {serviceOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Lead Source */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-normal text-gray-800 dark:text-gray-200 w-36">Lead Source</label>
                  <select
                    value={filterLeadSource}
                    onChange={(e) => setFilterLeadSource(e.target.value)}
                    className="w-48 sm:w-56 h-8 px-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                  >
                    <option value="">All</option>
                    <option value="Walk-in">Walk-in</option>
                    <option value="Flyers/Banners">Flyers/Banners</option>
                    <option value="Google">Google</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Social media">Social media</option>
                    <option value="Website">Website</option>
                    <option value="Phone">Phone</option>
                    <option value="Referral">Referral</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                {/* Enquiry Stage */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-normal text-gray-800 dark:text-gray-200 w-36">Enquiry Stage</label>
                  <select
                    value={filterEnquiryStage}
                    onChange={(e) => setFilterEnquiryStage(e.target.value)}
                    className="w-48 sm:w-56 h-8 px-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                  >
                    <option value="">All</option>
                    <option value="Enquiry">Enquiry</option>
                    <option value="Trial Scheduled">Trial Scheduled</option>
                    <option value="Post Trial">Post Trial</option>
                    <option value="Sale">Sale</option>
                  </select>
                </div>

                {/* Enquiry Type */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-normal text-gray-800 dark:text-gray-200 w-36">Enquiry Type</label>
                  <select
                    value={filterEnquiryType}
                    onChange={(e) => setFilterEnquiryType(e.target.value)}
                    className="w-48 sm:w-56 h-8 px-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                  >
                    <option value="">All</option>
                    <option value="Walk-in">Walk-in</option>
                    <option value="Phone">Phone</option>
                    <option value="e-mail">e-mail</option>
                    <option value="Social media">Social media</option>
                    <option value="Website">Website</option>
                  </select>
                </div>

                {/* Customer Type */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-normal text-gray-800 dark:text-gray-200 w-36">Customer Type</label>
                  <select
                    value={filterCustomerType}
                    onChange={(e) => setFilterCustomerType(e.target.value)}
                    className="w-48 sm:w-56 h-8 px-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                  >
                    <option value="">All</option>
                    <option value="Self">Self</option>
                    <option value="Group">Group</option>
                    <option value="Couple">Couple</option>
                    <option value="Youth">Youth</option>
                    <option value="Kids">Kids</option>
                  </select>
                </div>

                {/* Members/leads */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-normal text-gray-800 dark:text-gray-200 w-36">Members/leads</label>
                  <div className="flex items-center gap-6 w-48 sm:w-56 text-sm text-gray-700 dark:text-gray-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterLeads}
                        onChange={(e) => setFilterLeads(e.target.checked)}
                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                      />
                      Leads
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterMembers}
                        onChange={(e) => setFilterMembers(e.target.checked)}
                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                      />
                      Members
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Staff */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-normal text-gray-800 dark:text-gray-200 w-36">Staff</label>
                  <select
                    value={filterStaff}
                    onChange={(e) => setFilterStaff(e.target.value)}
                    className="w-48 sm:w-56 h-8 px-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                  >
                    <option value="">All</option>
                    {staffOptions.slice(1).map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* Gender */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-normal text-gray-800 dark:text-gray-200 w-36">Gender</label>
                  <div className="flex items-center gap-6 w-48 sm:w-56 text-sm text-gray-700 dark:text-gray-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterMale}
                        onChange={(e) => setFilterMale(e.target.checked)}
                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                      />
                      Male
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterFemale}
                        onChange={(e) => setFilterFemale(e.target.checked)}
                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                      />
                      Female
                    </label>
                  </div>
                </div>

                {/* Call Tag */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-normal text-gray-800 dark:text-gray-200 w-36">Call Tag</label>
                  <div className="flex items-center gap-5 w-48 sm:w-56 text-sm text-gray-700 dark:text-gray-200">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterCold}
                        onChange={(e) => setFilterCold(e.target.checked)}
                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                      />
                      Cold
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterHot}
                        onChange={(e) => setFilterHot(e.target.checked)}
                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                      />
                      Hot
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterWarm}
                        onChange={(e) => setFilterWarm(e.target.checked)}
                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                      />
                      Warm
                    </label>
                  </div>
                </div>

                {/* Last Call Status */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-normal text-gray-800 dark:text-gray-200 w-36">Last Call Status</label>
                  <select
                    value={filterLastCallStatus}
                    onChange={(e) => setFilterLastCallStatus(e.target.value)}
                    className="w-48 sm:w-56 h-8 px-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                  >
                    <option value="">All</option>
                    <option value="Enquiry">Enquiry</option>
                    <option value="Enquiry follow-up">Enquiry follow-up</option>
                    <option value="No answer">No answer</option>
                    <option value="Sale">Sale</option>
                    <option value="Switched Off/ Out of Reach">Switched Off/ Out of Reach</option>
                    <option value="Not Interested">Not Interested</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Reset & Submit Buttons */}
            <div className="flex justify-center items-center gap-3 mt-6">
              <button
                type="button"
                onClick={handleResetFilters}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium px-6 py-1.5 rounded shadow-xs transition-colors text-sm cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="bg-[#ff5722] hover:bg-orange-600 text-white font-medium px-8 py-1.5 rounded shadow-xs transition-colors text-sm cursor-pointer"
              >
                Submit
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pagination Bar Above Table matching Image 1 & 2 */}
      {filteredEnquiries.length > 0 && (
        <div className="flex items-center justify-between py-2 text-xs text-gray-700 dark:text-gray-300">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 disabled:opacity-40 cursor-pointer font-bold"
              title="First Page"
            >
              |&lt;
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 disabled:opacity-40 cursor-pointer font-bold"
              title="Previous Page"
            >
              &lt;
            </button>
          </div>

          <div className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
            Page {currentPage} of {totalPages}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 disabled:opacity-40 cursor-pointer font-bold"
              title="Next Page"
            >
              &gt;
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 disabled:opacity-40 cursor-pointer font-bold"
              title="Last Page"
            >
              &gt;|
            </button>
            <input
              type="text"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              className="w-10 h-7 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#ff5722]"
            />
            <button
              onClick={handlePageJump}
              className="bg-[#ff5722] hover:bg-orange-600 text-white font-semibold text-xs px-2.5 py-1 rounded transition-colors cursor-pointer"
            >
              Go
            </button>
          </div>
        </div>
      )}

      {/* Main Table matching Image 2 & Image 3 */}
      <div className="w-full">
        {filteredEnquiries.length === 0 ? (
          <div className="py-8 px-1 text-sm text-gray-800 dark:text-gray-200 font-normal">
            No Results Found.
          </div>
        ) : (
          <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-xs border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full table-auto border-collapse text-[10.5px] leading-tight">
              <thead className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                <tr>
                  <th className="p-1 text-center border-r border-gray-200 dark:border-gray-700 w-6">
                    <input
                      type="checkbox"
                      checked={selectedEnquiryIds.length === filteredEnquiries.length && filteredEnquiries.length > 0}
                      onChange={() => {
                        if (selectedEnquiryIds.length === filteredEnquiries.length && filteredEnquiries.length > 0) {
                          setSelectedEnquiryIds([]);
                        } else {
                          setSelectedEnquiryIds(filteredEnquiries.map((e) => e._id));
                        }
                      }}
                      className="rounded border-gray-300 text-orange-500 focus:ring-orange-400 cursor-pointer h-3.5 w-3.5"
                    />
                  </th>
                  <th className="p-1 text-center font-bold border-r border-gray-200 dark:border-gray-700 w-7 whitespace-nowrap">
                    S.No
                  </th>
                  <th className="px-1.5 py-1 text-left font-bold border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                    Enquiry<br />ID
                  </th>
                  <th className="px-1.5 py-1 text-left font-bold border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                    Date
                  </th>
                  <th className="px-1.5 py-1 text-left font-bold border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                    Name
                  </th>
                  <th className="px-1.5 py-1 text-left font-bold border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                    Service
                  </th>
                  <th className="px-1.5 py-1 text-left font-bold border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                    Lead<br />Source
                  </th>
                  <th className="px-1.5 py-1 text-left font-bold border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                    Enquiry<br />Stage
                  </th>
                  <th className="px-1.5 py-1 text-left font-bold border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                    Last Call<br />Status
                  </th>
                  <th className="px-1.5 py-1 text-center font-bold border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                    Call<br />Tag
                  </th>
                  <th className="px-1 py-1 text-center font-bold border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                    Call<br />log
                  </th>
                  <th className="px-1 py-1 text-center font-bold border-r border-gray-200 dark:border-gray-700 whitespace-nowrap leading-none">
                    Convert to<br />member
                  </th>
                  <th className="px-1 py-1 text-center font-bold border-r border-gray-200 dark:border-gray-700 whitespace-nowrap leading-none">
                    Trial<br />Appointment
                  </th>
                  <th className="px-1 py-1 text-center font-bold border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                    Trials
                  </th>
                  <th className="px-1 py-1 text-center font-bold border-r border-gray-200 dark:border-gray-700 whitespace-nowrap leading-none">
                    Other<br />Appointment
                  </th>
                  <th className="px-1.5 py-1 text-left font-bold border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                    Staff
                  </th>
                  <th className="px-1.5 py-1 text-center font-bold border-r border-gray-200 dark:border-gray-700 whitespace-nowrap leading-none">
                    Fitness<br />Log
                  </th>
                  <th className="px-1.5 py-1 text-center font-bold whitespace-nowrap">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedEnquiries.map((enquiry, index) => {
                  const globalIndex = (currentPage - 1) * itemsPerPage + index;
                  return (
                    <tr
                      key={enquiry._id}
                      id={`enquiry-row-${enquiry._id}`}
                      className={`hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-colors ${
                        highlightedId === enquiry._id ? 'bg-orange-50/80 dark:bg-orange-950/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-1 text-center border-r border-gray-200 dark:border-gray-700">
                        <input
                          type="checkbox"
                          checked={selectedEnquiryIds.includes(enquiry._id)}
                          onChange={() => {
                            setSelectedEnquiryIds((prev) =>
                              prev.includes(enquiry._id)
                                ? prev.filter((id) => id !== enquiry._id)
                                : [...prev, enquiry._id]
                            );
                          }}
                          className="rounded border-gray-300 text-orange-500 focus:ring-orange-400 cursor-pointer h-3.5 w-3.5"
                        />
                      </td>

                      {/* S.No */}
                      <td className="p-1 text-center text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">
                        {globalIndex + 1}
                      </td>

                      {/* Enquiry ID */}
                      <td className="px-1.5 py-1 text-left font-semibold text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        {getEnquiryId(enquiry, globalIndex)}
                      </td>

                      {/* Date */}
                      <td className="px-1.5 py-1 text-left text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        {formatDateDMY(enquiry.createdAt)}
                      </td>

                      {/* Name in Orange text matching Image 2 & 3 */}
                      <td className="px-1.5 py-1 text-left font-bold text-[#ff5722] hover:underline cursor-pointer border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/enquiries/edit/${enquiry._id}`)}
                          className="text-[#ff5722] hover:underline uppercase font-bold"
                        >
                          {enquiry.name}
                        </button>
                      </td>

                      {/* Service */}
                      <td className="px-1.5 py-1 text-left uppercase text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        {enquiry.serviceName || 'CLUB MEMBERSHIP'}
                      </td>

                      {/* Lead Source */}
                      <td className="px-1.5 py-1 text-left text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        {(enquiry as any).leadSource || enquiry.source || 'Walk-in'}
                      </td>

                      {/* Enquiry Stage */}
                      <td className="px-1.5 py-1 text-left border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        {renderEnquiryStage(enquiry)}
                      </td>

                      {/* Last Call Status */}
                      <td className="px-1.5 py-1 text-left text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        {(enquiry as any).lastCallStatus || (enquiry.status === 'converted' ? 'Sale' : 'Enquiry')}
                      </td>

                      {/* Call Tag */}
                      <td className="px-1.5 py-1 text-center border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        {renderCallTag((enquiry as any).callTag, enquiry.status)}
                      </td>

                      {/* Call log matching Image 2 & 3 */}
                      <td className="px-1 py-1 text-center border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {/* Orange + button navigating to Enquiry Calls page matching Image 2 */}
                          <button
                            type="button"
                            onClick={() => {
                              navigate(`/admin/enquiry-calls?id=${enquiry._id}&memid=${enquiry._id}&eqid=${enquiry._id}`);
                            }}
                            className="text-[#ff5722] hover:text-orange-700 font-extrabold text-sm leading-none cursor-pointer"
                            title="Open Enquiry Calls History & Log"
                          >
                            +
                          </button>
                          {/* Blue Circle LC button */}
                          <button
                            type="button"
                            onClick={() =>
                              addToast(`Last Call Log: ${enquiry.followUpMessage || enquiry.comments || 'No notes available'}`, 'info')
                            }
                            className="w-3.5 h-3.5 rounded-full border border-sky-400 text-sky-600 dark:text-sky-300 flex items-center justify-center text-[7px] font-bold hover:bg-sky-50 dark:hover:bg-sky-950/50 cursor-pointer"
                            title="View Last Call Log"
                          >
                            LC
                          </button>
                        </div>
                      </td>

                      {/* Convert to Member (Invoice Button) matching Image 2 & 3 */}
                      <td className="px-1 py-1 text-center border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenConvertModal(enquiry)}
                          className="border border-[#ff5722] text-[#ff5722] bg-white hover:bg-orange-50 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full px-2 py-0.5 text-[9.5px] font-bold shadow-2xs transition-colors cursor-pointer leading-none"
                        >
                          Invoice
                        </button>
                      </td>

                      {/* Trial Appointment */}
                      <td className="px-1 py-1 text-center border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/follow-ups/new?type=enquiry&id=${enquiry._id}&name=${encodeURIComponent(enquiry.name)}`)}
                          className="text-[#ff5722] hover:text-orange-700 font-extrabold text-sm leading-none cursor-pointer"
                          title="Schedule Trial Appointment"
                        >
                          +
                        </button>
                      </td>

                      {/* Trials */}
                      <td className="px-1 py-1 text-center border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/follow-ups/new?type=enquiry&id=${enquiry._id}&name=${encodeURIComponent(enquiry.name)}`)}
                          className="text-[#ff5722] hover:text-orange-700 font-extrabold text-sm leading-none cursor-pointer"
                          title="Add Trial"
                        >
                          +
                        </button>
                      </td>

                      {/* Other Appointment */}
                      <td className="px-1 py-1 text-center border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/follow-ups/new?type=enquiry&id=${enquiry._id}&name=${encodeURIComponent(enquiry.name)}`)}
                          className="text-[#ff5722] hover:text-orange-700 font-extrabold text-sm leading-none cursor-pointer"
                          title="Other Appointment"
                        >
                          +
                        </button>
                      </td>

                      {/* Staff in Orange text matching Image 2 & 3 */}
                      <td className="px-1.5 py-1 text-left border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        <span className="text-[#ff5722] font-semibold hover:underline cursor-pointer">
                          {getStaffName(enquiry.assignedStaff)}
                        </span>
                      </td>

                      {/* Fitness Log (+ and 👁 buttons) matching Image 2 & 3 */}
                      <td className="px-1.5 py-1 text-center border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setFitnessModalEnquiry(enquiry);
                              setFitnessGoalText(enquiry.interests || '');
                            }}
                            className="text-sky-600 dark:text-sky-400 font-extrabold text-xs leading-none hover:scale-110 cursor-pointer"
                            title="Add Fitness Goal / Log"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              addToast(`Fitness Notes: ${enquiry.interests || 'No fitness log available'}`, 'info');
                            }}
                            className="text-sky-600 dark:text-sky-400 hover:text-sky-800 cursor-pointer"
                            title="View Fitness Log"
                          >
                            <Eye size={12} />
                          </button>
                        </div>
                      </td>

                      {/* Action (Edit pencil) matching Image 2 & 3 */}
                      <td className="px-1.5 py-1 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/enquiry-form?id=${enquiry._id}`)}
                          className="text-sky-500 hover:text-sky-700 transition-colors cursor-pointer"
                          title="Edit Enquiry"
                        >
                          <Edit size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Bar Below Table */}
      <div className="flex items-center justify-between py-2 text-xs text-gray-700 dark:text-gray-300">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 disabled:opacity-40 cursor-pointer font-bold"
            title="First Page"
          >
            |&lt;
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 disabled:opacity-40 cursor-pointer font-bold"
            title="Previous Page"
          >
            &lt;
          </button>
        </div>

        <div className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
          Page {currentPage} of {totalPages}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 disabled:opacity-40 cursor-pointer font-bold"
            title="Next Page"
          >
            &gt;
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 disabled:opacity-40 cursor-pointer font-bold"
            title="Last Page"
          >
            &gt;|
          </button>
          <input
            type="text"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            className="w-10 h-7 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#ff5722]"
          />
          <button
            onClick={handlePageJump}
            className="bg-[#ff5722] hover:bg-orange-600 text-white font-semibold text-xs px-2.5 py-1 rounded transition-colors cursor-pointer"
          >
            Go
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: Convert to Member / Invoice Modal matching previous designs */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {convertModalEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-[#ff5722] text-white px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold text-sm">Convert to Member</h3>
              <button
                onClick={() => setConvertModalEnquiry(null)}
                className="text-white hover:text-gray-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-[90px_1fr] items-center gap-3">
                <span className="text-gray-700 dark:text-gray-300">Name:</span>
                <span className="font-bold text-gray-900 dark:text-white">{convertModalEnquiry.name}</span>
              </div>
              <div className="grid grid-cols-[90px_1fr] items-center gap-3">
                <span className="text-gray-700 dark:text-gray-300">Phone:</span>
                <span className="text-gray-900 dark:text-white">{convertModalEnquiry.phone}</span>
              </div>
              <div className="grid grid-cols-[90px_1fr] items-start gap-3">
                <span className="text-gray-700 dark:text-gray-300 pt-1">Comments:</span>
                <textarea
                  rows={3}
                  value={convertComments}
                  onChange={(e) => setConvertComments(e.target.value)}
                  placeholder="Additional notes for conversion..."
                  className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#ff5722]"
                />
              </div>

              <div className="flex items-center justify-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleConfirmConvert}
                  className="bg-[#ff5722] hover:bg-orange-600 text-white font-semibold px-6 py-2 rounded text-xs transition-colors cursor-pointer"
                >
                  Proceed to Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setConvertModalEnquiry(null)}
                  className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold px-6 py-2 rounded text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: Quick Call Log Modal */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {callLogModalEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-[#ff5722] text-white px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Phone size={15} /> Add Call Log — {callLogModalEnquiry.name}
              </h3>
              <button
                onClick={() => setCallLogModalEnquiry(null)}
                className="text-white hover:text-gray-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveCallLog} className="p-5 space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Call Tag
                </label>
                <select
                  value={callLogTag}
                  onChange={(e) => setCallLogTag(e.target.value as any)}
                  className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-900"
                >
                  <option value="hot">Hot</option>
                  <option value="warm">Warm</option>
                  <option value="cold">Cold</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Next Follow-Up Date
                </label>
                <input
                  type="date"
                  value={callLogFollowUpDate}
                  onChange={(e) => setCallLogFollowUpDate(e.target.value)}
                  className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Call Notes / Follow-up Message
                </label>
                <textarea
                  rows={3}
                  required
                  value={callLogMessage}
                  onChange={(e) => setCallLogMessage(e.target.value)}
                  placeholder="Enter details of conversation..."
                  className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-[#ff5722]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCallLogModalEnquiry(null)}
                  className="px-4 py-1.5 text-xs rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 text-xs rounded bg-[#ff5722] hover:bg-orange-600 text-white font-semibold cursor-pointer"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 3: Fitness Log Modal */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {fitnessModalEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-sky-600 text-white px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Activity size={15} /> Fitness Log — {fitnessModalEnquiry.name}
              </h3>
              <button
                onClick={() => setFitnessModalEnquiry(null)}
                className="text-white hover:text-gray-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveFitnessGoal} className="p-5 space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Fitness Interests & Goals
                </label>
                <textarea
                  rows={4}
                  value={fitnessGoalText}
                  onChange={(e) => setFitnessGoalText(e.target.value)}
                  placeholder="e.g. Weight loss (5kg in 3 months), Muscle gain, Cardio conditioning..."
                  className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFitnessModalEnquiry(null)}
                  className="px-4 py-1.5 text-xs rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 text-xs rounded bg-sky-600 hover:bg-sky-700 text-white font-semibold cursor-pointer"
                >
                  Save Fitness Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 4: Bulk Staff Change Modal */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {isStaffChangeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-sm w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-[#ff5722] text-white px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold text-sm">Reassign Staff</h3>
              <button
                onClick={() => setIsStaffChangeModalOpen(false)}
                className="text-white hover:text-gray-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm">
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Reassign <strong>{selectedEnquiryIds.length}</strong> selected enquiries to:
              </p>
              <select
                value={newAssignedStaffId}
                onChange={(e) => setNewAssignedStaffId(e.target.value)}
                className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-900"
              >
                <option value="">Select Staff Member</option>
                {staff.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.fullName} ({s.position || 'Staff'})
                  </option>
                ))}
              </select>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStaffChangeModalOpen(false)}
                  className="px-4 py-1.5 text-xs rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmStaffChange}
                  className="px-5 py-1.5 text-xs rounded bg-[#ff5722] hover:bg-orange-600 text-white font-semibold cursor-pointer"
                >
                  Reassign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={isBulkUploadModalOpen}
        onClose={() => setIsBulkUploadModalOpen(false)}
        onUploadSuccess={(result) => {
          setUploadResult(result);
          setIsResultsModalOpen(true);
        }}
      />

      {/* Upload Results Report Modal */}
      {uploadResult && (
        <UploadResultsReport
          isOpen={isResultsModalOpen}
          onClose={() => {
            setIsResultsModalOpen(false);
            setUploadResult(null);
          }}
          result={uploadResult}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        type={confirmState.type}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default EnquiriesPage;
