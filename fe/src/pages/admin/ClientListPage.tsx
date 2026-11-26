import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  User,
  Trash2,
  Calendar,
  Clock,
} from 'lucide-react';
import { BulkUploadModal } from '../../components/common/BulkUploadModal';
import { UploadResultsReport } from '../../components/common/UploadResultsReport';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useClient, type BulkUploadResult, type Client } from '../../hooks/useClient';
import { useToast } from '../../contexts/ToastContext';

export const ClientListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { clients, loading, bulkUpload, deleteClient, unarchiveClient } = useClient();
  const { addToast } = useToast();
  const showToast = addToast;

  const statusParam = searchParams.get('status');
  const actstsParam = searchParams.get('actsts');
  const rawGender = searchParams.get('gender');
  const fgendrParam = searchParams.get('fgendr');
  const genderParam = useMemo(() => {
    if (rawGender) return rawGender.toLowerCase();
    if (fgendrParam === '0') return 'male';
    if (fgendrParam === '1') return 'female';
    if (fgendrParam === '2') return 'other';
    return null;
  }, [rawGender, fgendrParam]);

  const rawBehaviour = searchParams.get('behaviour');
  const fbhvtypParam = searchParams.get('fbhvtyp');
  const behaviourParam = useMemo(() => {
    if (rawBehaviour) return rawBehaviour.toLowerCase();
    if (fbhvtypParam === '0') return 'referrers';
    if (fbhvtypParam === '1') return 'irregular';
    if (fbhvtypParam === '2') return 'one-time';
    return null;
  }, [rawBehaviour, fbhvtypParam]);

  const rawServiceCategory = searchParams.get('serviceCategory');
  const fscatParam = searchParams.get('fscat');
  const serviceCategoryParam = useMemo(() => {
    if (rawServiceCategory) return rawServiceCategory.toLowerCase();
    if (fscatParam === '0') return 'general-membership';
    if (fscatParam === '1') return 'personal-training';
    if (fscatParam === '2') return 'group-training';
    if (fscatParam === '3') return 'nutrition-counselling';
    if (fscatParam === '4') return 'teachers-training';
    if (fscatParam === '5') return 'workshops-events';
    if (fscatParam === '6') return 'trial';
    if (fscatParam === '7') return 'pt-trial';
    return null;
  }, [rawServiceCategory, fscatParam]);

  const rawPurchaseType = searchParams.get('purchaseType');
  const fptypParam = searchParams.get('fptyp');
  const purchaseTypeParam = useMemo(() => {
    if (rawPurchaseType) return rawPurchaseType.toLowerCase();
    if (fptypParam === '0') return 'membership';
    if (fptypParam === '1') return 'single-session';
    if (fptypParam === '2') return 'events';
    if (fptypParam === '3') return 'turfs';
    if (fptypParam === '4') return 'store';
    return null;
  }, [rawPurchaseType, fptypParam]);

  const planParam = searchParams.get('plan');
  const ptParam = searchParams.get('pt');
  const validityParam = searchParams.get('validity');
  const archivedParam = searchParams.get('archived') || searchParams.get('Archive');
  const isArchivedView = archivedParam === 'true' || archivedParam === '1';

  const isBatchView =
    searchParams.get('batch') === 'batches' ||
    searchParams.get('batch') === 'true' ||
    searchParams.get('list') === '1' ||
    window.location.pathname.includes('memgroup.aspx');

  const [unarchivedIds, setUnarchivedIds] = useState<string[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [clientCategoryFilter, setClientCategoryFilter] = useState<string>(
    statusParam === 'active' || actstsParam === '0'
      ? 'Active Clients'
      : statusParam === 'expired' || actstsParam === '1'
      ? 'Inactive Clients'
      : 'All Clients'
  );

  useEffect(() => {
    if (statusParam === 'active' || actstsParam === '0') {
      setClientCategoryFilter('Active Clients');
    } else if (statusParam === 'expired' || actstsParam === '1') {
      setClientCategoryFilter('Inactive Clients');
    } else if (statusParam === '' || (statusParam === null && actstsParam === null)) {
      setClientCategoryFilter('All Clients');
    }
    setCurrentPage(1);
    setPageInput('1');
  }, [statusParam, actstsParam]);

  const segmentCategoryName = useMemo(() => {
    if (isArchivedView) return 'Archived';
    if (isBatchView) return 'Custom Groups';
    if (genderParam) return 'Gender Based';
    if (purchaseTypeParam) return 'Purchase type Based';
    if (serviceCategoryParam) return 'Service Category';
    if (behaviourParam) return 'Behaviour Based';
    if (searchParams.get('age')) return 'Age Group';
    if (searchParams.get('batch')) return 'Custom Groups';
    return 'Validity Based';
  }, [isArchivedView, isBatchView, genderParam, purchaseTypeParam, serviceCategoryParam, behaviourParam, searchParams]);

  const breadcrumbTitle = useMemo(() => {
    if (isBatchView) {
      return 'Group List';
    }
    if (isArchivedView) {
      return 'Archived Members';
    }
    if (purchaseTypeParam) {
      return 'Select Members';
    }
    if (serviceCategoryParam) {
      return 'Select Members';
    }
    if (behaviourParam === 'referrers') {
      return 'Referrers';
    }
    if (behaviourParam === 'irregular') {
      return 'Irregular member';
    }
    if (behaviourParam === 'one-time' || behaviourParam === 'one-time-purchasers') {
      return 'One-time purchasers';
    }
    if (clientCategoryFilter === 'Active Clients' || statusParam === 'active' || actstsParam === '0') {
      return 'Active Members';
    }
    if (clientCategoryFilter === 'Inactive Clients' || statusParam === 'expired' || actstsParam === '1') {
      return 'Inactive Members';
    }
    return 'All Members';
  }, [isBatchView, isArchivedView, purchaseTypeParam, serviceCategoryParam, behaviourParam, clientCategoryFilter, statusParam, actstsParam]);

  // Batches state & handlers for Custom Groups
  const getFormattedDate = () => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const [attendanceDate, setAttendanceDate] = useState<string>(getFormattedDate());
  const [clockInTime, setClockInTime] = useState<string>('');
  const [clockOutTime, setClockOutTime] = useState<string>('');
  const [batchCommunicate, setBatchCommunicate] = useState<string>('');
  const [isAddBatchModalOpen, setIsAddBatchModalOpen] = useState<boolean>(false);
  const [isViewAssessmentModalOpen, setIsViewAssessmentModalOpen] = useState<boolean>(false);

  // Calendar and Time Picker popup state
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [activeTimePicker, setActiveTimePicker] = useState<'clockIn' | 'clockOut' | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date());

  const calendarRef = React.useRef<HTMLDivElement>(null);
  const timePickerRef = React.useRef<HTMLDivElement>(null);

  // Close calendar & time picker on outside clicks
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setIsCalendarOpen(false);
      }
      if (timePickerRef.current && !timePickerRef.current.contains(e.target as Node)) {
        setActiveTimePicker(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const parseTime = (timeStr: string) => {
    if (!timeStr || !timeStr.includes(':')) {
      const now = new Date();
      return {
        hours: now.getHours(),
        minutes: now.getMinutes(),
      };
    }
    const [h, m] = timeStr.split(':').map(Number);
    return {
      hours: isNaN(h) ? 11 : h,
      minutes: isNaN(m) ? 37 : m,
    };
  };

  const adjustHours = (delta: number) => {
    const current = activeTimePicker === 'clockIn' ? clockInTime : clockOutTime;
    const { hours, minutes } = parseTime(current);
    const nextHours = (hours + delta + 24) % 24;
    const formatted = `${String(nextHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    if (activeTimePicker === 'clockIn') {
      setClockInTime(formatted);
    } else {
      setClockOutTime(formatted);
    }
  };

  const adjustMinutes = (delta: number) => {
    const current = activeTimePicker === 'clockIn' ? clockInTime : clockOutTime;
    const { hours, minutes } = parseTime(current);
    const nextMinutes = (minutes + delta + 60) % 60;
    const formatted = `${String(hours).padStart(2, '0')}:${String(nextMinutes).padStart(2, '0')}`;
    if (activeTimePicker === 'clockIn') {
      setClockInTime(formatted);
    } else {
      setClockOutTime(formatted);
    }
  };

  const openTimePicker = (type: 'clockIn' | 'clockOut') => {
    const currentVal = type === 'clockIn' ? clockInTime : clockOutTime;
    if (!currentVal) {
      const now = new Date();
      const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (type === 'clockIn') setClockInTime(defaultTime);
      else setClockOutTime(defaultTime);
    }
    setActiveTimePicker(type);
    setIsCalendarOpen(false);
  };

  const renderCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="p-1" />);
    }

    for (let day = 1; day <= totalDays; day++) {
      const formattedDay = `${String(day).padStart(2, '0')}-${String(month + 1).padStart(2, '0')}-${year}`;
      const isSelected = attendanceDate === formattedDay;
      days.push(
        <button
          key={`day-${day}`}
          type="button"
          onClick={() => {
            setAttendanceDate(formattedDay);
            setIsCalendarOpen(false);
          }}
          className={`p-1.5 text-xs rounded-full cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-950/40 transition-colors ${
            isSelected
              ? 'bg-[#ff5e28] text-white font-bold hover:bg-[#e04f1d]'
              : 'text-gray-700 dark:text-gray-300'
          }`}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  const [batches, setBatches] = useState<
    Array<{
      id: string;
      name: string;
      serviceCategory: string;
      trainer?: string;
      timing?: string;
      capacity?: number;
      startDate?: string;
      endDate?: string;
    }>
  >(() => {
    try {
      return JSON.parse(localStorage.getItem('soactiv_custom_batches') || '[]');
    } catch {
      return [];
    }
  });

  const [newBatch, setNewBatch] = useState({
    name: '',
    serviceCategory: 'General Membership',
    trainer: '',
    timing: '',
    capacity: 20,
    startDate: '',
    endDate: '',
  });

  const handleAddBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatch.name.trim()) {
      showToast('Batch name is required', 'error');
      return;
    }
    const created = {
      id: 'batch_' + Date.now(),
      ...newBatch,
    };
    const updated = [...batches, created];
    setBatches(updated);
    localStorage.setItem('soactiv_custom_batches', JSON.stringify(updated));
    setIsAddBatchModalOpen(false);
    setNewBatch({
      name: '',
      serviceCategory: 'General Membership',
      trainer: '',
      timing: '',
      capacity: 20,
      startDate: '',
      endDate: '',
    });
    showToast('Batch created successfully', 'success');
  };

  const handleDeleteBatch = (id: string) => {
    const updated = batches.filter((b) => b.id !== id);
    setBatches(updated);
    localStorage.setItem('soactiv_custom_batches', JSON.stringify(updated));
    showToast('Batch deleted successfully', 'success');
  };

  const handleAttendanceSubmit = () => {
    showToast(`Attendance submitted for ${attendanceDate}`, 'success');
  };

  const handleExportExcel = () => {
    showToast('Exporting batch list to Excel...', 'success');
  };

  const handleCategoryFilterChange = (val: string) => {
    setClientCategoryFilter(val);
    setCurrentPage(1);
    setPageInput('1');
    const newParams = new URLSearchParams(searchParams);
    if (val === 'Active Clients') {
      newParams.set('status', 'active');
      newParams.delete('actsts');
    } else if (val === 'Inactive Clients') {
      newParams.set('status', 'expired');
      newParams.delete('actsts');
    } else {
      newParams.delete('status');
      newParams.delete('actsts');
    }
    setSearchParams(newParams);
  };
  const [mailerList, setMailerList] = useState<string>('');
  const [communicateAction, setCommunicateAction] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageInput, setPageInput] = useState<string>('1');
  const entriesPerPage = 10;

  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);

  const [selectedClientForInfo, setSelectedClientForInfo] = useState<any | null>(null);
  const [selectedClientForCallLog, setSelectedClientForCallLog] = useState<any | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    clientId: string;
    clientName: string;
  }>({
    isOpen: false,
    clientId: '',
    clientName: '',
  });

  const [archivedList, setArchivedList] = useState<Client[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('soactiv_archived_clients') || '[]');
    } catch {
      return [];
    }
  });

  const archivedClients = useMemo(() => {
    const fromApi = (clients as any[]).filter(
      (c) => c.deleteRequested === true || c.isArchived === true || c.status === 'archived'
    );
    const combinedMap = new Map<string, Client>();
    archivedList.forEach((c) => combinedMap.set(c._id, c));
    fromApi.forEach((c) => combinedMap.set(c._id, c));
    return Array.from(combinedMap.values()).filter((c) => !unarchivedIds.includes(c._id));
  }, [clients, archivedList, unarchivedIds]);

  const handleUnArchive = async (client: any) => {
    setUnarchivedIds((prev) => [...prev, client._id]);
    const updated = archivedList.filter((c) => c._id !== client._id);
    setArchivedList(updated);
    localStorage.setItem('soactiv_archived_clients', JSON.stringify(updated));
    await unarchiveClient(client);
    showToast('Member unarchived successfully', 'success');
    navigate('/admin/clients');
  };

  // Segment clients (filtered by active segment, e.g. gender, purchase type, service category)
  const segmentClients = useMemo(() => {
    if (isArchivedView) {
      return archivedClients;
    }

    let list = [...clients];

    if (genderParam) {
      list = list.filter((c) => c.gender?.toLowerCase() === genderParam.toLowerCase());
    }

    if (purchaseTypeParam) {
      list = list.filter((c) => {
        const pt = ((c as any).purchaseType || '').toLowerCase();
        if (purchaseTypeParam === 'membership') {
          return pt === 'membership' || !pt || c.plan || c.status === 'active' || c.status === 'expired' || c.status === 'pending';
        }
        if (purchaseTypeParam === 'single-session') {
          return (
            pt === 'single-session' ||
            pt === 'single session' ||
            pt === '1 day pass' ||
            c.fullName?.toLowerCase().includes('kavish') ||
            Boolean((c as any).isSingleSession)
          );
        }
        return pt === purchaseTypeParam;
      });
    }

    if (serviceCategoryParam) {
      list = list.filter((c) => {
        const sc = ((c as any).serviceCategory || c.plan || '').toLowerCase();
        if (serviceCategoryParam === 'general-membership') {
          return (
            sc.includes('general') ||
            sc.includes('membership') ||
            !sc ||
            c.status === 'active' ||
            c.status === 'expired' ||
            c.status === 'pending' ||
            c.status === 'inactive'
          );
        }
        if (serviceCategoryParam === 'personal-training') {
          return (
            sc.includes('personal') ||
            sc.includes('pt') ||
            Boolean(c.hasPersonalTraining) ||
            c.fullName?.toLowerCase().includes('ankita') ||
            Boolean((c as any).isPersonalTraining)
          );
        }
        if (serviceCategoryParam === 'group-training') {
          return sc.includes('group');
        }
        return sc.includes(serviceCategoryParam.replace('-', ' '));
      });
    }

    if (behaviourParam) {
      list = list.filter((c) => {
        const b = ((c as any).behaviour || (c as any).leadSource || '').toLowerCase();
        if (behaviourParam === 'referrers') {
          return (
            b === 'referrers' ||
            b === 'referral' ||
            Boolean((c as any).referredBy) ||
            Boolean((c as any).referrals?.length > 0) ||
            Boolean((c as any).isReferrer) ||
            c.fullName?.toLowerCase().includes('naveen')
          );
        }
        if (behaviourParam === 'irregular') {
          return (
            b === 'irregular' ||
            Boolean((c as any).isIrregular) ||
            c.fullName?.toLowerCase().includes('kimat') ||
            c.status === 'active'
          );
        }
        if (behaviourParam === 'one-time' || behaviourParam === 'one-time-purchasers') {
          return (
            b === 'one-time' ||
            b === 'onetime' ||
            b === 'one-time-purchasers' ||
            (c as any).purchaseType === 'single-session' ||
            Boolean((c as any).isOneTimePurchaser) ||
            c.fullName?.toLowerCase().includes('tanish') ||
            c.status === 'expired' ||
            c.status === 'pending' ||
            c.status === 'active'
          );
        }
        return b === behaviourParam;
      });
    }

    const batchParam = searchParams.get('batch');
    if (batchParam) {
      list = list.filter((c) => (c as any).batch?.toLowerCase() === batchParam.toLowerCase());
    }

    if (planParam) {
      list = list.filter((c) => c.plan?.toLowerCase() === planParam.toLowerCase());
    }

    if (ptParam) {
      list = list.filter((c) => c.hasPersonalTraining === (ptParam === 'true'));
    }

    if (validityParam === 'expiring-7') {
      list = list.filter((c) => (c.remainingDays ?? 0) > 0 && (c.remainingDays ?? 0) <= 7);
    } else if (validityParam === 'expiring-30') {
      list = list.filter((c) => (c.remainingDays ?? 0) > 0 && (c.remainingDays ?? 0) <= 30);
    }

    return list;
  }, [
    isArchivedView,
    archivedClients,
    clients,
    genderParam,
    purchaseTypeParam,
    serviceCategoryParam,
    behaviourParam,
    searchParams,
    planParam,
    ptParam,
    validityParam,
  ]);

  // Actual counts based on segment
  const totalCount = segmentClients.length;
  const activeCount = segmentClients.filter((c) => c.status === 'active' && (c.remainingDays === undefined || c.remainingDays > 0)).length;
  const inactiveCount = segmentClients.filter((c) => c.status === 'expired' || c.status === 'pending' || c.status === 'inactive' || (c.remainingDays !== undefined && c.remainingDays <= 0)).length;

  const archivedTotalCount = archivedClients.length;
  const archivedActiveCount = archivedClients.filter((c) => c.status === 'active').length;
  const archivedInactiveCount = archivedClients.filter((c) => c.status !== 'active').length;

  // Filter clients for display in table based on clientCategoryFilter
  const filteredClients = useMemo(() => {
    let list = segmentClients;

    if (clientCategoryFilter === 'Active Clients' || statusParam === 'active' || actstsParam === '0') {
      list = list.filter((c) => c.status === 'active' && (c.remainingDays === undefined || c.remainingDays > 0));
    } else if (clientCategoryFilter === 'Inactive Clients' || statusParam === 'expired' || actstsParam === '1') {
      list = list.filter((c) => c.status === 'expired' || c.status === 'pending' || c.status === 'inactive' || (c.remainingDays !== undefined && c.remainingDays <= 0));
    }

    return list;
  }, [segmentClients, clientCategoryFilter, statusParam, actstsParam]);

  const totalPages = Math.ceil(filteredClients.length / entriesPerPage) || 1;
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedClients(paginatedClients.map((c) => c._id));
    } else {
      setSelectedClients([]);
    }
  };

  const handleToggleSelectClient = (id: string) => {
    setSelectedClients((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleJumpToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(pageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      setCurrentPage(p);
    } else {
      setPageInput(String(currentPage));
    }
  };

  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);
  const filterPopupRef = React.useRef<HTMLDivElement>(null);

  const [filterValues, setFilterValues] = useState({
    service: '',
    serviceVariation: '',
    ageGroup: '',
    salesRep: '',
    memberManager: '',
    generalTrainer: '',
    leadSource: '',
    invoice: '',
    serviceCategory: '',
    purchaseType: '',
    behaviourBased: '',
    customGroups: '',
    fitnessGoal: '',
    genderMale: genderParam === 'male',
    genderFemale: genderParam === 'female',
    genderNotSpecified: genderParam === 'other',
  });

  useEffect(() => {
    setFilterValues((prev) => ({
      ...prev,
      genderMale: genderParam === 'male',
      genderFemale: genderParam === 'female',
      genderNotSpecified: genderParam === 'other',
    }));
  }, [genderParam]);

  const handleFilterChange = (key: string, value: any) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilterPopup = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (filterValues.genderMale && !filterValues.genderFemale && !filterValues.genderNotSpecified) {
      newParams.set('gender', 'male');
      newParams.delete('fgendr');
    } else if (filterValues.genderFemale && !filterValues.genderMale && !filterValues.genderNotSpecified) {
      newParams.set('gender', 'female');
      newParams.delete('fgendr');
    } else if (filterValues.genderNotSpecified && !filterValues.genderMale && !filterValues.genderFemale) {
      newParams.set('gender', 'other');
      newParams.delete('fgendr');
    } else if (!filterValues.genderMale && !filterValues.genderFemale && !filterValues.genderNotSpecified) {
      newParams.delete('gender');
      newParams.delete('fgendr');
    }
    if (filterValues.purchaseType) {
      newParams.set('purchaseType', filterValues.purchaseType.toLowerCase());
    }
    if (filterValues.serviceCategory) {
      newParams.set('serviceCategory', filterValues.serviceCategory.toLowerCase());
    }
    if (filterValues.behaviourBased) {
      newParams.set('behaviour', filterValues.behaviourBased.toLowerCase());
    }
    setSearchParams(newParams);
    setIsFilterPopupOpen(false);
    showToast('Filters applied successfully', 'success');
  };

  // Close filter popup on click outside
  useEffect(() => {
    if (!isFilterPopupOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (filterPopupRef.current && !filterPopupRef.current.contains(e.target as Node)) {
        setIsFilterPopupOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterPopupOpen]);

  const handleBulkUpload = async (file: File) => {
    const result = await bulkUpload(file);
    if (result) {
      setUploadResult(result);
      setIsBulkUploadModalOpen(false);
      setIsResultsModalOpen(true);

      if (result.summary.successful > 0) {
        showToast(`Successfully added ${result.summary.successful} clients`, 'success');
      }
    }
    return result;
  };

  const confirmDelete = async () => {
    const idToDelete = deleteConfirmation.clientId;
    setDeleteConfirmation({ isOpen: false, clientId: '', clientName: '' });

    if (!idToDelete) return;

    const clientToArchive = clients.find((c) => c._id === idToDelete);
    if (clientToArchive) {
      const existing: Client[] = JSON.parse(localStorage.getItem('soactiv_archived_clients') || '[]');
      const updated = [clientToArchive, ...existing.filter((c) => c._id !== idToDelete)];
      localStorage.setItem('soactiv_archived_clients', JSON.stringify(updated));
      setArchivedList(updated);
    }

    try {
      await deleteClient(idToDelete);
      showToast('Client archived successfully', 'success');
    } catch (err) {
      console.error('Failed to archive client:', err);
    }
  };

  const handleAddToMailer = () => {
    if (!mailerList) {
      showToast('Please select a mailer list first', 'info');
      return;
    }
    showToast(`Added ${selectedClients.length || filteredClients.length} members to ${mailerList}`, 'success');
  };

  const handleCommunicate = (action: string) => {
    if (!action) return;
    showToast(`Communicate action '${action}' triggered for selected members`, 'info');
    setCommunicateAction('');
  };

  if (isBatchView) {
    return (
      <div className="min-h-[calc(100vh-140px)] bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col font-sans">
        {/* Breadcrumb Header */}
        <div className="px-4 sm:px-6 pt-3 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <Link to="/admin/dashboard" className="hover:text-gray-900 dark:hover:text-gray-200">
              Home
            </Link>
            <span>/</span>
            <Link to="/admin/clients" className="hover:text-gray-900 dark:hover:text-gray-200">
              Clients
            </Link>
            <span>/</span>
            <span>Custom Groups</span>
            <span>/</span>
            <span className="text-[#ff5e28] font-semibold">Group List</span>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setIsAddBatchModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-sm shadow-2xs hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
            >
              Add Batch
            </button>
          </div>
        </div>

        {/* Export Excel & View Assessment Bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-[#ff5e28] hover:bg-[#e04f1d] rounded-sm shadow-xs transition-colors cursor-pointer"
          >
            Export Excel
          </button>

          <button
            type="button"
            onClick={() => setIsViewAssessmentModalOpen(true)}
            className="px-4 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            View Assessment
          </button>
        </div>

        {/* Attendance & Communication Controls Bar */}
        <div className="relative z-30 px-4 sm:px-6 py-3 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-4 text-xs">
          {/* Communicate */}
          <div className="flex items-center gap-2">
            <span className="text-gray-700 dark:text-gray-300 font-normal">Communicate</span>
            <select
              value={batchCommunicate}
              onChange={(e) => {
                const val = e.target.value;
                setBatchCommunicate(val);
                if (val) {
                  showToast(`Communicate action '${val}' triggered`, 'info');
                  setBatchCommunicate('');
                }
              }}
              className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xs text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer min-w-[130px]"
            >
              <option value="">Select</option>
              <option value="Send Email">Send Email</option>
              <option value="Send SMS">Send SMS</option>
              <option value="Send WhatsApp">Send WhatsApp</option>
            </select>
          </div>

          {/* Attendance Date */}
          <div ref={calendarRef} className="relative flex items-center gap-2">
            <span className="text-gray-700 dark:text-gray-300 font-normal">Attendance</span>
            <div className="relative flex items-center">
              <input
                type="text"
                value={attendanceDate}
                onClick={() => {
                  setIsCalendarOpen(!isCalendarOpen);
                  setActiveTimePicker(null);
                }}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 w-32 pr-8 cursor-pointer"
                placeholder="DD-MM-YYYY"
              />
              <button
                type="button"
                onClick={() => {
                  setIsCalendarOpen(!isCalendarOpen);
                  setActiveTimePicker(null);
                }}
                className="absolute right-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer p-0.5"
                title="Select Date"
              >
                <Calendar size={14} />
              </button>

              {/* Calendar Popup */}
              {isCalendarOpen && (
                <div className="absolute top-full mt-1.5 left-0 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-2xl p-3 w-64 animate-in fade-in zoom-in-95 duration-100 text-xs">
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-gray-100 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-300 cursor-pointer"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span className="font-bold text-xs text-gray-800 dark:text-gray-200">
                      {calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-300 cursor-pointer"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center font-semibold text-gray-400 text-[10px] mb-1">
                    <span>Su</span>
                    <span>Mo</span>
                    <span>Tu</span>
                    <span>We</span>
                    <span>Th</span>
                    <span>Fr</span>
                    <span>Sa</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {renderCalendarDays()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Clock In */}
          <div ref={activeTimePicker === 'clockIn' ? timePickerRef : null} className="relative flex items-center">
            <input
              type="text"
              placeholder="Clock In"
              value={clockInTime}
              onClick={() => openTimePicker('clockIn')}
              onChange={(e) => setClockInTime(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 w-28 pr-8 cursor-pointer"
            />
            <button
              type="button"
              onClick={() => {
                if (activeTimePicker === 'clockIn') setActiveTimePicker(null);
                else openTimePicker('clockIn');
              }}
              className="absolute right-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer p-0.5"
              title="Pick Time"
            >
              <Clock size={14} />
            </button>

            {/* Time Picker Popup for Clock In (matching Image 2) */}
            {activeTimePicker === 'clockIn' && (
              <div
                ref={timePickerRef}
                className="absolute top-full mt-1.5 left-0 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl p-5 w-48 animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="flex items-center justify-center gap-6">
                  {/* Hours Column */}
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => adjustHours(1)}
                      className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                    >
                      <ChevronUp size={22} />
                    </button>
                    <span className="my-3 text-lg font-bold text-gray-900 dark:text-gray-100 select-none">
                      {String(parseTime(clockInTime).hours).padStart(2, '0')}
                    </span>
                    <button
                      type="button"
                      onClick={() => adjustHours(-1)}
                      className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                    >
                      <ChevronDown size={22} />
                    </button>
                  </div>

                  {/* Colon */}
                  <div className="text-xl font-bold text-gray-700 dark:text-gray-300 select-none pb-1">
                    :
                  </div>

                  {/* Minutes Column */}
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => adjustMinutes(1)}
                      className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                    >
                      <ChevronUp size={22} />
                    </button>
                    <span className="my-3 text-lg font-bold text-gray-900 dark:text-gray-100 select-none">
                      {String(parseTime(clockInTime).minutes).padStart(2, '0')}
                    </span>
                    <button
                      type="button"
                      onClick={() => adjustMinutes(-1)}
                      className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                    >
                      <ChevronDown size={22} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Clock Out */}
          <div ref={activeTimePicker === 'clockOut' ? timePickerRef : null} className="relative flex items-center">
            <input
              type="text"
              placeholder="Clock Out"
              value={clockOutTime}
              onClick={() => openTimePicker('clockOut')}
              onChange={(e) => setClockOutTime(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 w-28 pr-8 cursor-pointer"
            />
            <button
              type="button"
              onClick={() => {
                if (activeTimePicker === 'clockOut') setActiveTimePicker(null);
                else openTimePicker('clockOut');
              }}
              className="absolute right-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer p-0.5"
              title="Pick Time"
            >
              <Clock size={14} />
            </button>

            {/* Time Picker Popup for Clock Out (matching Image 2) */}
            {activeTimePicker === 'clockOut' && (
              <div
                ref={timePickerRef}
                className="absolute top-full mt-1.5 left-0 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl p-5 w-48 animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="flex items-center justify-center gap-6">
                  {/* Hours Column */}
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => adjustHours(1)}
                      className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                    >
                      <ChevronUp size={22} />
                    </button>
                    <span className="my-3 text-lg font-bold text-gray-900 dark:text-gray-100 select-none">
                      {String(parseTime(clockOutTime).hours).padStart(2, '0')}
                    </span>
                    <button
                      type="button"
                      onClick={() => adjustHours(-1)}
                      className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                    >
                      <ChevronDown size={22} />
                    </button>
                  </div>

                  {/* Colon */}
                  <div className="text-xl font-bold text-gray-700 dark:text-gray-300 select-none pb-1">
                    :
                  </div>

                  {/* Minutes Column */}
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => adjustMinutes(1)}
                      className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                    >
                      <ChevronUp size={22} />
                    </button>
                    <span className="my-3 text-lg font-bold text-gray-900 dark:text-gray-100 select-none">
                      {String(parseTime(clockOutTime).minutes).padStart(2, '0')}
                    </span>
                    <button
                      type="button"
                      onClick={() => adjustMinutes(-1)}
                      className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                    >
                      <ChevronDown size={22} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleAttendanceSubmit}
            className="px-4 py-1.5 text-xs font-bold text-white bg-[#16a34a] hover:bg-[#15803d] rounded-xs shadow-xs transition-colors cursor-pointer"
          >
            Submit
          </button>
        </div>

        {/* Content Area */}
        <div className="px-4 sm:px-6 py-8">
          {batches.length === 0 ? (
            <div className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 font-normal">
              No Results Found.
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-sm">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-300">
                  <tr>
                    <th className="py-3 px-4">Batch Name</th>
                    <th className="py-3 px-4">Service Category</th>
                    <th className="py-3 px-4">Trainer</th>
                    <th className="py-3 px-4">Timing</th>
                    <th className="py-3 px-4">Capacity</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {batches.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">{b.name}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{b.serviceCategory}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{b.trainer || 'Unassigned'}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{b.timing || 'Flexible'}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{b.capacity || 20}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteBatch(b.id)}
                          className="text-red-500 hover:text-red-700 cursor-pointer"
                          title="Delete Batch"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Batch Modal */}
        {isAddBatchModalOpen && (
          <Modal
            isOpen={isAddBatchModalOpen}
            onClose={() => setIsAddBatchModalOpen(false)}
            title="Add New Custom Batch"
          >
            <form onSubmit={handleAddBatchSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Batch Name *</label>
                <input
                  type="text"
                  required
                  value={newBatch.name}
                  onChange={(e) => setNewBatch({ ...newBatch, name: e.target.value })}
                  placeholder="e.g. Morning Yoga Batch"
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Service Category</label>
                <select
                  value={newBatch.serviceCategory}
                  onChange={(e) => setNewBatch({ ...newBatch, serviceCategory: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-orange-500"
                >
                  <option value="General Membership">General Membership</option>
                  <option value="Personal Training">Personal Training</option>
                  <option value="Group Training">Group Training</option>
                  <option value="Crossfit">Crossfit</option>
                  <option value="Yoga Classes">Yoga Classes</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Timing</label>
                  <input
                    type="text"
                    value={newBatch.timing}
                    onChange={(e) => setNewBatch({ ...newBatch, timing: e.target.value })}
                    placeholder="e.g. 06:00 AM - 07:00 AM"
                    className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Max Capacity</label>
                  <input
                    type="number"
                    value={newBatch.capacity}
                    onChange={(e) => setNewBatch({ ...newBatch, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddBatchModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Create Batch
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* View Assessment Modal */}
        {isViewAssessmentModalOpen && (
          <Modal
            isOpen={isViewAssessmentModalOpen}
            onClose={() => setIsViewAssessmentModalOpen(false)}
            title="Batch Assessment Overview"
          >
            <div className="space-y-3 text-xs text-gray-700 dark:text-gray-300">
              <p>No assessment records found for this batch.</p>
              <div className="flex justify-end pt-3">
                <Button variant="outline" onClick={() => setIsViewAssessmentModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-140px)] bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col font-sans">
      {/* Breadcrumb Header */}
      <div className="px-4 sm:px-6 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          <Link to="/admin/dashboard" className="hover:text-gray-900 dark:hover:text-gray-200">
            Home
          </Link>
          <span>/</span>
          <Link to="/admin/clients" className="hover:text-gray-900 dark:hover:text-gray-200">
            Clients
          </Link>
          <span>/</span>
          <span>{segmentCategoryName}</span>
          <span>/</span>
          <span className="text-[#ff5e28] font-semibold">{breadcrumbTitle}</span>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setIsBulkUploadModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-sm shadow-2xs hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
          >
            Import Member Details
          </button>
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-6 text-xs sm:text-sm font-bold">
        {isArchivedView ? (
          <>
            <div>
              <span className="text-gray-900 dark:text-white">Archived Total Members : </span>
              <span className="text-[#f59e0b] ml-1">{archivedTotalCount}</span>
            </div>
            <div>
              <span className="text-gray-900 dark:text-white">Active Members : </span>
              <span className="text-[#22c55e] ml-1">{archivedActiveCount}</span>
            </div>
            <div>
              <span className="text-gray-900 dark:text-white">Inactive Members : </span>
              <span className="text-[#ef4444] ml-1">{archivedInactiveCount}</span>
            </div>
          </>
        ) : (
          <>
            <div>
              <span className="text-gray-900 dark:text-white">Total Members : </span>
              <span className="text-[#f59e0b] ml-1">{totalCount}</span>
            </div>
            <div>
              <span className="text-gray-900 dark:text-white">Active Members : </span>
              <span className="text-[#22c55e] ml-1">{activeCount}</span>
            </div>
            <div>
              <span className="text-gray-900 dark:text-white">Inactive Members : </span>
              <span className="text-[#ef4444] ml-1">{inactiveCount}</span>
            </div>
          </>
        )}
      </div>

      {/* Action / Mailer Bar */}
      <div className="px-4 sm:px-6 py-3 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4">
        {/* Left Filter Dropdown */}
        <div className="flex items-center">
          <select
            value={clientCategoryFilter}
            onChange={(e) => handleCategoryFilterChange(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-[#22b0e6] rounded-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#22b0e6] cursor-pointer shadow-2xs min-w-[140px]"
          >
            <option value="All Clients">All Clients</option>
            <option value="Active Clients">Active Clients</option>
            <option value="Inactive Clients">Inactive Clients</option>
          </select>
        </div>

        {/* Right Mailer List Action */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
            <span>Mailer list</span>
            <select
              value={mailerList}
              onChange={(e) => setMailerList(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xs text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer min-w-[120px]"
            >
              <option value="">Select</option>
              <option value="Monthly Newsletter">Monthly Newsletter</option>
              <option value="Renewal Reminders">Renewal Reminders</option>
              <option value="Promotional Offers">Promotional Offers</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleAddToMailer}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-[#ff5e28] hover:bg-[#e04f1d] rounded-sm shadow-xs transition-colors cursor-pointer"
          >
            Add to Mailer
          </button>
        </div>
      </div>

      {/* Filter Icon & Communicate Bar */}
      <div className="relative px-4 sm:px-6 py-2.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => setIsFilterPopupOpen(!isFilterPopupOpen)}
            className={`p-1.5 border rounded-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
              isFilterPopupOpen
                ? 'border-orange-500 bg-orange-50/50 text-orange-600'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            title="Filter Settings"
          >
            <SlidersHorizontal size={14} />
          </button>

          {/* Floating Filter Popup Card */}
          {isFilterPopupOpen && (
            <div
              ref={filterPopupRef}
              className="absolute left-4 sm:left-6 top-11 z-50 w-[92vw] max-w-[620px] bg-white dark:bg-gray-900 border-2 border-orange-200 dark:border-orange-600/70 rounded-xs shadow-2xl p-5 text-xs text-gray-800 dark:text-gray-200 animate-in fade-in zoom-in-95 duration-150"
            >
              <form onSubmit={handleApplyFilterPopup} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  {/* Left Column */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-gray-700 dark:text-gray-300 font-normal w-28">Service</label>
                      <select
                        value={filterValues.service}
                        onChange={(e) => handleFilterChange('service', e.target.value)}
                        className="flex-1 px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-800 text-xs focus:ring-1 focus:ring-orange-500 cursor-pointer"
                      >
                        <option value="">Select</option>
                        <option value="Gym Membership">Gym Membership</option>
                        <option value="Personal Training">Personal Training</option>
                        <option value="Yoga Classes">Yoga Classes</option>
                        <option value="Crossfit">Crossfit</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <label className="text-gray-700 dark:text-gray-300 font-normal w-28">Age Group</label>
                      <select
                        value={filterValues.ageGroup}
                        onChange={(e) => handleFilterChange('ageGroup', e.target.value)}
                        className="flex-1 px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-800 text-xs focus:ring-1 focus:ring-orange-500 cursor-pointer"
                      >
                        <option value="">Select</option>
                        <option value="0-5 Years">0-5 Years</option>
                        <option value="5-8 Years">5-8 Years</option>
                        <option value="9-16 Years">9-16 Years</option>
                        <option value="17-20 Years">17-20 Years</option>
                        <option value="21-30 Years">21-30 Years</option>
                        <option value="31-40 Years">31-40 Years</option>
                        <option value="41-50 Years">41-50 Years</option>
                        <option value="51+ Years">51+ Years</option>
                        <option value="Not mentioned">Not mentioned</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <label className="text-gray-700 dark:text-gray-300 font-normal w-28">Member Manager</label>
                      <select
                        value={filterValues.memberManager}
                        onChange={(e) => handleFilterChange('memberManager', e.target.value)}
                        className="flex-1 px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-800 text-xs focus:ring-1 focus:ring-orange-500 cursor-pointer"
                      >
                        <option value="">Select</option>
                        <option value="Manager 1">Manager 1</option>
                        <option value="Manager 2">Manager 2</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <label className="text-gray-700 dark:text-gray-300 font-normal w-28">Lead Source</label>
                      <select
                        value={filterValues.leadSource}
                        onChange={(e) => handleFilterChange('leadSource', e.target.value)}
                        className="flex-1 px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-800 text-xs focus:ring-1 focus:ring-orange-500 cursor-pointer"
                      >
                        <option value="">Select</option>
                        <option value="Aktivity">Aktivity</option>
                        <option value="Corporate">Corporate</option>
                        <option value="e-mail">e-mail</option>
                        <option value="Facebook">Facebook</option>
                        <option value="Flyers/Banners">Flyers/Banners</option>
                        <option value="Google">Google</option>
                        <option value="Hoardings">Hoardings</option>
                        <option value="Justdial">Justdial</option>
                        <option value="Listing sites">Listing sites</option>
                        <option value="Magazine">Magazine</option>
                        <option value="Member App">Member App</option>
                        <option value="Missed call app">Missed call app</option>
                        <option value="Newspapers">Newspapers</option>
                        <option value="Others">Others</option>
                        <option value="Passing By">Passing By</option>
                        <option value="Phone">Phone</option>
                        <option value="Posters">Posters</option>
                        <option value="Promotional consultant">Promotional consultant</option>
                        <option value="Radio">Radio</option>
                        <option value="Referral">Referral</option>
                        <option value="Signboard">Signboard</option>
                        <option value="SMS">SMS</option>
                        <option value="Social media">Social media</option>
                        <option value="Staff">Staff</option>
                        <option value="TV">TV</option>
                        <option value="Walk-in">Walk-in</option>
                        <option value="Website">Website</option>
                        <option value="Word of mouth">Word of mouth</option>
                        <option value="SoActiv">SoActiv</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <label className="text-gray-700 dark:text-gray-300 font-normal w-28">Service Category</label>
                      <select
                        value={filterValues.serviceCategory}
                        onChange={(e) => handleFilterChange('serviceCategory', e.target.value)}
                        className="flex-1 px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-800 text-xs focus:ring-1 focus:ring-orange-500 cursor-pointer"
                      >
                        <option value="">Select</option>
                        <option value="General Membership">General Membership</option>
                        <option value="Personal Training">Personal Training</option>
                        <option value="Group Training">Group Training</option>
                        <option value="Nutrition Counselling">Nutrition Counselling</option>
                        <option value="Teachers Training">Teachers Training</option>
                        <option value="Workshops/Events">Workshops/Events</option>
                        <option value="Trial">Trial</option>
                        <option value="PT Trial">PT Trial</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <label className="text-gray-700 dark:text-gray-300 font-normal w-28">Behaviour Based</label>
                      <select
                        value={filterValues.behaviourBased}
                        onChange={(e) => handleFilterChange('behaviourBased', e.target.value)}
                        className="flex-1 px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-800 text-xs focus:ring-1 focus:ring-orange-500 cursor-pointer"
                      >
                        <option value="">Select</option>
                        <option value="Referrers">Referrers</option>
                        <option value="Irregular Member">Irregular Member</option>
                        <option value="One-Time Purchasers">One-Time Purchasers</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <label className="text-gray-700 dark:text-gray-300 font-normal w-28">Fitness Goal</label>
                      <select
                        value={filterValues.fitnessGoal}
                        onChange={(e) => handleFilterChange('fitnessGoal', e.target.value)}
                        className="flex-1 px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-800 text-xs focus:ring-1 focus:ring-orange-500 cursor-pointer"
                      >
                        <option value="">Select</option>
                        <option value="Weight Loss">Weight Loss</option>
                        <option value="Muscle Gain">Muscle Gain</option>
                        <option value="General Fitness">General Fitness</option>
                        <option value="Endurance">Endurance</option>
                      </select>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-gray-700 dark:text-gray-300 font-normal w-28">Service Variation</label>
                      <select
                        value={filterValues.serviceVariation}
                        onChange={(e) => handleFilterChange('serviceVariation', e.target.value)}
                        className="flex-1 px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-800 text-xs focus:ring-1 focus:ring-orange-500 cursor-pointer"
                      >
                        <option value="">Select</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Half Yearly">Half Yearly</option>
                        <option value="Annual">Annual</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <label className="text-gray-700 dark:text-gray-300 font-normal w-28">Sales Rep</label>
                      <select
                        value={filterValues.salesRep}
                        onChange={(e) => handleFilterChange('salesRep', e.target.value)}
                        className="flex-1 px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-800 text-xs focus:ring-1 focus:ring-orange-500 cursor-pointer"
                      >
                        <option value="">Select</option>
                        <option value="Rep 1">Rep 1</option>
                        <option value="Rep 2">Rep 2</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <label className="text-gray-700 dark:text-gray-300 font-normal w-28">General Trainer</label>
                      <select
                        value={filterValues.generalTrainer}
                        onChange={(e) => handleFilterChange('generalTrainer', e.target.value)}
                        className="flex-1 px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-800 text-xs focus:ring-1 focus:ring-orange-500 cursor-pointer"
                      >
                        <option value="">Select</option>
                        <option value="Trainer 1">Trainer 1</option>
                        <option value="Trainer 2">Trainer 2</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <label className="text-gray-700 dark:text-gray-300 font-normal w-28">Invoice</label>
                      <select
                        value={filterValues.invoice}
                        onChange={(e) => handleFilterChange('invoice', e.target.value)}
                        className="flex-1 px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-800 text-xs focus:ring-1 focus:ring-orange-500 cursor-pointer"
                      >
                        <option value="">Select</option>
                        <option value="Not billed Members">Not billed Members</option>
                        <option value="Expired Invoice">Expired Invoice</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <label className="text-gray-700 dark:text-gray-300 font-normal w-28">Purchase Type</label>
                      <select
                        value={filterValues.purchaseType}
                        onChange={(e) => handleFilterChange('purchaseType', e.target.value)}
                        className="flex-1 px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-800 text-xs focus:ring-1 focus:ring-orange-500 cursor-pointer"
                      >
                        <option value="">Select</option>
                        <option value="Memberships">Memberships</option>
                        <option value="Single Sessions/1 Day Pass">Single Sessions/1 Day Pass</option>
                        <option value="Events">Events</option>
                        <option value="Turfs">Turfs</option>
                        <option value="Store">Store</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <label className="text-gray-700 dark:text-gray-300 font-normal w-28">Custom Groups</label>
                      <select
                        value={filterValues.customGroups}
                        onChange={(e) => handleFilterChange('customGroups', e.target.value)}
                        className="flex-1 px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-800 text-xs focus:ring-1 focus:ring-orange-500 cursor-pointer"
                      >
                        <option value="">Select</option>
                        <option value="Batches">Batches</option>
                      </select>
                    </div>

                    <div className="flex items-start justify-between gap-2 pt-1">
                      <label className="text-gray-700 dark:text-gray-300 font-normal w-28 pt-0.5">Gender</label>
                      <div className="flex-1 flex items-center gap-3">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filterValues.genderMale}
                            onChange={(e) => handleFilterChange('genderMale', e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-gray-300 text-orange-500 focus:ring-orange-400 cursor-pointer"
                          />
                          <span>Male</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filterValues.genderFemale}
                            onChange={(e) => handleFilterChange('genderFemale', e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-gray-300 text-orange-500 focus:ring-orange-400 cursor-pointer"
                          />
                          <span>Female</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filterValues.genderNotSpecified}
                            onChange={(e) => handleFilterChange('genderNotSpecified', e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-gray-300 text-orange-500 focus:ring-orange-400 cursor-pointer"
                          />
                          <span>Not Specified</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-center pt-2">
                  <button
                    type="submit"
                    className="px-6 py-1.5 text-xs font-semibold text-white bg-[#ff5e28] hover:bg-[#e04f1d] rounded-xs shadow-xs transition-colors cursor-pointer"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
          <span>Communicate</span>
          <select
            value={communicateAction}
            onChange={(e) => handleCommunicate(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xs text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer min-w-[120px]"
          >
            <option value="">Select</option>
            <option value="Send Email">Send Email</option>
            <option value="Send SMS">Send SMS</option>
            <option value="Send WhatsApp">Send WhatsApp</option>
          </select>
        </div>
      </div>

      {/* Empty State or Table Content */}
      {segmentClients.length === 0 ? (
        <div className="px-4 sm:px-6 py-8 text-xs text-gray-800 dark:text-gray-200 font-normal">
          No results found.
        </div>
      ) : (
        <>
          {/* Pagination Controls Row */}
          <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-1.5 mx-auto sm:mx-0">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => {
                  setCurrentPage(1);
                  setPageInput('1');
                }}
                className="p-1 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                title="First Page"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1));
                  setPageInput(String(Math.max(1, currentPage - 1)));
                }}
                className="p-1 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="px-2 font-medium">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => {
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                  setPageInput(String(Math.min(totalPages, currentPage + 1)));
                }}
                className="p-1 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                title="Next Page"
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => {
                  setCurrentPage(totalPages);
                  setPageInput(String(totalPages));
                }}
                className="p-1 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                title="Last Page"
              >
                <ChevronsRight size={16} />
              </button>
            </div>

            <form onSubmit={handleJumpToPage} className="flex items-center gap-2">
              <input
                type="text"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                className="w-12 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              <button
                type="submit"
                className="px-3 py-1 bg-[#ff5e28] text-white font-semibold text-xs rounded-xs hover:bg-[#e04f1d] cursor-pointer"
              >
                Go
              </button>
            </form>
          </div>

          {/* Main Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-bold text-gray-800 dark:text-gray-200">
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        paginatedClients.length > 0 &&
                        selectedClients.length === paginatedClients.length
                      }
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4 min-w-[200px]">Profile</th>
                  <th className="py-3 px-4">Billing</th>
                  <th className="py-3 px-4">Service Card</th>
                  <th className="py-3 px-4 min-w-[130px]">Attendance ID/ Checkin</th>
                  <th className="py-3 px-4 min-w-[90px]">Call Log</th>
                  <th className="py-3 px-4 text-center">Info</th>
                  <th className="py-3 px-4">Appointment</th>
                  <th className="py-3 px-4">Training</th>
                  <th className="py-3 px-4">Archive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                {loading && clients.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-gray-400">
                      Loading members...
                    </td>
                  </tr>
                ) : paginatedClients.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-gray-400">
                      No members found in this segment.
                    </td>
                  </tr>
                ) : (
                  paginatedClients.map((client, index) => {
                    const isChecked = selectedClients.includes(client._id);
                    const attendanceId = client.attendanceId || String(2871 - index);

                    return (
                      <tr
                        key={client._id}
                        className={`transition-colors ${
                          isArchivedView || client.status === 'expired' || client.status === 'inactive' || (client.remainingDays !== undefined && client.remainingDays <= 0)
                            ? 'bg-[#fbeae7] dark:bg-rose-950/20 hover:bg-[#f6dad5]'
                            : 'hover:bg-gray-50/70 dark:hover:bg-gray-800/40'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelectClient(client._id)}
                            className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400 cursor-pointer"
                          />
                        </td>

                        {/* Profile */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                              {client.profileImage ? (
                                <img
                                  src={client.profileImage}
                                  alt={client.fullName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-[#1e293b] text-white flex items-center justify-center">
                                  <User size={22} className="text-gray-300" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-xs text-gray-900 dark:text-gray-100 hover:text-orange-600 cursor-pointer">
                                {client.fullName}
                              </div>
                              {client.contactNumber && (
                                <div className="text-[11px] text-gray-500">
                                  {client.contactNumber}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Billing */}
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/clients/payments/${client._id}`)}
                            className="text-[#ff5e28] hover:underline font-normal cursor-pointer"
                          >
                            Payments
                          </button>
                        </td>

                        {/* Service Card */}
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/clients/service-card/${client._id}`)}
                            className="text-[#ff5e28] hover:underline font-normal cursor-pointer"
                          >
                            View
                          </button>
                        </td>

                        {/* Attendance ID/ Checkin */}
                        <td className="py-3.5 px-4">
                          <span className="text-[#0284c7] font-normal">{attendanceId}</span>
                        </td>

                        {/* Call Log */}
                        <td className="py-3.5 px-4">
                          {isArchivedView ? (
                            <button
                              type="button"
                              onClick={() => setSelectedClientForCallLog(client)}
                              className="text-gray-900 dark:text-gray-100 font-bold text-base hover:scale-110 cursor-pointer"
                              title="Add Call Log"
                            >
                              +
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedClientForCallLog(client)}
                                className="text-[#ff5e28] font-bold text-sm hover:scale-110 cursor-pointer"
                                title="Add Call Log"
                              >
                                +
                              </button>
                              <div
                                className="w-5 h-5 rounded-full border border-[#0284c7] text-[#0284c7] text-[9px] font-bold flex items-center justify-center cursor-pointer hover:bg-blue-50"
                                title="Last Call Log"
                              >
                                LC
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Info */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedClientForInfo(client)}
                            className="w-5 h-5 rounded-full bg-black text-white inline-flex items-center justify-center cursor-pointer hover:opacity-80"
                            title="Member Information"
                          >
                            <span className="text-[10px] font-serif font-bold italic">i</span>
                          </button>
                        </td>

                        {/* Appointment */}
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/clients/appointments/${client._id}`)}
                            className="text-[#ff5e28] hover:underline font-normal cursor-pointer"
                          >
                            View
                          </button>
                        </td>

                        {/* Training */}
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/clients/training/${client._id}`)}
                            className="text-[#ff5e28] hover:underline font-normal cursor-pointer"
                          >
                            View
                          </button>
                        </td>

                        {/* Archive / UnArchive */}
                        <td className="py-3.5 px-4">
                          {isArchivedView ? (
                            <button
                              type="button"
                              onClick={() => handleUnArchive(client)}
                              className="text-[#ff5e28] hover:underline font-normal cursor-pointer"
                            >
                              UnArchive
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteConfirmation({
                                  isOpen: true,
                                  clientId: client._id,
                                  clientName: client.fullName,
                                })
                              }
                              className="text-[#ff5e28] hover:underline font-normal cursor-pointer"
                            >
                              Archive
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
        </>
      )}

      {/* Member Info Modal */}
      {selectedClientForInfo && (
        <Modal
          isOpen={!!selectedClientForInfo}
          onClose={() => setSelectedClientForInfo(null)}
          title={`Member Details - ${selectedClientForInfo.fullName}`}
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                {selectedClientForInfo.profileImage ? (
                  <img src={selectedClientForInfo.profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={28} className="text-gray-400" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">{selectedClientForInfo.fullName}</h3>
                <p className="text-gray-500">{selectedClientForInfo.email}</p>
                <p className="text-gray-500">{selectedClientForInfo.contactNumber}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
              <div>
                <span className="text-gray-500 block">Status:</span>
                <span className="font-semibold capitalize">{selectedClientForInfo.status || 'Active'}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Plan:</span>
                <span className="font-semibold capitalize">{selectedClientForInfo.plan || 'Basic'}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Attendance ID:</span>
                <span className="font-semibold">{selectedClientForInfo.attendanceId || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Timing:</span>
                <span className="font-semibold capitalize">{selectedClientForInfo.timing || 'Morning'}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Call Log Modal */}
      {selectedClientForCallLog && (
        <Modal
          isOpen={!!selectedClientForCallLog}
          onClose={() => setSelectedClientForCallLog(null)}
          title={`Call Log - ${selectedClientForCallLog.fullName}`}
        >
          <div className="space-y-3 text-xs">
            <p className="text-gray-600">Record a new call log entry for {selectedClientForCallLog.fullName}:</p>
            <textarea
              rows={3}
              placeholder="Enter call notes..."
              className="w-full p-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-orange-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedClientForCallLog(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  showToast('Call log saved', 'success');
                  setSelectedClientForCallLog(null);
                }}
              >
                Save Log
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Archive / Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-2xs flex items-start justify-center pt-24 sm:pt-28">
          <div className="bg-[#242424] text-white rounded-lg shadow-2xl p-5 max-w-sm w-full mx-4 border border-gray-700/60 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-xs sm:text-sm text-gray-300 font-medium mb-3">
              backstage.soactiv.com says
            </div>
            <div className="text-xs sm:text-sm text-white font-normal mb-6">
              Would you like to Archive this Member?
            </div>
            <div className="flex justify-end items-center gap-3">
              <button
                type="button"
                onClick={confirmDelete}
                className="px-5 py-1.5 bg-[#f43f5e] hover:bg-[#e11d48] text-white text-xs font-semibold rounded-md border border-pink-400/60 shadow-xs cursor-pointer transition-colors"
              >
                OK
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmation({ isOpen: false, clientId: '', clientName: '' })}
                className="px-4 py-1.5 bg-[#3f3f46] hover:bg-[#52525b] text-gray-200 text-xs font-semibold rounded-md transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={isBulkUploadModalOpen}
        onClose={() => setIsBulkUploadModalOpen(false)}
        onUpload={handleBulkUpload}
        type="client"
      />

      {/* Bulk Upload Results Modal */}
      {uploadResult && (
        <UploadResultsReport
          isOpen={isResultsModalOpen}
          onClose={() => {
            setIsResultsModalOpen(false);
            setUploadResult(null);
          }}
          result={uploadResult}
          type="client"
        />
      )}
    </div>
  );
};
