import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useClient } from '../../hooks/useClient';
import { useToast } from '../../contexts/ToastContext';

export const ClientRefundCancellationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clients, updateClient } = useClient();
  const { addToast } = useToast();
  const showToast = addToast;

  const memId = id || searchParams.get('memid') || searchParams.get('clientId') || '';
  const invIdentifier = searchParams.get('invno') || searchParams.get('invoiceNo') || '';
  const serviceQueryName = searchParams.get('svc') || '';

  const client = useMemo(() => {
    if (!memId) return clients[0] || null;
    return clients.find((c) => c._id === memId) || clients[0] || null;
  }, [clients, memId]);

  // Find the targeted invoice
  const targetInvoice = useMemo(() => {
    if (!client) return null;

    if (client.invoices && Array.isArray(client.invoices) && client.invoices.length > 0) {
      if (invIdentifier) {
        const found = client.invoices.find(
          (inv: any) =>
            (inv.invoiceNo && inv.invoiceNo === invIdentifier) ||
            (inv._id && String(inv._id) === invIdentifier) ||
            (inv.id && String(inv.id) === invIdentifier)
        );
        if (found) return found;
      }
      // If no invoice found by ID, match by service query name if present
      if (serviceQueryName) {
        const decoded = decodeURIComponent(serviceQueryName).toLowerCase();
        const found = client.invoices.find((inv: any) => {
          if (inv.isCancelled || inv.status === 'Cancelled') return false;
          if ((inv.duration || '').toLowerCase().includes(decoded)) return true;
          if ((inv.serviceName || '').toLowerCase().includes(decoded)) return true;
          return inv.items?.some(
            (it: any) =>
              (it.duration || '').toLowerCase().includes(decoded) ||
              (it.serviceName || '').toLowerCase().includes(decoded)
          );
        });
        if (found) return found;
      }

      // Return first non-cancelled invoice
      const active = client.invoices.find((inv: any) => !inv.isCancelled && inv.status !== 'Cancelled');
      if (active) return active;

      return client.invoices[0];
    }

    if (client.invoice) {
      return client.invoice;
    }

    return null;
  }, [client, invIdentifier, serviceQueryName]);

  // Member Identity
  const memberText = useMemo(() => {
    if (!client) return 'Demo101 - 1000100010';
    return `${client.fullName} - ${client.contactNumber}`;
  }, [client]);

  // Service Variation Name
  const serviceVariationName = useMemo(() => {
    if (serviceQueryName) return decodeURIComponent(serviceQueryName);
    if (targetInvoice?.items?.[0]?.duration) return targetInvoice.items[0].duration;
    if (targetInvoice?.items?.[0]?.serviceVariationName) return targetInvoice.items[0].serviceVariationName;
    if (targetInvoice?.duration) return targetInvoice.duration;
    if (client?.invoice?.items?.[0]?.duration) return client.invoice.items[0].duration;
    if (client?.packagePrice && client.packagePrice <= 2500) return '1 Month';
    return '12 Months';
  }, [serviceQueryName, targetInvoice, client]);

  // Start & Expiry dates
  const startDateFormatted = useMemo(() => {
    const raw = targetInvoice?.items?.[0]?.startDate || targetInvoice?.startDate || targetInvoice?.date || client?.startDate;
    if (!raw) return '30-11-2023';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return '30-11-2023';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }, [targetInvoice, client]);

  const expiryDateFormatted = useMemo(() => {
    const raw = targetInvoice?.items?.[0]?.expiryDate || targetInvoice?.expiryDate || targetInvoice?.endDate || client?.endDate;
    if (!raw) return '29-12-2024';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return '29-12-2024';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }, [targetInvoice, client]);

  // Form states
  const [cancellationReason, setCancellationReason] = useState<string>('Select');
  const [customReasonInput, setCustomReasonInput] = useState<string>('');
  const [isAddingReason, setIsAddingReason] = useState<boolean>(false);
  const [customReasonsList, setCustomReasonsList] = useState<string[]>([]);

  const [refundType, setRefundType] = useState<'Cancel without refund' | 'Cancel with refund' | 'Refund without cancellation'>(
    'Cancel without refund'
  );
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundMode, setRefundMode] = useState<string>('Cash');

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [lastUsageDate, setLastUsageDate] = useState<string>(todayStr);
  const [note, setNote] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

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
    if (!client?._id) return;
    if (tab === 'Service Card') {
      navigate(`/admin/clients/service-card/${client._id}`);
    } else if (tab === 'Payments') {
      navigate(`/admin/clients/payments/${client._id}`);
    } else if (tab === 'Profile') {
      navigate(`/admin/client-form/${client._id}`);
    } else if (tab === 'Appointments') {
      navigate(`/admin/clients/appointments/${client._id}`);
    } else if (tab === 'Training') {
      navigate(`/admin/clients/training/${client._id}`);
    }
  };

  const handleAddCustomReason = () => {
    if (!customReasonInput.trim()) return;
    setCustomReasonsList((prev) => [...prev, customReasonInput.trim()]);
    setCancellationReason(customReasonInput.trim());
    setCustomReasonInput('');
    setIsAddingReason(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client?._id) return;

    if (!cancellationReason || cancellationReason === 'Select') {
      showToast('Please select or specify a Refund/Cancellation Reason', 'error');
      return;
    }

    if (!lastUsageDate) {
      showToast('Please provide a valid Last Usage date', 'error');
      return;
    }

    setIsSaving(true);
    try {
      // NOTE: We only cancel the SERVICE MEMBERSHIP access, NOT the invoice/payment.
      // The invoice remains "Paid". We add serviceCancelled flags to the invoice record
      // so the service card shows it as Cancelled, but the payment history stays intact.

      const updatedInvoices = (client.invoices || []).map((inv: any) => {
        const matches =
          (targetInvoice?.invoiceNo && inv.invoiceNo === targetInvoice.invoiceNo) ||
          (targetInvoice?._id && inv._id && String(inv._id) === String(targetInvoice._id)) ||
          (targetInvoice?.id && inv.id && String(inv.id) === String(targetInvoice.id));

        if (matches) {
          return {
            ...inv,
            // Only mark service as cancelled, keep invoice/payment status intact
            serviceCancelled: true,
            serviceCancelledAt: new Date().toISOString(),
            cancellationReason: cancellationReason,
            refundType: refundType,
            lastUsageDate: lastUsageDate,
            cancellationNote: note,
            // For "Cancel with refund" - store refund info but don't change payment status
            ...(refundType === 'Cancel with refund' ? {
              refundAmount: refundAmount,
              refundMode: refundMode,
            } : {}),
            // For "Refund without cancellation" - only refund, keep service active
            ...(refundType === 'Refund without cancellation' ? {
              serviceCancelled: false,
              refundAmount: refundAmount,
              refundMode: refundMode,
            } : {}),
          };
        }
        return inv;
      });

      // Keep client.invoice (the active invoice pointer) unchanged - don't modify payment status
      // Only update invoices array with service-level cancellation flags
      await updateClient(client._id, {
        invoices: updatedInvoices,
      } as any);

      showToast('Refund or Cancellation saved successfully', 'success');
      navigate(`/admin/clients/service-card/${client._id}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to process refund or cancellation', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col font-sans">
      {/* Top Breadcrumb Navigation */}
      <div className="px-4 sm:px-6 pt-3 pb-2 flex items-center justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <Link to="/admin/dashboard" className="hover:text-gray-900 dark:hover:text-gray-200">
            Home
          </Link>
          <span>/</span>
          <Link to="/admin/clients" className="hover:text-gray-900 dark:hover:text-gray-200">
            Clients
          </Link>
          <span>/</span>
          <Link to="/admin/clients" className="hover:text-gray-900 dark:hover:text-gray-200">
            Validity Based
          </Link>
          <span>/</span>
          <span className="text-[#ff5e28] font-medium">Refund or Cancellation</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="px-4 sm:px-6 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
        <div className="flex items-center gap-1 text-xs">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabClick(tab)}
              className={`px-3 py-2 font-medium whitespace-nowrap cursor-pointer transition-colors ${
                tab === 'Service Card'
                  ? 'bg-[#ff5e28] text-white rounded-t-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Refund / Cancellation Form */}
      <div className="p-6 sm:p-10 max-w-4xl">
        <form onSubmit={handleSave} className="space-y-5 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
          {/* Member */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6 items-center">
            <label className="sm:col-span-4 font-normal text-gray-600 dark:text-gray-400">
              Member
            </label>
            <div className="sm:col-span-8 font-medium text-gray-900 dark:text-white">
              {memberText}
            </div>
          </div>

          {/* Service Variation Name */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6 items-center">
            <label className="sm:col-span-4 font-normal text-gray-600 dark:text-gray-400">
              Service Variation Name
            </label>
            <div className="sm:col-span-8 text-gray-900 dark:text-white font-medium">
              {serviceVariationName}
            </div>
          </div>

          {/* Refund/Cancellation Reason */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6 items-center">
            <label className="sm:col-span-4 font-normal text-gray-600 dark:text-gray-400">
              Refund/Cancellation Reason <span className="text-red-500 font-bold">*</span>
            </label>
            <div className="sm:col-span-8 flex flex-wrap items-center gap-3">
              <select
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-64 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-xs text-gray-800 dark:text-gray-200 focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
              >
                <option value="Select">Select</option>
                <option value="Customer Relocated">Customer Relocated</option>
                <option value="Medical Issue / Illness">Medical Issue / Illness</option>
                <option value="Unhappy with Service">Unhappy with Service</option>
                <option value="Personal Reason">Personal Reason</option>
                <option value="Duplicate Entry / Mistake">Duplicate Entry / Mistake</option>
                <option value="Fee Dispute">Fee Dispute</option>
                {customReasonsList.map((cr, idx) => (
                  <option key={idx} value={cr}>
                    {cr}
                  </option>
                ))}
                <option value="Other">Other</option>
              </select>

              {!isAddingReason ? (
                <button
                  type="button"
                  onClick={() => setIsAddingReason(true)}
                  className="text-[#0ea5e9] hover:underline font-medium text-xs cursor-pointer"
                >
                  Add Reason
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customReasonInput}
                    onChange={(e) => setCustomReasonInput(e.target.value)}
                    placeholder="Enter custom reason..."
                    className="px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomReason}
                    className="px-2.5 py-1 bg-sky-500 text-white rounded text-xs cursor-pointer"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingReason(false)}
                    className="text-gray-400 hover:text-gray-600 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Refund Type */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6 items-center">
            <label className="sm:col-span-4 font-normal text-gray-600 dark:text-gray-400">
              Refund Type
            </label>
            <div className="sm:col-span-8 flex flex-wrap items-center gap-4 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="refundType"
                  value="Cancel without refund"
                  checked={refundType === 'Cancel without refund'}
                  onChange={() => setRefundType('Cancel without refund')}
                  className="text-sky-500 focus:ring-sky-500 cursor-pointer"
                />
                <span>Cancel without refund</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="refundType"
                  value="Cancel with refund"
                  checked={refundType === 'Cancel with refund'}
                  onChange={() => setRefundType('Cancel with refund')}
                  className="text-sky-500 focus:ring-sky-500 cursor-pointer"
                />
                <span>Cancel with refund</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="refundType"
                  value="Refund without cancellation"
                  checked={refundType === 'Refund without cancellation'}
                  onChange={() => setRefundType('Refund without cancellation')}
                  className="text-sky-500 focus:ring-sky-500 cursor-pointer"
                />
                <span>Refund without cancellation</span>
              </label>
            </div>
          </div>

          {/* Conditional Refund Amount & Mode */}
          {(refundType === 'Cancel with refund' || refundType === 'Refund without cancellation') && (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6 items-center bg-gray-50 dark:bg-gray-800/60 p-3 rounded">
              <label className="sm:col-span-4 font-normal text-gray-600 dark:text-gray-400">
                Refund Amount & Mode <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="sm:col-span-8 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1">
                  <span>₹</span>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(Number(e.target.value))}
                    placeholder="Amount"
                    className="w-28 px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-xs font-semibold"
                  />
                </div>
                <select
                  value={refundMode}
                  onChange={(e) => setRefundMode(e.target.value)}
                  className="px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-xs"
                >
                  <option value="Cash">Cash</option>
                  <option value="Paytm">Paytm</option>
                  <option value="Google Pay">Google Pay</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
            </div>
          )}

          {/* Start Date */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6 items-center">
            <label className="sm:col-span-4 font-normal text-gray-600 dark:text-gray-400">
              Start Date
            </label>
            <div className="sm:col-span-8 text-gray-900 dark:text-white font-medium">
              {startDateFormatted}
            </div>
          </div>

          {/* Expiry Date */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6 items-center">
            <label className="sm:col-span-4 font-normal text-gray-600 dark:text-gray-400">
              Expiry Date
            </label>
            <div className="sm:col-span-8 text-gray-900 dark:text-white font-medium">
              {expiryDateFormatted}
            </div>
          </div>

          {/* Last Usage date */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6 items-center">
            <label className="sm:col-span-4 font-normal text-gray-600 dark:text-gray-400">
              Last Usage date <span className="text-red-500 font-bold">*</span>
            </label>
            <div className="sm:col-span-8">
              <input
                type="date"
                value={lastUsageDate}
                onChange={(e) => setLastUsageDate(e.target.value)}
                className="w-64 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-xs text-gray-800 dark:text-gray-200 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Note */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6 items-center">
            <label className="sm:col-span-4 font-normal text-gray-600 dark:text-gray-400">
              Note
            </label>
            <div className="sm:col-span-8">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder=""
                className="w-64 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-xs text-gray-800 dark:text-gray-200 focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6 pt-3">
            <div className="sm:col-start-5 sm:col-span-8">
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 py-2 bg-[#00a8e8] hover:bg-[#0096d1] text-white text-xs font-semibold rounded-xs shadow-xs transition-colors cursor-pointer"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
