import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Search, Calendar, User } from 'lucide-react';
import { useClient } from '../../hooks/useClient';
import { useToast } from '../../contexts/ToastContext';

interface TransferServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClient: any;
  service: any;
  onProceedToBilling: (transferData: {
    fromClient: any;
    toClient: any;
    serviceToTransfer: any;
    billRaisedFor: 'From' | 'To';
    startDate: string;
    endDate: string;
  }) => void;
}

const toInputDate = (d?: Date | string | null): string => {
  if (!d) return '';
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return '';
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const calculateEndDateFromStart = (startDateStr: string, durationDays: number): string => {
  if (!startDateStr || isNaN(durationDays) || durationDays <= 0) return '';
  const [year, month, day] = startDateStr.split('-').map(Number);
  if (!year || !month || !day) {
    const d = new Date(startDateStr);
    if (isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + durationDays - 1);
    return toInputDate(d);
  }
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + durationDays - 1);
  return toInputDate(date);
};

export const TransferServiceModal: React.FC<TransferServiceModalProps> = ({
  isOpen,
  onClose,
  currentClient,
  service,
  onProceedToBilling,
}) => {
  const { clients } = useClient();
  const { addToast } = useToast();
  const showToast = addToast;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceivingClient, setSelectedReceivingClient] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [billRaisedFor, setBillRaisedFor] = useState<'From' | 'To'>('From');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Compute total duration in days from the original membership
  const membershipDurationDays = useMemo(() => {
    if (!service) return 0;

    if (service.validityInDays && Number(service.validityInDays) > 0) {
      return Number(service.validityInDays);
    }

    const s = service.startDateObj || service.startDate || currentClient?.startDate;
    const e = service.expiryDateObj || service.expiryDate || service.endDate || currentClient?.endDate;
    if (s && e) {
      const sDate = new Date(s);
      const eDate = new Date(e);
      if (!isNaN(sDate.getTime()) && !isNaN(eDate.getTime())) {
        sDate.setHours(0, 0, 0, 0);
        eDate.setHours(0, 0, 0, 0);
        const diffDays = Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 3600 * 24)) + 1;
        if (diffDays > 0) return diffDays;
      }
    }

    const str = (service.serviceVariationName || service.duration || '').toLowerCase();
    const dayMatch = str.match(/(\d+)\s*day/);
    if (dayMatch && dayMatch[1]) return Number(dayMatch[1]);

    const monthMatch = str.match(/(\d+)\s*month/);
    if (monthMatch && monthMatch[1]) return Number(monthMatch[1]) * 30;

    const yearMatch = str.match(/(\d+)\s*year/);
    if (yearMatch && yearMatch[1]) return Number(yearMatch[1]) * 365;

    return 30;
  }, [service, currentClient]);

  // Initialize dates and fields when modal opens
  useEffect(() => {
    if (isOpen && service) {
      const sDate = service.startDateObj || service.startDate || currentClient?.startDate;
      const eDate = service.expiryDateObj || service.expiryDate || service.endDate || currentClient?.endDate;

      const initialStart = toInputDate(sDate);
      const initialEnd = toInputDate(eDate);

      setStartDate(initialStart);
      setEndDate(initialEnd);
      setBillRaisedFor('From');
      setSelectedReceivingClient(null);
      setSearchTerm('');
      setIsSearching(false);
    }
  }, [isOpen, service, currentClient]);

  // Handler for Start Date change: dynamically recalculates End Date
  const handleStartDateChange = (newStartDate: string) => {
    setStartDate(newStartDate);
    if (newStartDate && membershipDurationDays > 0) {
      const calculatedEnd = calculateEndDateFromStart(newStartDate, membershipDurationDays);
      if (calculatedEnd) {
        setEndDate(calculatedEnd);
      }
    }
  };

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearching(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter available receiving clients (excluding current client)
  const matchingClients = useMemo(() => {
    if (!searchTerm.trim() || !clients) return [];
    const q = searchTerm.toLowerCase().trim();
    return clients
      .filter((c: any) => String(c._id) !== String(currentClient?._id))
      .filter((c: any) => {
        const nameMatch = (c.fullName || '').toLowerCase().includes(q);
        const phoneMatch = (c.contactNumber || '').toLowerCase().includes(q);
        const emailMatch = (c.email || '').toLowerCase().includes(q);
        return nameMatch || phoneMatch || emailMatch;
      })
      .slice(0, 8);
  }, [searchTerm, clients, currentClient]);

  if (!isOpen || !service) return null;

  const serviceVariationDisplayName =
    service.serviceVariationName ||
    service.duration ||
    service.serviceName ||
    'Club Membership';

  const handleSelectReceiver = (client: any) => {
    setSelectedReceivingClient(client);
    setSearchTerm(`${client.fullName} - ${client.contactNumber || ''}`);
    setIsSearching(false);
  };

  const handleBillAndTransfer = () => {
    // 1. Validate receiving member is selected
    if (!selectedReceivingClient) {
      showToast('Please search and select a receiving member', 'error');
      return;
    }

    // 2. Validate receiver is not the same member
    if (String(selectedReceivingClient._id) === String(currentClient?._id)) {
      showToast('Receiving member cannot be the original member', 'error');
      return;
    }

    // 3. Validate dates
    if (!startDate) {
      showToast('Start date is required', 'error');
      return;
    }
    if (!endDate) {
      showToast('End date is required', 'error');
      return;
    }

    const sDateObj = new Date(startDate);
    const eDateObj = new Date(endDate);
    if (sDateObj > eDateObj) {
      showToast('Start date cannot be after end date', 'error');
      return;
    }

    // Proceed to billing step
    onProceedToBilling({
      fromClient: currentClient,
      toClient: selectedReceivingClient,
      serviceToTransfer: service,
      billRaisedFor,
      startDate,
      endDate,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg overflow-hidden animate-scale-in">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-800 dark:text-white">
            Transfer Service
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Service Variation Name */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
            <label className="sm:col-span-5 font-semibold text-gray-700 dark:text-gray-300">
              Service Variation Name
            </label>
            <div className="sm:col-span-7 font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700/50 px-3 py-1.5 rounded-xs border border-gray-200 dark:border-gray-600">
              {serviceVariationDisplayName}
            </div>
          </div>

          {/* Member Name / Mobile Number Search */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start relative" ref={searchContainerRef}>
            <label className="sm:col-span-5 font-semibold text-gray-700 dark:text-gray-300 pt-1.5">
              Member name/ Mobile Number <span className="text-red-500">*</span>
            </label>
            <div className="sm:col-span-7 relative w-full">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedReceivingClient(null);
                    setIsSearching(true);
                  }}
                  onFocus={() => setIsSearching(true)}
                  placeholder="Search by Name or Mobile"
                  className="w-full px-3 py-1.5 pr-8 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                />
                <Search size={14} className="absolute right-2.5 top-2 text-gray-400 pointer-events-none" />
              </div>

              {/* Suggestions Dropdown */}
              {isSearching && matchingClients.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-xl z-50 max-h-48 overflow-y-auto">
                  {matchingClients.map((client: any) => (
                    <div
                      key={client._id}
                      onClick={() => handleSelectReceiver(client)}
                      className="px-3 py-2 text-xs hover:bg-sky-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-750 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-gray-800 dark:text-gray-200">
                          {client.fullName}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">
                          {client.contactNumber || client.email || 'No contact'}
                        </div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                        {client.plan || 'Member'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {isSearching && searchTerm.trim() && matchingClients.length === 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-xl z-50 p-3 text-center text-xs text-gray-500">
                  No matching members found
                </div>
              )}
            </div>
          </div>

          {/* Bill Raised For */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
            <label className="sm:col-span-5 font-semibold text-gray-700 dark:text-gray-300">
              Bill Raised For
            </label>
            <div className="sm:col-span-7 flex items-center gap-6">
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-gray-800 dark:text-gray-200">
                <input
                  type="radio"
                  name="billRaisedFor"
                  value="From"
                  checked={billRaisedFor === 'From'}
                  onChange={() => setBillRaisedFor('From')}
                  className="w-3.5 h-3.5 text-sky-600 focus:ring-sky-500"
                />
                From
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-gray-800 dark:text-gray-200">
                <input
                  type="radio"
                  name="billRaisedFor"
                  value="To"
                  checked={billRaisedFor === 'To'}
                  onChange={() => setBillRaisedFor('To')}
                  className="w-3.5 h-3.5 text-sky-600 focus:ring-sky-500"
                />
                To
              </label>
            </div>
          </div>

          {/* Start Date */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
            <label className="sm:col-span-5 font-semibold text-gray-700 dark:text-gray-300">
              Start Date <span className="text-red-500">*</span>
            </label>
            <div className="sm:col-span-7">
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* End Date */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
            <label className="sm:col-span-5 font-semibold text-gray-700 dark:text-gray-300">
              End Date <span className="text-red-500">*</span>
            </label>
            <div className="sm:col-span-7">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-gray-50 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleBillAndTransfer}
            className="px-5 py-1.5 bg-[#00a8e8] hover:bg-[#0092ca] text-white font-semibold rounded text-xs transition-colors shadow-xs cursor-pointer"
          >
            Bill and Transfer
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 bg-[#00a8e8] hover:bg-[#0092ca] text-white font-semibold rounded text-xs transition-colors shadow-xs cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
