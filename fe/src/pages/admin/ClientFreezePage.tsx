import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Pencil, Plus } from 'lucide-react';
import { useClient } from '../../hooks/useClient';
import { useToast } from '../../contexts/ToastContext';

type UnfreezeMode = 'completely' | 'till_date';

interface FreezeRecord {
  id?: string;
  _id?: string;
  freezeStartDate: string;
  freezeTillDate: string;
  numberOfDays: number;
  reason: string;
  status: string;
  createdAt?: string;
}

const formatDateToDisplay = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

// Convert "DD-MM-YYYY" or ISO to "YYYY-MM-DD" for <input type="date">
const toInputDateValue = (dateStr: string): string => {
  if (!dateStr) return '';
  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr.slice(0, 10);
  // If DD-MM-YYYY
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  // Try parsing as date
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return '';
};

export const ClientFreezePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clients, updateClient } = useClient();
  const { addToast } = useToast();
  const showToast = addToast;

  const memId = id || searchParams.get('memid') || '';

  const client = useMemo(() => {
    if (!memId) return clients[0] || null;
    return clients.find((c) => c._id === memId) || clients[0] || null;
  }, [clients, memId]);

  const [localFreezes, setLocalFreezes] = useState<FreezeRecord[]>([]);

  // editingIndex: which row is being edited; null = adding new
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  // showForm: whether to show the inline form (for new or edit)
  const [showForm, setShowForm] = useState<boolean>(false);

  const [freezeStartDate, setFreezeStartDate] = useState<string>('');
  const [freezeTillDate, setFreezeTillDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // Edit-mode unfreeze options
  const [unfreezeMode, setUnfreezeMode] = useState<UnfreezeMode>('completely');
  const [unfreezeTillDate, setUnfreezeTillDate] = useState<string>('');

  // Sync freezes from server
  useEffect(() => {
    if (client?.freezes && client.freezes.length > 0) {
      setLocalFreezes(client.freezes);
    } else if (client?.freezeInfo) {
      setLocalFreezes([client.freezeInfo]);
    }
  }, [client]);

  const serviceVariationName = useMemo(() => {
    if (client?.invoice?.items?.[0]?.duration) return client.invoice.items[0].duration;
    if (client?.packagePrice && client.packagePrice <= 2500) return '1 Month';
    if (client?.endDate && client?.startDate) {
      const diffMs = new Date(client.endDate).getTime() - new Date(client.startDate).getTime();
      const diffDays = Math.round(diffMs / (1000 * 3600 * 24));
      if (diffDays <= 35) return '1 Month';
      if (diffDays <= 65) return '2 Months';
      if (diffDays <= 95) return '3 Months';
      if (diffDays <= 185) return '6 Months';
      if (diffDays >= 300) return '12 Months';
    }
    return '12 Months';
  }, [client]);

  const numberOfDays = useMemo(() => {
    if (!freezeStartDate || !freezeTillDate) return 0;
    const start = new Date(freezeStartDate);
    const end = new Date(freezeTillDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 3600 * 24));
    return Math.max(0, diffDays);
  }, [freezeStartDate, freezeTillDate]);

  // Days between freeze start date and the chosen unfreeze-till date (edit mode)
  const unfreezeDays = useMemo(() => {
    if (!freezeStartDate || !unfreezeTillDate) return 0;
    const start = new Date(freezeStartDate);
    const end = new Date(unfreezeTillDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 3600 * 24));
    return Math.max(0, diffDays);
  }, [freezeStartDate, unfreezeTillDate]);

  const tabs = [
    'Profile',
    'Service Card',
    'Payments',
    'Call Log',
    'Appointments',
    'Referrals',
    'Family Member',
    'Store',
    'Documents',
    'Attendance',
    'Trial History',
    'Training',
    'Terms & Conditions',
  ];

  const handleTabClick = (tab: string) => {
    if (tab === 'Profile' && client) {
      navigate(`/admin/client-form/${client._id}`);
    } else if (tab === 'Service Card' && client) {
      navigate(`/admin/clients/service-card/${client._id}`);
    } else if (tab === 'Payments' && client) {
      navigate(`/admin/clients/payments/${client._id}`);
    } else if (tab === 'Appointments' && client) {
      navigate(`/admin/clients/appointments/${client._id}`);
    } else if (tab === 'Training' && client) {
      navigate(`/admin/clients/training/${client._id}`);
    }
  };

  // Click edit pencil → open inline form above table pre-filled (edit/unfreeze style)
  const handleEditRecord = (record: FreezeRecord, index: number) => {
    setEditingIndex(index);
    setFreezeStartDate(toInputDateValue(record.freezeStartDate));
    setFreezeTillDate(toInputDateValue(record.freezeTillDate));
    setReason(record.reason);
    setUnfreezeMode('completely');
    // Pre-fill unfreeze till date with the record's existing freeze till date
    setUnfreezeTillDate(toInputDateValue(record.freezeTillDate));
    setShowForm(true);
  };

  // Click "+ Add Freeze" → open blank inline form above table
  const handleNewFreeze = () => {
    setEditingIndex(null);
    setFreezeStartDate('');
    setFreezeTillDate('');
    setReason('');
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingIndex(null);
    setFreezeStartDate('');
    setFreezeTillDate('');
    setReason('');
    setUnfreezeMode('completely');
    setUnfreezeTillDate('');
  };

  const handleFreezeWithExtension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) {
      showToast('Member not found', 'error');
      return;
    }

    // ── EDIT MODE: Unfreeze completely ──────────────────────────────────────
    if (editingIndex !== null && unfreezeMode === 'completely') {
      setIsSubmitting(true);
      try {
        const currentFreezes: FreezeRecord[] = localFreezes.length > 0 ? localFreezes : (client.freezes || []);
        const unfreezedRecord = { ...currentFreezes[editingIndex], status: 'Unfreeze', numberOfDays: 'Unfreezed completely' as any };
        const updatedFreezes = currentFreezes.map((rec, idx) =>
          idx === editingIndex ? unfreezedRecord : rec
        );
        setLocalFreezes(updatedFreezes);
        // Also update freezeInfo so service card hides "Freeze Active Till"
        const updatedFreezeInfo = client.freezeInfo
          ? { ...client.freezeInfo, status: 'Unfreeze' }
          : unfreezedRecord;

        const currentServiceStart = client.invoice?.items?.[0]?.startDate || client.startDate || new Date().toISOString();
        const currentServiceExpiry = client.invoice?.items?.[0]?.expiryDate || client.endDate || new Date().toISOString();
        const dateChangeEntry = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          fromDate: currentServiceStart,
          toDate: currentServiceExpiry,
          document: '-',
          reason: `${currentFreezes[editingIndex]?.reason || 'Travel'}-Unfreezed completely`,
          createdAt: new Date().toISOString(),
        };
        const updatedDateChanges = [dateChangeEntry, ...(client.dateChanges || [])];

        await updateClient(client._id, {
          freezes: updatedFreezes,
          freezeInfo: updatedFreezeInfo,
          dateChanges: updatedDateChanges,
        });
        showToast('Freeze edited successfully', 'success');
        // Reset to blank add-new form (keep form open)
        setEditingIndex(null);
        setFreezeStartDate('');
        setFreezeTillDate('');
        setReason('');
        setUnfreezeMode('completely');
        setUnfreezeTillDate('');
        setShowForm(true);
      } catch (err: any) {
        showToast(err?.message || 'Failed to unfreeze membership', 'error');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }


    // ── EDIT MODE: Unfreeze till date ───────────────────────────────────────
    if (editingIndex !== null && unfreezeMode === 'till_date') {
      if (!unfreezeTillDate) {
        showToast('Please select Freeze Till Date', 'error');
        return;
      }
      setIsSubmitting(true);
      try {
        const currentFreezes: FreezeRecord[] = localFreezes.length > 0 ? localFreezes : (client.freezes || []);
        const updatedFreezes = currentFreezes.map((rec, idx) =>
          idx === editingIndex
            ? { ...rec, freezeTillDate: unfreezeTillDate, numberOfDays: unfreezeDays, status: 'Frozen' }
            : rec
        );
        setLocalFreezes(updatedFreezes);
        await updateClient(client._id, { freezes: updatedFreezes });
        showToast('Freeze record updated successfully', 'success');
        setShowForm(false);
        setEditingIndex(null);
        setFreezeStartDate('');
        setFreezeTillDate('');
        setReason('');
        setUnfreezeMode('completely');
        setUnfreezeTillDate('');
      } catch (err: any) {
        showToast(err?.message || 'Failed to update freeze', 'error');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // ── ADD NEW FREEZE ──────────────────────────────────────────────────────
    if (!freezeStartDate) {
      showToast('Please select Freeze Start Date', 'error');
      return;
    }
    if (!freezeTillDate) {
      showToast('Please select Freeze Till Date', 'error');
      return;
    }
    if (numberOfDays <= 0) {
      showToast('Freeze Till Date must be after Freeze Start Date', 'error');
      return;
    }
    if (!reason.trim()) {
      showToast('Please enter reason for freeze', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      let newEndDate = client.endDate;
      if (client.endDate) {
        const currentEnd = new Date(client.endDate);
        currentEnd.setDate(currentEnd.getDate() + numberOfDays);
        newEndDate = currentEnd.toISOString();
      }

      const newRecord: FreezeRecord = {
        id: Date.now().toString(),
        freezeStartDate,
        freezeTillDate,
        numberOfDays,
        reason,
        status: 'Frozen',
        createdAt: new Date().toISOString(),
      };

      const currentFreezes: FreezeRecord[] = localFreezes.length > 0 ? localFreezes : (client.freezes || []);
      const updatedFreezes = [newRecord, ...currentFreezes];

      setLocalFreezes(updatedFreezes);
      await updateClient(client._id, {
        endDate: newEndDate,
        freezes: updatedFreezes,
        freezeInfo: newRecord,
      });

      showToast(`Membership frozen with ${numberOfDays} day(s) extension successfully`, 'success');
      setShowForm(false);
      setEditingIndex(null);
      setFreezeStartDate('');
      setFreezeTillDate('');
      setReason('');
    } catch (err: any) {
      showToast(err?.message || 'Failed to freeze membership', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const freezeList: FreezeRecord[] = useMemo(() => {
    if (localFreezes.length > 0) return localFreezes;
    if (client?.freezes && client.freezes.length > 0) return client.freezes;
    if (client?.freezeInfo) return [client.freezeInfo];
    return [];
  }, [localFreezes, client]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col font-sans">
      {/* Top Breadcrumb Navigation */}
      <div className="bg-[#f8f9fa] dark:bg-gray-850 px-4 sm:px-6 py-2.5 border-b border-gray-200 dark:border-gray-800 text-xs">
        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
          <Link to="/admin/dashboard" className="hover:text-gray-900 dark:hover:text-white">
            Home
          </Link>
          <span>/</span>
          <Link to="/admin/clients" className="hover:text-gray-900 dark:hover:text-white">
            Clients
          </Link>
          <span>/</span>
          <Link to="/admin/clients" className="hover:text-gray-900 dark:hover:text-white">
            Geography Based
          </Link>
          <span>/</span>
          <span className="text-[#ff5e28] font-medium">Freeze</span>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="bg-white dark:bg-gray-850 px-4 sm:px-6 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
        <div className="flex items-center gap-5 text-xs whitespace-nowrap">
          {tabs.map((tab) => {
            const isDocsTab = tab === 'Documents';
            return (
              <button
                key={tab}
                type="button"
                onClick={() => handleTabClick(tab)}
                className={`py-2 px-3 transition-colors cursor-pointer text-xs ${
                  isDocsTab
                    ? 'bg-[#ff5e28] text-white font-medium rounded-t-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 sm:p-8 space-y-5">

        {/* Inline Form — shown when adding new or editing */}
        {showForm && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-sm p-5 max-w-3xl">
            <form onSubmit={handleFreezeWithExtension} className="space-y-4 text-xs sm:text-sm">
              {/* Service Variation Name */}
              <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 sm:gap-4">
                <label className="sm:col-span-4 text-gray-700 dark:text-gray-300 font-normal">
                  Service Variation Name
                </label>
                <div className="sm:col-span-8 text-gray-900 dark:text-gray-100 font-medium">
                  {serviceVariationName}
                </div>
              </div>

              {/* Freeze Start Date */}
              <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 sm:gap-4">
                <label className="sm:col-span-4 text-gray-700 dark:text-gray-300 font-normal">
                  Freeze Start Date<span className="text-red-500">*</span>
                </label>
                <div className="sm:col-span-5 max-w-xs">
                  {editingIndex !== null ? (
                    /* EDIT MODE: show start date as read-only display */
                    <div className="px-3 py-1.5 text-xs bg-[#f1f3f4] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-gray-800 dark:text-gray-200">
                      {formatDateToDisplay(freezeStartDate) || freezeStartDate}
                    </div>
                  ) : (
                    /* ADD MODE: editable date */
                    <input
                      type="date"
                      value={freezeStartDate}
                      onClick={(e) => {
                        try { (e.target as any).showPicker?.(); } catch (_) {}
                      }}
                      onChange={(e) => setFreezeStartDate(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 text-xs bg-[#f1f3f4] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#22b0e6] cursor-pointer"
                    />
                  )}
                </div>
              </div>

              {/* EDIT MODE: Unfreeze radio options */}
              {editingIndex !== null && (
                <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 sm:gap-4">
                  <div className="sm:col-span-4" />
                  <div className="sm:col-span-8 flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300 text-xs">
                      <input
                        type="radio"
                        name="unfreezeMode"
                        value="completely"
                        checked={unfreezeMode === 'completely'}
                        onChange={() => setUnfreezeMode('completely')}
                        className="accent-[#22b0e6] w-3.5 h-3.5 cursor-pointer"
                      />
                      Unfreeze completely
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300 text-xs">
                      <input
                        type="radio"
                        name="unfreezeMode"
                        value="till_date"
                        checked={unfreezeMode === 'till_date'}
                        onChange={() => setUnfreezeMode('till_date')}
                        className="accent-[#22b0e6] w-3.5 h-3.5 cursor-pointer"
                      />
                      Unfreeze till Date
                    </label>
                  </div>
                </div>
              )}

              {/* EDIT MODE: Freeze Till Date + Number Of Days (shown when 'till_date' selected) */}
              {editingIndex !== null && unfreezeMode === 'till_date' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 sm:gap-4">
                    <label className="sm:col-span-4 text-gray-700 dark:text-gray-300 font-normal">
                      Freeze Till Date<span className="text-red-500">*</span>
                    </label>
                    <div className="sm:col-span-5 max-w-xs">
                      <input
                        type="date"
                        value={unfreezeTillDate}
                        onClick={(e) => {
                          try { (e.target as any).showPicker?.(); } catch (_) {}
                        }}
                        onChange={(e) => setUnfreezeTillDate(e.target.value)}
                        required
                        className="w-full px-3 py-1.5 text-xs bg-[#f1f3f4] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#22b0e6] cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 sm:gap-4">
                    <label className="sm:col-span-4 text-gray-700 dark:text-gray-300 font-normal">
                      Number Of Days
                    </label>
                    <div className="sm:col-span-8 text-gray-900 dark:text-gray-100 font-medium">
                      {unfreezeDays}
                    </div>
                  </div>
                </>
              )}

              {/* ADD MODE ONLY: Freeze Till Date + Number Of Days */}
              {editingIndex === null && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 sm:gap-4">
                    <label className="sm:col-span-4 text-gray-700 dark:text-gray-300 font-normal">
                      Freeze Till Date<span className="text-red-500">*</span>
                    </label>
                    <div className="sm:col-span-5 max-w-xs">
                      <input
                        type="date"
                        value={freezeTillDate}
                        onClick={(e) => {
                          try { (e.target as any).showPicker?.(); } catch (_) {}
                        }}
                        onChange={(e) => setFreezeTillDate(e.target.value)}
                        required
                        className="w-full px-3 py-1.5 text-xs bg-[#f1f3f4] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#22b0e6] cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 sm:gap-4">
                    <label className="sm:col-span-4 text-gray-700 dark:text-gray-300 font-normal">
                      Number Of Days
                    </label>
                    <div className="sm:col-span-8 text-gray-900 dark:text-gray-100 font-medium">
                      {numberOfDays}
                    </div>
                  </div>
                </>
              )}

              {/* Reason */}
              <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 sm:gap-4">
                <label className={`sm:col-span-4 font-normal ${editingIndex !== null ? 'text-gray-400 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}`}>
                  Reason<span className="text-red-500">*</span>
                </label>
                <div className="sm:col-span-5 max-w-xs">
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    disabled={editingIndex !== null}
                    required={editingIndex === null}
                    className={`w-full px-3 py-1.5 text-xs rounded transition-colors ${
                      editingIndex !== null
                        ? 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                        : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:border-[#22b0e6] focus:ring-1 focus:ring-[#22b0e6]'
                    }`}
                  />
                </div>
              </div>


              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#22b0e6] hover:bg-[#1fa0d2] disabled:opacity-50 text-white font-medium text-xs rounded shadow-xs transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingIndex !== null ? 'Update' : 'Freeze with extension'}
                </button>
                {editingIndex !== null && (
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    className="px-4 py-2 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Add Freeze button — always shown */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleNewFreeze}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#22b0e6] hover:bg-[#1fa0d2] text-white text-xs font-semibold rounded shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={14} /> Add Freeze
          </button>
        </div>

        {/* Freeze List Table — always shown */}
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-semibold text-gray-800 dark:text-gray-200">
                <th className="py-3 px-4 w-16">S.No</th>
                <th className="py-3 px-4">Freeze Date</th>
                <th className="py-3 px-4">Freeze Till Date</th>
                <th className="py-3 px-4">No.of Days</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center w-16">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300">
              {freezeList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-500 text-xs">
                    No freeze records found.
                  </td>
                </tr>
              ) : (
                freezeList.map((rec, idx) => (
                  <tr
                    key={rec.id || idx}
                    className={`hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors ${
                      editingIndex === idx && showForm ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-normal">{idx + 1}</td>
                    <td className="py-3 px-4">{formatDateToDisplay(rec.freezeStartDate)}</td>
                    <td className="py-3 px-4">{formatDateToDisplay(rec.freezeTillDate)}</td>
                    <td className="py-3 px-4">
                      {typeof rec.numberOfDays === 'string'
                        ? rec.numberOfDays
                        : rec.numberOfDays}
                    </td>
                    <td className="py-3 px-4">{rec.reason}</td>
                    <td className="py-3 px-4">
                      <span className={rec.status === 'Unfreeze' ? 'text-green-600 dark:text-green-400 font-medium' : ''}>
                        {rec.status || 'Frozen'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {rec.status !== 'Unfreeze' && (
                        <button
                          type="button"
                          onClick={() => handleEditRecord(rec, idx)}
                          className={`p-1 transition-colors cursor-pointer ${
                            editingIndex === idx && showForm
                              ? 'text-[#ff5e28]'
                              : 'text-[#22b0e6] hover:text-[#1a8bb6]'
                          }`}
                          title="Edit Freeze"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
