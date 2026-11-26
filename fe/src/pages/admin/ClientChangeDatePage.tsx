import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useClient } from '../../hooks/useClient';
import { useToast } from '../../contexts/ToastContext';

interface DateChangeRecord {
  id?: string;
  _id?: string;
  date: string;
  fromDate: string;
  toDate: string;
  document?: string;
  reason: string;
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

const formatDateTimeToDisplay = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hourStr = String(hours).padStart(2, '0');

  return `${day}-${month}-${year} ${hourStr}:${minutes} ${ampm}`;
};

// Convert date to YYYY-MM-DD for date input
const toInputDateValue = (dateStr: string): string => {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr.slice(0, 10);
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return '';
};

export const ClientChangeDatePage: React.FC = () => {
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

  const startDateStr = useMemo(() => {
    if (client?.invoice?.items?.[0]?.startDate) return client.invoice.items[0].startDate;
    if (client?.startDate) return client.startDate;
    return new Date().toISOString();
  }, [client]);

  const currentEndDateStr = useMemo(() => {
    if (client?.invoice?.items?.[0]?.expiryDate) return client.invoice.items[0].expiryDate;
    if (client?.endDate) return client.endDate;
    return new Date().toISOString();
  }, [client]);

  const [startDate, setStartDate] = useState<string>(() => toInputDateValue(startDateStr));
  const [endDate, setEndDate] = useState<string>(() => toInputDateValue(currentEndDateStr));
  const [reason, setReason] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync date when client loads
  React.useEffect(() => {
    if (startDateStr) {
      setStartDate(toInputDateValue(startDateStr));
    }
    if (currentEndDateStr) {
      setEndDate(toInputDateValue(currentEndDateStr));
    }
  }, [startDateStr, currentEndDateStr]);

  const historyList: DateChangeRecord[] = useMemo(() => {
    const list: DateChangeRecord[] = [];

    // 1. Explicit dateChanges recorded on client
    if (client?.dateChanges && Array.isArray(client.dateChanges)) {
      client.dateChanges.forEach((rec) => {
        list.push({
          ...rec,
          fromDate: rec.fromDate || startDateStr,
          toDate: rec.toDate || currentEndDateStr,
        });
      });
    }

    // 2. Derive real unfreeze events from client.freezes / freezeInfo
    const allFreezes = [
      ...(client?.freezes || []),
      ...(client?.freezeInfo ? [client.freezeInfo] : []),
    ];

    allFreezes.forEach((f: any, idx: number) => {
      if (f?.status === 'Unfreeze') {
        const unfreezeReason = `${f.reason || 'Travel'}-Unfreezed completely`;
        const existingIdx = list.findIndex((item) => item.reason === unfreezeReason);
        const unfreezeItem: DateChangeRecord = {
          id: f.id || `freeze-unfreeze-${idx}`,
          date: f.createdAt || client?.updatedAt || new Date().toISOString(),
          fromDate: startDateStr,
          toDate: currentEndDateStr,
          document: '-',
          reason: unfreezeReason,
          createdAt: f.createdAt || client?.updatedAt || new Date().toISOString(),
        };

        if (existingIdx >= 0) {
          list[existingIdx] = {
            ...list[existingIdx],
            fromDate: startDateStr,
            toDate: currentEndDateStr,
          };
        } else {
          list.push(unfreezeItem);
        }
      }
    });

    return list;
  }, [client, startDateStr, currentEndDateStr]);

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
    } else if (tab === 'Documents' && client) {
      navigate(`/admin/clients/freeze/${client._id}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    } else {
      setFileName('');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!endDate) {
      showToast('Please select an End Date', 'error');
      return;
    }
    if (!reason.trim()) {
      showToast('Please enter a reason', 'error');
      return;
    }
    if (!client) {
      showToast('Member not found', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const newEndDateIso = new Date(endDate).toISOString();
      const newStartDateIso = startDate ? new Date(startDate).toISOString() : (client.startDate ? new Date(client.startDate).toISOString() : new Date().toISOString());

      const newRecord: DateChangeRecord = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        fromDate: startDateStr,
        toDate: endDate,
        document: fileName || '-',
        reason: reason.trim(),
        createdAt: new Date().toISOString(),
      };

      const updatedHistory = [newRecord, ...historyList];

      let updatedInvoice = client.invoice;
      if (client.invoice?.items?.length) {
        updatedInvoice = {
          ...client.invoice,
          items: client.invoice.items.map((item: any, idx: number) =>
            idx === 0
              ? {
                  ...item,
                  startDate: newStartDateIso,
                  expiryDate: newEndDateIso,
                }
              : item
          ),
        };
      }

      let updatedInvoices = client.invoices;
      if (client.invoices && Array.isArray(client.invoices)) {
        updatedInvoices = client.invoices.map((inv: any) =>
          inv?.items?.length
            ? {
                ...inv,
                items: inv.items.map((item: any, iIdx: number) =>
                  iIdx === 0
                    ? {
                        ...item,
                        startDate: newStartDateIso,
                        expiryDate: newEndDateIso,
                      }
                    : item
                ),
              }
            : inv
        );
      }

      await updateClient(client._id, {
        startDate: newStartDateIso,
        endDate: newEndDateIso,
        dateChanges: updatedHistory,
        ...(updatedInvoice ? { invoice: updatedInvoice } : {}),
        ...(updatedInvoices ? { invoices: updatedInvoices } : {}),
      });

      showToast('Date changed successfully', 'success');
      navigate(`/admin/clients/service-card/${client._id}`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to change date', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Validity Based
          </Link>
          <span>/</span>
          <span className="text-[#ff5e28] font-medium">Change Date</span>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="bg-white dark:bg-gray-850 px-4 sm:px-6 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
        <div className="flex items-center gap-5 text-xs whitespace-nowrap">
          {tabs.map((tab) => {
            const isServiceCardTab = tab === 'Service Card';
            return (
              <button
                key={tab}
                type="button"
                onClick={() => handleTabClick(tab)}
                className={`py-2 px-3 transition-colors cursor-pointer text-xs ${
                  isServiceCardTab
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

      {/* Main Form Content */}
      <div className="p-6 sm:p-8 space-y-6">
        <form onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm max-w-3xl">
          {/* Service Variation Name */}
          <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 sm:gap-4">
            <label className="sm:col-span-3 text-gray-700 dark:text-gray-300 font-normal">
              Service Variation Name
            </label>
            <div className="sm:col-span-9 text-gray-900 dark:text-gray-100 font-normal">
              {serviceVariationName}
            </div>
          </div>

          {/* Start Date */}
          <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 sm:gap-4">
            <label className="sm:col-span-3 text-gray-700 dark:text-gray-300 font-normal">
              Start Date
            </label>
            <div className="sm:col-span-5 max-w-xs">
              <input
                type="date"
                value={startDate}
                onClick={(e) => {
                  try { (e.target as any).showPicker?.(); } catch (_) {}
                }}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-[#f1f3f4] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#22b0e6] cursor-pointer"
              />
            </div>
          </div>

          {/* End Date */}
          <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 sm:gap-4">
            <label className="sm:col-span-3 text-gray-700 dark:text-gray-300 font-normal">
              End Date<span className="text-red-500">*</span>
            </label>
            <div className="sm:col-span-5 max-w-xs">
              <input
                type="date"
                value={endDate}
                onClick={(e) => {
                  try { (e.target as any).showPicker?.(); } catch (_) {}
                }}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-xs bg-[#f1f3f4] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#22b0e6] cursor-pointer"
              />
            </div>
          </div>

          {/* Reason */}
          <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 sm:gap-4">
            <label className="sm:col-span-3 text-gray-700 dark:text-gray-300 font-normal">
              Reason <span className="text-red-500">*</span>
            </label>
            <div className="sm:col-span-5 max-w-xs">
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:border-[#22b0e6] focus:ring-1 focus:ring-[#22b0e6] transition-colors"
              />
            </div>
          </div>

          {/* Upload Document */}
          <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 sm:gap-4">
            <label className="sm:col-span-3 text-gray-700 dark:text-gray-300 font-normal">
              Upload Document
            </label>
            <div className="sm:col-span-9 flex items-center gap-3">
              <label className="px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs border border-gray-300 dark:border-gray-600 rounded cursor-pointer transition-colors shadow-2xs">
                Choose file
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {fileName || 'No file chosen'}
              </span>
            </div>
          </div>

          {/* Save Button */}
          <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 sm:gap-4 pt-2">
            <div className="sm:col-start-4 sm:col-span-9">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-[#22b0e6] hover:bg-[#1fa0d2] disabled:opacity-50 text-white font-medium text-xs rounded shadow-xs transition-colors cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>

        {/* Change Date History Table */}
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-semibold text-gray-800 dark:text-gray-200">
                <th className="py-3 px-4 w-16">S.No</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">From Date</th>
                <th className="py-3 px-4">To Date</th>
                <th className="py-3 px-4">Document</th>
                <th className="py-3 px-4">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300">
              {historyList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-500 text-xs">
                    No change date records found.
                  </td>
                </tr>
              ) : (
                historyList.map((rec, idx) => (
                  <tr key={rec.id || idx} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="py-3 px-4 font-normal">{idx + 1}</td>
                    <td className="py-3 px-4">{formatDateTimeToDisplay(rec.date || rec.createdAt || '')}</td>
                    <td className="py-3 px-4">{formatDateToDisplay(rec.fromDate)}</td>
                    <td className="py-3 px-4">{formatDateToDisplay(rec.toDate)}</td>
                    <td className="py-3 px-4">{rec.document || '-'}</td>
                    <td className="py-3 px-4">{rec.reason}</td>
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
