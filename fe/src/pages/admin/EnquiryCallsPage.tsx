import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useParams, useNavigate, Link } from 'react-router-dom';
import { useEnquiry, IEnquiry } from '../../hooks/useEnquiry';
import { useFollowUp } from '../../hooks/useFollowUp';
import { useStaff, Staff } from '../../hooks/useStaff';
import { useServices } from '../../hooks/useServices';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { X, Calendar, Phone, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export const EnquiryCallsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const routeParams = useParams<{ id?: string }>();
  const enquiryIdFromUrl =
    routeParams.id ||
    searchParams.get('id') ||
    searchParams.get('eqid') ||
    searchParams.get('memid') ||
    '';

  const { enquiries, getEnquiryById, updateEnquiry, loading: enquiriesLoading } = useEnquiry();
  const { followUps, fetchFollowUps, createFollowUp, updateFollowUp, loading: followUpLoading } = useFollowUp();
  const { staff: staffList, fetchAllStaff } = useStaff();
  const { services, fetchServices } = useServices();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [currentEnquiry, setCurrentEnquiry] = useState<IEnquiry | null>(null);
  const [isFetchingEnquiry, setIsFetchingEnquiry] = useState(false);

  // New Call Inline Form state matching image
  const [isAddCallActive, setIsAddCallActive] = useState(false);
  const [calledByStaffId, setCalledByStaffId] = useState('');
  const [callStatus, setCallStatus] = useState('');
  const [callTag, setCallTag] = useState<'hot' | 'warm' | 'cold' | ''>('');
  
  // Trial Scheduled specific state
  const [trialType, setTrialType] = useState('Trial Appointment');
  const [trialDateTime, setTrialDateTime] = useState('');
  const [trialService, setTrialService] = useState('');
  const [trialStaffId, setTrialStaffId] = useState('');
  const [moveToArchive, setMoveToArchive] = useState(false);
  const [notInterestedReason, setNotInterestedReason] = useState('');

  // Schedule follow-up state
  const [scheduleForStaffId, setScheduleForStaffId] = useState('');
  const [scheduleFollowUpDate, setScheduleFollowUpDate] = useState('');
  const [expectedDateOfClosure, setExpectedDateOfClosure] = useState('');
  const [closureAmount, setClosureAmount] = useState<number | string>(0);
  const [discussionDetails, setDiscussionDetails] = useState('');
  const [isSubmittingCall, setIsSubmittingCall] = useState(false);

  // Update scheduled follow-up inline state
  const [editingFollowUp, setEditingFollowUp] = useState<any | null>(null);
  const [isUpdatingFollowUp, setIsUpdatingFollowUp] = useState(false);

  // Contact history filters
  const [historyFilter, setHistoryFilter] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<{ status: string; from: string; to: string }>({
    status: 'All',
    from: '',
    to: '',
  });

  // Expanded notes toggle
  const [expandedNoteIds, setExpandedNoteIds] = useState<Record<string, boolean>>({});

  // Fetch initial staff and services list
  useEffect(() => {
    fetchAllStaff();
    fetchServices(undefined, true);
  }, [fetchAllStaff, fetchServices]);

  // Resolve current enquiry from ID or fallback to first available
  const loadEnquiry = useCallback(async () => {
    if (enquiryIdFromUrl) {
      // Find from list if loaded or fetch from API
      const foundInList = enquiries.find((e) => e._id === enquiryIdFromUrl);
      if (foundInList) {
        setCurrentEnquiry(foundInList);
      } else {
        setIsFetchingEnquiry(true);
        try {
          const res = await getEnquiryById(enquiryIdFromUrl);
          if (res) {
            setCurrentEnquiry(res);
          }
        } catch (err) {
          console.error('Failed to get enquiry by id:', err);
        } finally {
          setIsFetchingEnquiry(false);
        }
      }
    } else if (enquiries.length > 0 && !currentEnquiry) {
      setCurrentEnquiry(enquiries[0]);
    }
  }, [enquiryIdFromUrl, enquiries, getEnquiryById, currentEnquiry]);

  useEffect(() => {
    loadEnquiry();
  }, [loadEnquiry]);

  // When current enquiry changes, fetch its follow-ups
  const loadFollowUps = useCallback(async () => {
    if (currentEnquiry?._id) {
      await fetchFollowUps({ relatedId: currentEnquiry._id });
    }
  }, [currentEnquiry?._id, fetchFollowUps]);

  useEffect(() => {
    loadFollowUps();
  }, [loadFollowUps]);

  // Set default staff selections when staff loads
  useEffect(() => {
    if (staffList.length > 0 && !calledByStaffId) {
      const matchedStaff = staffList.find((s: Staff) => s.email === user?.email || (s.userId && s.userId === user?.id));
      if (matchedStaff) {
        setCalledByStaffId(matchedStaff._id);
      }
    }
  }, [staffList, user, calledByStaffId]);

  // Helper to format staff name
  const getStaffName = (staffField: any): string => {
    if (!staffField) return 'Unassigned';
    if (typeof staffField === 'object' && staffField.fullName) return staffField.fullName;
    if (typeof staffField === 'object' && staffField.fullname) return staffField.fullname;
    const staffId = typeof staffField === 'string' ? staffField : staffField._id;
    const found = staffList.find((s: Staff) => s._id === staffId);
    return found ? found.fullName : 'Staff';
  };

  // Format Date for display
  const formatDateTime = (dateStr?: string | Date | null) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      const secs = String(d.getSeconds()).padStart(2, '0');
      return `${day}-${month}-${year} ${hours}:${mins}:${secs}`;
    } catch {
      return String(dateStr);
    }
  };

  const formatDateOnly = (dateStr?: string | Date | null) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return String(dateStr);
    }
  };

  const NO_CONTACT_CALL_STATUSES = [
    'no answer',
    'busy tone',
    'switched off/ out of reach',
    'switched off / out of reach',
    'switched off',
    'out of reach',
    'invalid number',
  ];

  const isNoContactCall = (f: { status?: string; callStatus?: string | null }) => {
    if (f.status === 'failed' || f.status === 'cancelled') return true;
    if (!f.callStatus) return false;
    const normalized = f.callStatus.toLowerCase().trim();
    return NO_CONTACT_CALL_STATUSES.some((st) => normalized === st || normalized.includes(st));
  };

  // Filter follow-ups for current enquiry
  const enquiryFollowUps = useMemo(() => {
    if (!currentEnquiry?._id) return [];
    return followUps.filter((f) => String(f.relatedId) === String(currentEnquiry._id));
  }, [followUps, currentEnquiry]);

  // Calculate Real Summary Metrics (Zero dummy data)
  const metrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let upcoming = 0;
    let missed = 0;
    let contacted = 0;
    let noContact = 0;

    enquiryFollowUps.forEach((f) => {
      const sDate = f.scheduledDate ? new Date(f.scheduledDate) : null;
      if (f.status === 'completed') {
        if (isNoContactCall(f)) {
          noContact++;
        } else {
          contacted++;
        }
      } else if (f.status === 'failed' || f.status === 'cancelled') {
        noContact++;
      } else if (f.status === 'pending') {
        if (sDate && sDate < today) {
          missed++;
        } else {
          upcoming++;
        }
      }
    });

    const total = enquiryFollowUps.length;

    return {
      upcoming,
      missed,
      contacted,
      noContact,
      total,
    };
  }, [enquiryFollowUps]);

  // Apply contact history filters
  const filteredHistory = useMemo(() => {
    let list = [...enquiryFollowUps];

    if (appliedFilters.status !== 'All') {
      const s = appliedFilters.status.toLowerCase();
      if (s === 'scheduled' || s === 'upcoming') {
        list = list.filter((f) => f.status === 'pending');
      } else if (s === 'contacted' || s === 'completed') {
        list = list.filter((f) => f.status === 'completed' && !isNoContactCall(f));
      } else if (s === 'missed') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        list = list.filter((f) => f.status === 'pending' && f.scheduledDate && new Date(f.scheduledDate) < today);
      } else if (s === 'no contact') {
        list = list.filter((f) => isNoContactCall(f));
      }
    }

    if (appliedFilters.from) {
      const from = new Date(appliedFilters.from);
      from.setHours(0, 0, 0, 0);
      list = list.filter((f) => f.scheduledDate && new Date(f.scheduledDate) >= from);
    }

    if (appliedFilters.to) {
      const to = new Date(appliedFilters.to);
      to.setHours(23, 59, 59, 999);
      list = list.filter((f) => f.scheduledDate && new Date(f.scheduledDate) <= to);
    }

    // Sort by scheduledDate / createdAt desc
    list.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.scheduledDate).getTime();
      const timeB = new Date(b.createdAt || b.scheduledDate).getTime();
      return timeB - timeA;
    });

    return list;
  }, [enquiryFollowUps, appliedFilters]);

  // Handle Apply History Filter
  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedFilters({
      status: historyFilter,
      from: fromDate,
      to: toDate,
    });
  };

  // Handle Save New Call Log from inline form matching image
  const handleSaveNewCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEnquiry) {
      addToast('No enquiry selected', 'error');
      return;
    }
    if (!calledByStaffId) {
      addToast('Please select staff in Called by field', 'warning');
      return;
    }
    if (!callStatus || callStatus === 'Select') {
      addToast('Please select Call Status', 'warning');
      return;
    }
    if (!discussionDetails.trim()) {
      addToast('Please enter Discussion Details', 'warning');
      return;
    }

    setIsSubmittingCall(true);
    try {
      const targetDate = expectedDateOfClosure || new Date().toISOString().split('T')[0];
      const currentTime = new Date().toTimeString().substring(0, 5);

      const archiveStatuses = [
        'not interested',
        'did not put enquiry',
        'not relevant',
        'invalid number',
        'lost',
      ];
      const isArchiveSelected = Boolean(
        moveToArchive ||
        callStatus === 'Lost' ||
        (archiveStatuses.includes(callStatus.trim().toLowerCase()) && moveToArchive)
      );

      const newEnquiryStatus =
        callStatus === 'Sale'
          ? 'converted'
          : isArchiveSelected
          ? 'lost'
          : 'contacted';

      const fullDetails = notInterestedReason
        ? `[Reason: ${notInterestedReason}] ${discussionDetails.trim()}`
        : discussionDetails.trim();

      // 1. Create Follow-up in DB
      const res = await createFollowUp({
        assignedTo: calledByStaffId,
        type: 'enquiry',
        relatedId: currentEnquiry._id,
        relatedName: currentEnquiry.name,
        scheduledDate: targetDate,
        scheduledTime: currentTime,
        note: fullDetails,
        status: 'completed',
        scheduledBy: calledByStaffId,
        callStatus,
        callTag,
        leadSource: currentEnquiry.source || 'Walk-in',
        completionNotes: fullDetails,
      });

      // 2. Update Enquiry record with latest follow-up note, tag, status, budget
      await updateEnquiry(currentEnquiry._id, {
        followUpMessage: fullDetails,
        callTag,
        followUpDate: targetDate,
        status: newEnquiryStatus,
        budget: closureAmount ? String(closureAmount) : currentEnquiry.budget,
      });

      // 3. If schedule follow-up date is provided and NOT moving to archive, create the new scheduled follow-up
      if (scheduleFollowUpDate && !isArchiveSelected) {
        const [, fTime] = scheduleFollowUpDate.includes('T')
          ? scheduleFollowUpDate.split('T')
          : ['', '10:00'];

        await createFollowUp({
          assignedTo: scheduleForStaffId || calledByStaffId || (typeof currentEnquiry.assignedStaff === 'object' ? (currentEnquiry.assignedStaff as any)?._id : currentEnquiry.assignedStaff) || calledByStaffId,
          type: 'enquiry',
          relatedId: currentEnquiry._id,
          relatedName: currentEnquiry.name,
          scheduledDate: scheduleFollowUpDate,
          scheduledTime: fTime || '10:00',
          note: `Follow-up: ${fullDetails}`,
          status: 'pending',
          scheduledBy: calledByStaffId,
          leadSource: currentEnquiry.source || 'Walk-in',
        });
      }

      if (res.success) {
        if (isArchiveSelected) {
          addToast('Call logged & Enquiry moved to Archive successfully!', 'success');
          navigate('/admin/enquiries/archive');
          return;
        }

        addToast('Call log added successfully!', 'success');
        setDiscussionDetails('');
        setCallStatus('');
        setCallTag('');
        setTrialType('Trial Appointment');
        setTrialDateTime('');
        setTrialService('');
        setTrialStaffId('');
        setMoveToArchive(false);
        setNotInterestedReason('');
        setScheduleForStaffId('');
        setScheduleFollowUpDate('');
        setExpectedDateOfClosure('');
        setClosureAmount(0);
        setIsAddCallActive(false);
        // Reload follow-ups and enquiry
        await fetchFollowUps({ relatedId: currentEnquiry._id });
        const refreshed = await getEnquiryById(currentEnquiry._id);
        if (refreshed) setCurrentEnquiry(refreshed);
      }
    } catch (err: any) {
      console.error('Error saving call log:', err);
      addToast('Failed to save call log', 'error');
    } finally {
      setIsSubmittingCall(false);
    }
  };

  // Handle Save Follow-up Update from inline form matching image
  const handleSaveFollowUpUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFollowUp || !currentEnquiry) return;
    if (!callStatus || callStatus === 'Select') {
      addToast('Please select Call Status', 'warning');
      return;
    }
    if (!discussionDetails.trim()) {
      addToast('Please enter Discussion Details', 'warning');
      return;
    }

    setIsUpdatingFollowUp(true);
    try {
      const targetDate =
        expectedDateOfClosure ||
        (editingFollowUp.scheduledDate
          ? new Date(editingFollowUp.scheduledDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]);

      const archiveStatuses = [
        'not interested',
        'did not put enquiry',
        'not relevant',
        'invalid number',
        'lost',
      ];
      const isArchiveSelected = Boolean(
        moveToArchive ||
        callStatus === 'Lost' ||
        (archiveStatuses.includes(callStatus.trim().toLowerCase()) && moveToArchive)
      );

      const newEnquiryStatus =
        callStatus === 'Sale'
          ? 'converted'
          : isArchiveSelected
          ? 'lost'
          : 'contacted';

      const fullDetails = notInterestedReason
        ? `[Reason: ${notInterestedReason}] ${discussionDetails.trim()}`
        : discussionDetails.trim();

      // 1. Update Follow-up in DB
      await updateFollowUp(editingFollowUp._id, {
        status: 'completed',
        completionNotes: fullDetails,
        callStatus: callStatus,
        callTag: callTag || undefined,
        scheduledDate: targetDate,
        completedAt: new Date().toISOString(),
      });

      // 2. Update Enquiry record with latest follow-up message, tag, status, budget
      await updateEnquiry(currentEnquiry._id, {
        followUpMessage: fullDetails,
        callTag: callTag || undefined,
        followUpDate: targetDate,
        status: newEnquiryStatus,
        budget: closureAmount ? String(closureAmount) : currentEnquiry.budget,
      });

      // 3. If schedule follow-up date is provided and NOT moving to archive, create the new scheduled follow-up
      if (scheduleFollowUpDate && !isArchiveSelected) {
        const [, fTime] = scheduleFollowUpDate.includes('T')
          ? scheduleFollowUpDate.split('T')
          : ['', '10:00'];

        await createFollowUp({
          assignedTo: scheduleForStaffId || editingFollowUp.assignedTo || (typeof currentEnquiry.assignedStaff === 'object' ? (currentEnquiry.assignedStaff as any)?._id : currentEnquiry.assignedStaff),
          type: 'enquiry',
          relatedId: currentEnquiry._id,
          relatedName: currentEnquiry.name,
          scheduledDate: scheduleFollowUpDate,
          scheduledTime: fTime || '10:00',
          note: `Follow-up: ${fullDetails}`,
          status: 'pending',
          scheduledBy: editingFollowUp.scheduledBy || user?.id,
          leadSource: currentEnquiry.source || 'Walk-in',
        });
      }

      if (isArchiveSelected) {
        addToast('Call updated & Enquiry moved to Archive successfully!', 'success');
        navigate('/admin/enquiries/archive');
        return;
      }

      addToast('Call updated successfully!', 'success');
      setEditingFollowUp(null);
      setDiscussionDetails('');
      setCallStatus('');
      setCallTag('');
      setTrialType('Trial Appointment');
      setTrialDateTime('');
      setTrialService('');
      setTrialStaffId('');
      setMoveToArchive(false);
      setNotInterestedReason('');
      setScheduleForStaffId('');
      setScheduleFollowUpDate('');
      setExpectedDateOfClosure('');
      setClosureAmount(0);

      // Reload follow-ups and enquiry
      await fetchFollowUps({ relatedId: currentEnquiry._id });
      const refreshed = await getEnquiryById(currentEnquiry._id);
      if (refreshed) setCurrentEnquiry(refreshed);
    } catch (err) {
      console.error('Error updating follow up:', err);
      addToast('Failed to update follow-up', 'error');
    } finally {
      setIsUpdatingFollowUp(false);
    }
  };

  const toggleExpandNote = (id: string) => {
    setExpandedNoteIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (isFetchingEnquiry || (enquiriesLoading && !currentEnquiry)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="w-8 h-8 border-4 border-[#ff5722] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600 dark:text-gray-400 font-medium text-sm">Loading enquiry call history...</p>
      </div>
    );
  }

  if (!currentEnquiry) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4 text-center">
        <AlertCircle size={48} className="mx-auto text-amber-500" />
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">No Enquiry Selected</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please select an enquiry from the enquiries list or choose from the dropdown below.
        </p>
        <div className="max-w-xs mx-auto">
          <select
            onChange={(e) => {
              const selected = enquiries.find((enq) => enq._id === e.target.value);
              if (selected) setCurrentEnquiry(selected);
            }}
            className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">-- Choose an Enquiry --</option>
            {enquiries.map((enq) => (
              <option key={enq._id} value={enq._id}>
                {enq.name} ({enq.phone})
              </option>
            ))}
          </select>
        </div>
        <Link
          to="/admin/enquiries"
          className="inline-block mt-4 bg-[#ff5722] hover:bg-orange-600 text-white font-semibold text-xs px-4 py-2 rounded transition-colors"
        >
          Return to Enquiries List
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-2 sm:px-4 w-full max-w-full pb-16 font-sans">
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TOP HEADER & BREADCRUMB MATCHING IMAGE 2 */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center space-x-1.5 text-xs text-gray-600 dark:text-gray-400">
          <Link to="/admin/dashboard" className="hover:text-gray-900 dark:hover:text-white transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-[#ff5722] font-semibold">Enquiry calls</span>
        </div>

        {/* METRICS ROW MATCHING IMAGE 2: Upcoming : 1 Missed : 1 Contacted : 2 No Contact : 0 Total : 4 */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-gray-800 dark:text-gray-200 pt-1 pb-2 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Upcoming :</span>
            <span className="font-bold text-[#ff5722]">{metrics.upcoming}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Missed :</span>
            <span className="font-bold text-[#ff5722]">{metrics.missed}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Contacted :</span>
            <span className="font-bold text-[#ff5722]">{metrics.contacted}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-gray-700 dark:text-gray-300">No Contact :</span>
            <span className="font-bold text-[#ff5722]">{metrics.noContact}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Total :</span>
            <span className="font-bold text-[#ff5722]">{metrics.total}</span>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 2-COLUMN MAIN LAYOUT MATCHING IMAGE */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-sm border border-gray-200 dark:border-gray-800 shadow-2xs">
        {/* Section Header Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-gray-200 dark:border-gray-800 py-3 px-4 items-center">
          <div className="lg:col-span-6">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white tracking-wide uppercase">
              {currentEnquiry.name} - {currentEnquiry.phone}
            </h2>
          </div>
          <div className="lg:col-span-6 text-center">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-wide">
              Contact History
            </h3>
          </div>
        </div>

        {/* Panels Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* LEFT PANEL: INLINE FORM (ADD NEW CALL OR UPDATE SCHEDULED CALL) OR CENTERED BUTTON */}
          <div className="lg:col-span-6 p-6 lg:border-r border-gray-200 dark:border-gray-800 flex flex-col justify-center min-h-[350px]">
            {isAddCallActive || editingFollowUp ? (
              <form onSubmit={editingFollowUp ? handleSaveFollowUpUpdate : handleSaveNewCall} className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  {/* Left sub-column */}
                  <div className="w-full md:w-[310px] shrink-0 space-y-4">
                    {/* Schedule for* (when updating) or Called by* (when adding new call) */}
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[13px] text-gray-800 dark:text-gray-200 font-normal shrink-0">
                        {editingFollowUp ? 'Schedule for' : 'Called by'}
                        <span className="text-red-500">*</span>
                      </label>
                      {editingFollowUp ? (
                        <select
                          disabled
                          value={typeof editingFollowUp.assignedTo === 'object' ? (editingFollowUp.assignedTo as any)?._id : editingFollowUp.assignedTo}
                          className="w-[175px] h-9 text-xs border border-gray-300 dark:border-gray-600 rounded-md px-3 bg-gray-200/80 dark:bg-gray-700 text-gray-700 dark:text-gray-200 cursor-not-allowed select-none font-medium"
                        >
                          <option value={typeof editingFollowUp.assignedTo === 'object' ? (editingFollowUp.assignedTo as any)?._id : editingFollowUp.assignedTo}>
                            {getStaffName(editingFollowUp.assignedTo)}
                          </option>
                        </select>
                      ) : (
                        <select
                          value={calledByStaffId}
                          onChange={(e) => setCalledByStaffId(e.target.value)}
                          required
                          className="w-[175px] h-9 text-xs border border-gray-300 dark:border-gray-600 rounded-md px-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#ff5722]"
                        >
                          <option value="">Select</option>
                          {staffList.map((s: Staff) => (
                            <option key={s._id} value={s._id}>
                              {s.fullName}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Call Status* */}
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[13px] text-gray-800 dark:text-gray-200 font-normal shrink-0">
                        Call Status<span className="text-red-500">*</span>
                      </label>
                      <select
                        value={callStatus}
                        onChange={(e) => setCallStatus(e.target.value)}
                        required
                        className="w-[175px] h-9 text-xs border border-gray-300 dark:border-gray-600 rounded-md px-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#ff5722]"
                      >
                        <option value="">Select</option>
                        <option value="Enquiry">Enquiry</option>
                        <option value="Trial Scheduled">Trial Scheduled</option>
                        <option value="Enquiry follow-up">Enquiry follow-up</option>
                        <option value="Busy Tone">Busy Tone</option>
                        <option value="Sale">Sale</option>
                        <option value="Switched Off/ Out of Reach">Switched Off/ Out of Reach</option>
                        <option value="No answer">No answer</option>
                        <option value="Future Prospect">Future Prospect</option>
                        <option value="Did not Put Enquiry">Did not Put Enquiry</option>
                        <option value="Not Interested">Not Interested</option>
                        <option value="Not Relevant">Not Relevant</option>
                        <option value="Invalid number">Invalid number</option>
                      </select>
                    </div>

                    {/* Move to Archive & Closed Call text for Did not Put Enquiry, Not Relevant, and Invalid number */}
                    {(callStatus === 'Did not Put Enquiry' || callStatus === 'Not Relevant' || callStatus === 'Invalid number') && (
                      <div className="space-y-3 pt-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="w-[110px]" />
                          <div className="w-[175px] flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="moveToArchive"
                              checked={moveToArchive}
                              onChange={(e) => setMoveToArchive(e.target.checked)}
                              className="w-3.5 h-3.5 text-[#ff5722] rounded border-gray-300 focus:ring-[#ff5722] accent-[#ff5722] cursor-pointer"
                            />
                            <label htmlFor="moveToArchive" className="text-xs text-gray-700 dark:text-gray-300 font-normal cursor-pointer select-none">
                              Move to Archive
                            </label>
                          </div>
                        </div>

                        <div className="text-[12px] leading-tight text-red-500 font-normal">
                          On submission this<br />call will be closed.
                        </div>
                      </div>
                    )}

                    {/* Not Interested Reason & Move to Archive for Not Interested */}
                    {callStatus === 'Not Interested' && (
                      <div className="space-y-3 pt-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-[13px] text-gray-800 dark:text-gray-200 font-normal leading-tight shrink-0">
                            Not Interested<br />Reason<span className="text-red-500">*</span>
                          </label>
                          <select
                            value={notInterestedReason}
                            onChange={(e) => setNotInterestedReason(e.target.value)}
                            required={callStatus === 'Not Interested'}
                            className="w-[175px] h-9 text-xs border border-gray-300 dark:border-gray-600 rounded-md px-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#ff5722]"
                          >
                            <option value="">Select</option>
                            <option value="Joined some other fitness studio/gym">Joined some other fitness studio/gym</option>
                            <option value="Relocated to another city">Relocated to another city</option>
                            <option value="Fee is too high">Fee is too high</option>
                            <option value="Didn't like the service">Didn't like the service</option>
                            <option value="Others">Others</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="w-[110px]" />
                          <div className="w-[175px] flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="moveToArchiveNotInterested"
                              checked={moveToArchive}
                              onChange={(e) => setMoveToArchive(e.target.checked)}
                              className="w-3.5 h-3.5 text-[#ff5722] rounded border-gray-300 focus:ring-[#ff5722] accent-[#ff5722] cursor-pointer"
                            />
                            <label htmlFor="moveToArchiveNotInterested" className="text-xs text-gray-700 dark:text-gray-300 font-normal cursor-pointer select-none">
                              Move to Archive
                            </label>
                          </div>
                        </div>

                        <div className="text-[12px] leading-tight text-red-500 font-normal">
                          On submission this<br />call will be closed.
                        </div>
                      </div>
                    )}

                    {/* Trial Scheduled Specific Fields matching image */}
                    {callStatus === 'Trial Scheduled' && (
                      <div className="space-y-3.5 pt-1">
                        {/* Radio Options: Trial Appointment, Trial Class, Trial Session */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-4 text-xs text-gray-800 dark:text-gray-200">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                name="trialType"
                                value="Trial Appointment"
                                checked={trialType === 'Trial Appointment'}
                                onChange={(e) => setTrialType(e.target.value)}
                                className="text-[#ff5722] focus:ring-[#ff5722] accent-[#ff5722]"
                              />
                              <span className="text-[12px] font-medium">Trial Appointment</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                name="trialType"
                                value="Trial Class"
                                checked={trialType === 'Trial Class'}
                                onChange={(e) => setTrialType(e.target.value)}
                                className="text-[#ff5722] focus:ring-[#ff5722] accent-[#ff5722]"
                              />
                              <span className="text-[12px] font-medium">Trial Class</span>
                            </label>
                          </div>
                          <div className="flex items-center text-xs text-gray-800 dark:text-gray-200">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                name="trialType"
                                value="Trial Session"
                                checked={trialType === 'Trial Session'}
                                onChange={(e) => setTrialType(e.target.value)}
                                className="text-[#ff5722] focus:ring-[#ff5722] accent-[#ff5722]"
                              />
                              <span className="text-[12px] font-medium">Trial Session</span>
                            </label>
                          </div>
                        </div>

                        {/* Date & Time */}
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-[13px] text-gray-800 dark:text-gray-200 font-normal shrink-0">
                            Date & Time
                          </label>
                          <input
                            type="datetime-local"
                            value={trialDateTime}
                            onChange={(e) => setTrialDateTime(e.target.value)}
                            className="w-[175px] h-9 text-xs border border-gray-300 dark:border-gray-600 rounded-md px-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#ff5722]"
                          />
                        </div>

                        {/* Service * */}
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-[13px] text-gray-800 dark:text-gray-200 font-normal shrink-0">
                            Service <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={trialService}
                            onChange={(e) => setTrialService(e.target.value)}
                            className="w-[175px] h-9 text-xs border border-gray-300 dark:border-gray-600 rounded-md px-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#ff5722]"
                          >
                            <option value="">Select</option>
                            {services
                              .filter((s) => s.status !== false)
                              .map((s) => (
                                <option key={s._id} value={s.name}>
                                  {s.name}
                                </option>
                              ))}
                            {services.filter((s) => s.status !== false).length === 0 && (
                              <>
                                <option value="Gym Membership">Gym Membership</option>
                                <option value="Personal Training">Personal Training</option>
                                <option value="Yoga Class">Yoga Class</option>
                                <option value="Zumba Fitness">Zumba Fitness</option>
                                <option value="CrossFit">CrossFit</option>
                              </>
                            )}
                          </select>
                        </div>

                        {/* Staff Name */}
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-[13px] text-gray-800 dark:text-gray-200 font-normal shrink-0">
                            Staff Name
                          </label>
                          <select
                            value={trialStaffId}
                            onChange={(e) => setTrialStaffId(e.target.value)}
                            className="w-[175px] h-9 text-xs border border-gray-300 dark:border-gray-600 rounded-md px-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#ff5722]"
                          >
                            <option value="">Select</option>
                            {staffList.map((s: Staff) => (
                              <option key={s._id} value={s._id}>
                                {s.fullName}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Schedule follow-up section when Call Status is Enquiry, Trial Scheduled, Enquiry follow-up, Busy Tone, etc. */}
                    {(['Enquiry', 'Trial Scheduled', 'Enquiry follow-up', 'Busy Tone', 'Switched Off/ Out of Reach', 'No answer', 'Future Prospect'].includes(callStatus)) && (
                      <div className="space-y-4 pt-1">
                        <div className="text-[13px] font-bold text-gray-900 dark:text-white">
                          Schedule follow-up
                        </div>

                        {/* Schedule for */}
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-[13px] text-gray-800 dark:text-gray-200 font-normal shrink-0">
                            Schedule for{callStatus === 'Enquiry follow-up' && <span className="text-red-500">*</span>}
                          </label>
                          <select
                            value={scheduleForStaffId}
                            onChange={(e) => setScheduleForStaffId(e.target.value)}
                            required={callStatus === 'Enquiry follow-up'}
                            className="w-[175px] h-9 text-xs border border-gray-300 dark:border-gray-600 rounded-md px-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#ff5722]"
                          >
                            <option value="">Select</option>
                            {staffList.map((s: Staff) => (
                              <option key={s._id} value={s._id}>
                                {s.fullName}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Date & Time */}
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-[13px] text-gray-800 dark:text-gray-200 font-normal shrink-0">
                            Date & Time{callStatus === 'Enquiry follow-up' && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="datetime-local"
                            required={callStatus === 'Enquiry follow-up'}
                            value={scheduleFollowUpDate}
                            onChange={(e) => setScheduleFollowUpDate(e.target.value)}
                            className="w-[175px] h-9 text-xs border border-gray-300 dark:border-gray-600 rounded-md px-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#ff5722]"
                          />
                        </div>
                      </div>
                    )}

                    {/* Cold, Warm, Hot Tags matching Image 1 */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-[110px]" />
                      <div className="w-[175px] flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCallTag((prev) => (prev === 'cold' ? '' : 'cold'))}
                          className={`flex-1 py-1 text-center font-bold text-xs rounded-md border-2 transition-all cursor-pointer ${
                            callTag === 'cold'
                              ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                              : 'border-blue-500 text-blue-600 hover:bg-blue-50/50 bg-white dark:bg-gray-800'
                          }`}
                        >
                          Cold
                        </button>
                        <button
                          type="button"
                          onClick={() => setCallTag((prev) => (prev === 'warm' ? '' : 'warm'))}
                          className={`flex-1 py-1 text-center font-bold text-xs rounded-md border-2 transition-all cursor-pointer ${
                            callTag === 'warm'
                              ? 'border-amber-500 bg-amber-500 text-white shadow-xs'
                              : 'border-amber-500 text-amber-600 hover:bg-amber-50/50 bg-white dark:bg-gray-800'
                          }`}
                        >
                          Warm
                        </button>
                        <button
                          type="button"
                          onClick={() => setCallTag((prev) => (prev === 'hot' ? '' : 'hot'))}
                          className={`flex-1 py-1 text-center font-bold text-xs rounded-md border-2 transition-all cursor-pointer ${
                            callTag === 'hot'
                              ? 'border-red-600 bg-red-600 text-white shadow-xs'
                              : 'border-red-500 text-red-600 hover:bg-red-50/50 bg-white dark:bg-gray-800'
                          }`}
                        >
                          Hot
                        </button>
                      </div>
                    </div>

                    {/* Expected Date of Closure */}
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[13px] text-gray-800 dark:text-gray-200 font-normal leading-tight shrink-0">
                        Expected Date<br />of Closure
                      </label>
                      <input
                        type="date"
                        value={expectedDateOfClosure}
                        onChange={(e) => setExpectedDateOfClosure(e.target.value)}
                        className="w-[175px] h-9 text-xs border border-gray-300 dark:border-gray-600 rounded-md px-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#ff5722]"
                      />
                    </div>

                    {/* Amount */}
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[13px] text-gray-800 dark:text-gray-200 font-normal shrink-0">
                        Amount
                      </label>
                      <input
                        type="number"
                        value={closureAmount}
                        onChange={(e) => setClosureAmount(e.target.value)}
                        className="w-[175px] h-9 text-xs border border-gray-300 dark:border-gray-600 rounded-md px-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#ff5722]"
                      />
                    </div>
                  </div>

                  {/* Right sub-column: Discussion Details* */}
                  <div className="flex-1 w-full space-y-1.5 self-stretch">
                    <label className="text-[13px] text-gray-800 dark:text-gray-200 font-normal block">
                      Discussion Details<span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={9}
                      maxLength={1800}
                      required
                      value={discussionDetails}
                      onChange={(e) => setDiscussionDetails(e.target.value)}
                      placeholder="Maximum 1800 characters"
                      className="w-full h-[195px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 rounded-md p-3 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#ff5722] placeholder-gray-400 resize-none"
                    />
                  </div>
                </div>

                {/* Buttons: Submit & Cancel matching Image 1 */}
                <div className="flex items-center gap-3.5 pt-1">
                  <button
                    type="submit"
                    disabled={isSubmittingCall || isUpdatingFollowUp}
                    className="bg-[#ff5722] hover:bg-[#f4511e] text-white font-bold text-sm px-8 py-2 rounded shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingCall || isUpdatingFollowUp ? 'Submitting...' : 'Submit'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddCallActive(false);
                      setEditingFollowUp(null);
                      setDiscussionDetails('');
                      setCallTag('');
                      setCallStatus('');
                      setTrialType('Trial Appointment');
                      setTrialDateTime('');
                      setTrialService('');
                      setTrialStaffId('');
                      setMoveToArchive(false);
                      setNotInterestedReason('');
                      setScheduleForStaffId('');
                      setScheduleFollowUpDate('');
                      setExpectedDateOfClosure('');
                      setClosureAmount(0);
                    }}
                    className="bg-[#ff5722] hover:bg-[#f4511e] text-white font-bold text-sm px-8 py-2 rounded shadow-2xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              /* Centered Add new call button view */
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-2">
                <button
                  type="button"
                  onClick={() => setIsAddCallActive(true)}
                  className="bg-[#ff5722] hover:bg-orange-600 text-white font-semibold text-xs px-6 py-2 rounded shadow-2xs transition-colors cursor-pointer"
                >
                  Add new call
                </button>
                <p className="text-[11.5px] text-gray-700 dark:text-gray-400 font-medium">
                  (On adding new call, scheduled calls will not be updated)
                </p>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: CONTACT HISTORY */}
          <div className="lg:col-span-6 p-4 space-y-4">
            {/* Filter Bar matching Image */}
            <form onSubmit={handleApplyFilter} className="flex flex-wrap items-center gap-2 text-xs pb-2 border-b border-gray-100 dark:border-gray-800">
              {/* Dropdown status filter */}
              <select
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#ff5722]"
              >
                <option value="All">All</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Contacted">Contacted</option>
                <option value="Missed">Missed</option>
                <option value="No Contact">No Contact</option>
              </select>

              {/* From Date */}
              <div className="flex items-center gap-1">
                <span className="text-gray-600 dark:text-gray-400">From:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 rounded px-2 py-0.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#ff5722]"
                />
              </div>

              {/* To Date */}
              <div className="flex items-center gap-1">
                <span className="text-gray-600 dark:text-gray-400">To:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 rounded px-2 py-0.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#ff5722]"
                />
              </div>

              {/* Orange Go Button */}
              <button
                type="submit"
                className="bg-[#ff5722] hover:bg-orange-600 text-white font-semibold text-xs px-3 py-1 rounded transition-colors cursor-pointer"
              >
                Go
              </button>
            </form>

          {/* Cards List */}
          <div className="space-y-4 pt-1">
            {/* Follow-up Cards */}
            {filteredHistory.map((item) => {
              const isScheduledOnly = item.status === 'pending';
              const isExpanded = !!expandedNoteIds[item._id];
              const noteText = item.completionNotes || item.note || '';

              const scheduledByName = getStaffName(item.scheduledBy || item.userId);
              const forStaffName = getStaffName(item.assignedTo);
              const updatedByName = getStaffName(item.completedBy || item.scheduledBy || item.assignedTo);
              const isUpdatingThis = editingFollowUp?._id === item._id;

              return (
                <div
                  key={item._id}
                  className="border-b border-gray-200 dark:border-gray-700 pb-4 text-xs space-y-1.5"
                >
                  {/* Row 1: Staff headers & Update button */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-gray-700 dark:text-gray-300">
                      <div>
                        Scheduled by: <span className="text-sky-600 dark:text-sky-400 font-medium">{scheduledByName}</span>
                      </div>
                      <div>
                        for: <span className="text-sky-600 dark:text-sky-400 font-medium">{forStaffName}</span>
                      </div>
                      {!isScheduledOnly && (
                        <div>
                          Updated by: <span className="text-sky-600 dark:text-sky-400 font-medium">{updatedByName}</span>
                        </div>
                      )}
                    </div>

                    {/* Update button / Updating... state for pending items */}
                    {isScheduledOnly && (
                      isUpdatingThis ? (
                        <span className="italic text-gray-800 dark:text-gray-200 font-medium text-xs shrink-0">
                          Updating...
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFollowUp(item);
                            setIsAddCallActive(false);
                            setDiscussionDetails(item.completionNotes || item.note || '');
                            setCallStatus(item.callStatus || '');
                            setCallTag((item.callTag as any) || '');
                            setExpectedDateOfClosure('');
                            setClosureAmount(0);
                          }}
                          className="bg-[#ff5722] hover:bg-orange-600 text-white font-semibold text-[11px] px-2.5 py-0.5 rounded transition-colors cursor-pointer shrink-0"
                        >
                          Update
                        </button>
                      )
                    )}
                  </div>

                  {/* Row 2: Schedule datetime, Call status, Lead source */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-gray-600 dark:text-gray-400 text-[11px]">
                    {item.leadSource && (
                      <div>
                        Lead source : <span className="font-semibold text-gray-800 dark:text-gray-200">{item.leadSource}</span>
                      </div>
                    )}
                    <div>
                      Schedule: <span className="font-semibold text-gray-800 dark:text-gray-200">{formatDateTime(item.scheduledDate)}</span>
                    </div>
                    <div>
                      Call Status: <span className="font-semibold text-gray-800 dark:text-gray-200">{item.callStatus || (item.status === 'completed' ? 'Enquiry follow-up' : 'Scheduled')}</span>
                    </div>
                  </div>

                  {/* Shaded Note Box matching Image 2 */}
                  {noteText && !isScheduledOnly && (
                    <div className="bg-gray-100 dark:bg-gray-800/80 rounded px-3 py-2 text-xs font-semibold text-gray-800 dark:text-gray-200 tracking-wide">
                      <p className={`uppercase ${!isExpanded && noteText.length > 90 ? 'line-clamp-2' : ''}`}>
                        {noteText}
                      </p>
                      {noteText.length > 90 && (
                        <div className="text-right pt-1">
                          <button
                            type="button"
                            onClick={() => toggleExpandNote(item._id)}
                            className="text-[#ff5722] hover:underline font-semibold text-[11px] cursor-pointer"
                          >
                            {isExpanded ? 'View Less' : 'View More'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Updated timestamp */}
                  {!isScheduledOnly && (
                    <div className="text-[10.5px] text-gray-500 dark:text-gray-400">
                      Updated Date & Time: {formatDateTime(item.completedAt || item.updatedAt || item.createdAt)}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Bottom Card: Initial Enquiry Creation Card matching Image 2 */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 text-xs space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-block px-3 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-gray-200 text-xs font-semibold">
                  Enquiry
                </span>
                <div className="text-gray-700 dark:text-gray-300">
                  Staff:<span className="font-semibold text-gray-900 dark:text-white ml-1">{getStaffName(currentEnquiry.assignedStaff)}</span>
                </div>
                <div className="text-gray-700 dark:text-gray-300">
                  Lead source : <span className="font-semibold text-gray-900 dark:text-white">{currentEnquiry.source || 'Walk-in'}</span>
                </div>
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-[11px] pt-1">
                Schedule: <span className="font-semibold text-gray-800 dark:text-gray-200">{formatDateOnly(currentEnquiry.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default EnquiryCallsPage;
