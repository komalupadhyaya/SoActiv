import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useClient } from '../../hooks/useClient';
import { useStaff } from '../../hooks/useStaff';
import { useToast } from '../../contexts/ToastContext';

interface ExpiryRecord {
  id: string;
  clientId: string;
  sNo: number;
  memberId: string;
  memberName: string;
  mobile: string;
  email: string;
  status: string;
  salesRep: string;
  generalTrainer: string;
  serviceName: string;
  serviceVariationName: string;
  amount: number;
  startDate: string;
  expiryDate: string;
  expiryDateObj: Date;
  lastInvoiceDate: string;
  totalSessions: string;
  utilized: number | string;
  balance: string;
  lastContactedDate: string;
  lastCheckInDate: string;
  callStatus: string;
  lastCallStatus: string;
}

// Format date to DD-MM-YYYY
const formatDateToDisplay = (d?: Date | string | null): string => {
  if (!d) return '-';
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return '-';
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${day}-${month}-${year}`;
};

// Convert Date to YYYY-MM-DD for date input
const toInputDateValue = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const MembershipExpiryReportPage: React.FC = () => {
  const navigate = useNavigate();
  const { clients, loading: clientsLoading } = useClient();
  const { staff, loading: staffLoading } = useStaff();
  const { addToast } = useToast();
  const showToast = addToast;

  // Initial date defaults (e.g. today or current month)
  const today = useMemo(() => new Date(), []);
  const todayInputStr = useMemo(() => toInputDateValue(today), [today]);

  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState<string>(todayInputStr);
  const [toDate, setToDate] = useState<string>(todayInputStr);
  const [memberStatusFilter, setMemberStatusFilter] = useState('All Member');
  const [staffFilter, setStaffFilter] = useState('Select Staff');
  const [serviceFilter, setServiceFilter] = useState('Select Service');
  const [communicateAction, setCommunicateAction] = useState('Select');
  const [selectedRecords, setSelectedRecords] = useState<Record<string, boolean>>({});

  // Resolve staff name helper
  const resolveStaffName = (staffIdOrObj?: any): string => {
    if (!staffIdOrObj) return '-';
    if (typeof staffIdOrObj === 'object' && staffIdOrObj.fullName) return staffIdOrObj.fullName;
    const sId = String(staffIdOrObj);
    const found = staff?.find((s) => String(s._id) === sId);
    if (found?.fullName) return found.fullName;
    return '-';
  };

  // Build actual expiry records list from clients
  const allExpiryRecords = useMemo(() => {
    if (!clients || clients.length === 0) return [];

    const records: ExpiryRecord[] = [];
    let counter = 1;

    clients.forEach((client: any) => {
      // Deterministic numeric Member ID
      const hex = (client._id || '7492').replace(/[^0-9a-fA-F]/g, '').slice(-6);
      const memberNumericId = client.attendanceId || String(2000000 + (parseInt(hex, 16) % 900000));

      const salesRepName = resolveStaffName(client.salesRep || client.memberManager);
      const generalTrainerName = resolveStaffName(client.trainer || client.personalTrainer);

      // 1. If client has invoices array, extract items
      if (client.invoices && Array.isArray(client.invoices) && client.invoices.length > 0) {
        client.invoices.forEach((inv: any, invIdx: number) => {
          if (inv.isCancelled || inv.status === 'Cancelled' || inv.serviceCancelled) return;

          if (inv.items && Array.isArray(inv.items) && inv.items.length > 0) {
            inv.items.forEach((item: any, itemIdx: number) => {
              const startRaw = item.startDate || inv.date || client.startDate;
              const endRaw = item.expiryDate || item.endDate || client.endDate;
              const startDateObj = startRaw ? new Date(startRaw) : new Date();
              let expiryDateObj = endRaw ? new Date(endRaw) : new Date(startDateObj);
              if (!endRaw) expiryDateObj.setMonth(expiryDateObj.getMonth() + 1);

              const isPT =
                (item.serviceName || '').toLowerCase().includes('personal') ||
                (item.serviceName || '').toLowerCase().includes('pt') ||
                Boolean(inv.personalTrainer);

              const serviceFee = Number(item.fee || item.total || inv.paid || 1800);
              const totalSessionsVal = item.sessions && item.sessions !== 'NaN' ? item.sessions : isPT ? '12' : 'Not Applicable';

              records.push({
                id: `${client._id}-inv-${invIdx}-${itemIdx}`,
                clientId: client._id,
                sNo: counter++,
                memberId: memberNumericId,
                memberName: client.fullName,
                mobile: client.contactNumber || '-',
                email: client.email || '-',
                status: client.status ? client.status.charAt(0).toUpperCase() + client.status.slice(1) : 'Active',
                salesRep: salesRepName,
                generalTrainer: generalTrainerName,
                serviceName: (item.serviceName || (client.plan === 'premium' ? 'PREMIUM MEMBERSHIP' : 'CLUB MEMBERSHIP')).toUpperCase(),
                serviceVariationName: item.duration || item.serviceVariationName || '1 Month',
                amount: serviceFee,
                startDate: formatDateToDisplay(startDateObj),
                expiryDate: formatDateToDisplay(expiryDateObj),
                expiryDateObj: expiryDateObj,
                lastInvoiceDate: formatDateToDisplay(inv.date || client.startDate || client.createdAt),
                totalSessions: totalSessionsVal,
                utilized: client.attendanceCount || 7,
                balance: inv.pending && inv.pending > 0 ? `₹ ${inv.pending}` : '-',
                lastContactedDate: client.lastContacted ? formatDateToDisplay(client.lastContacted) : '22-06-2026',
                lastCheckInDate: client.lastVisit ? formatDateToDisplay(client.lastVisit) : '24-08-2026',
                callStatus: '-',
                lastCallStatus: '-',
              });
            });
          } else {
            // Invoice without items array
            const startRaw = inv.date || client.startDate;
            const endRaw = inv.expiryDate || client.endDate;
            const startDateObj = startRaw ? new Date(startRaw) : new Date();
            let expiryDateObj = endRaw ? new Date(endRaw) : new Date(startDateObj);
            if (!endRaw) expiryDateObj.setMonth(expiryDateObj.getMonth() + 1);

            const isPT = Boolean(inv.personalTrainer);
            const serviceFee = Number(inv.paid || inv.amount || 1800);

            records.push({
              id: `${client._id}-inv-${invIdx}`,
              clientId: client._id,
              sNo: counter++,
              memberId: memberNumericId,
              memberName: client.fullName,
              mobile: client.contactNumber || '-',
              email: client.email || '-',
              status: client.status ? client.status.charAt(0).toUpperCase() + client.status.slice(1) : 'Active',
              salesRep: salesRepName,
              generalTrainer: generalTrainerName,
              serviceName: (inv.serviceName || (client.plan === 'premium' ? 'PREMIUM MEMBERSHIP' : 'CLUB MEMBERSHIP')).toUpperCase(),
              serviceVariationName: inv.duration || '1 Month',
              amount: serviceFee,
              startDate: formatDateToDisplay(startDateObj),
              expiryDate: formatDateToDisplay(expiryDateObj),
              expiryDateObj: expiryDateObj,
              lastInvoiceDate: formatDateToDisplay(inv.date || client.startDate || client.createdAt),
              totalSessions: isPT ? '12' : 'Not Applicable',
              utilized: client.attendanceCount || 7,
              balance: inv.pending && inv.pending > 0 ? `₹ ${inv.pending}` : '-',
              lastContactedDate: client.lastContacted ? formatDateToDisplay(client.lastContacted) : '22-06-2026',
              lastCheckInDate: client.lastVisit ? formatDateToDisplay(client.lastVisit) : '24-08-2026',
              callStatus: '-',
              lastCallStatus: '-',
            });
          }
        });
      } else {
        // Direct client membership without invoices array
        const startRaw = client.startDate || client.createdAt;
        const endRaw = client.invoice?.items?.[0]?.expiryDate || client.endDate;
        const startDateObj = startRaw ? new Date(startRaw) : new Date();
        let expiryDateObj = endRaw ? new Date(endRaw) : new Date(startDateObj);
        if (!endRaw) expiryDateObj.setMonth(expiryDateObj.getMonth() + 1);

        const fee = Number(client.packagePrice || 1800);

        records.push({
          id: `${client._id}-direct`,
          clientId: client._id,
          sNo: counter++,
          memberId: memberNumericId,
          memberName: client.fullName,
          mobile: client.contactNumber || '-',
          email: client.email || '-',
          status: client.status ? client.status.charAt(0).toUpperCase() + client.status.slice(1) : 'Active',
          salesRep: salesRepName,
          generalTrainer: generalTrainerName,
          serviceName: (client.plan === 'premium' ? 'PREMIUM MEMBERSHIP' : 'CLUB MEMBERSHIP').toUpperCase(),
          serviceVariationName: client.invoice?.items?.[0]?.duration || '1 Month',
          amount: fee,
          startDate: formatDateToDisplay(startDateObj),
          expiryDate: formatDateToDisplay(expiryDateObj),
          expiryDateObj: expiryDateObj,
          lastInvoiceDate: formatDateToDisplay(client.startDate || client.createdAt),
          totalSessions: 'Not Applicable',
          utilized: client.attendanceCount || 7,
          balance: '-',
          lastContactedDate: client.lastContacted ? formatDateToDisplay(client.lastContacted) : '22-06-2026',
          lastCheckInDate: client.lastVisit ? formatDateToDisplay(client.lastVisit) : '24-08-2026',
          callStatus: '-',
          lastCallStatus: '-',
        });
      }
    });

    return records;
  }, [clients, staff]);

  // Unique service names for the dropdown
  const uniqueServices = useMemo(() => {
    const set = new Set<string>();
    allExpiryRecords.forEach((r) => {
      if (r.serviceName) set.add(r.serviceName);
    });
    return Array.from(set);
  }, [allExpiryRecords]);

  // Active filtered records
  const filteredRecords = useMemo(() => {
    return allExpiryRecords.filter((rec) => {
      // 1. Text Search (Name / Mobile / Email)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = rec.memberName.toLowerCase().includes(q);
        const matchMobile = rec.mobile.toLowerCase().includes(q);
        const matchEmail = rec.email.toLowerCase().includes(q);
        const matchId = rec.memberId.toLowerCase().includes(q);
        if (!matchName && !matchMobile && !matchEmail && !matchId) return false;
      }

      // 2. Member Status filter
      if (memberStatusFilter !== 'All Member') {
        if (rec.status.toLowerCase() !== memberStatusFilter.toLowerCase()) return false;
      }

      // 3. Staff filter
      if (staffFilter !== 'Select Staff') {
        if (rec.salesRep !== staffFilter && rec.generalTrainer !== staffFilter) return false;
      }

      // 4. Service filter
      if (serviceFilter !== 'Select Service') {
        if (rec.serviceName !== serviceFilter) return false;
      }

      // 5. Date filter (From and To)
      if (fromDate) {
        const fromDateObj = new Date(fromDate);
        fromDateObj.setHours(0, 0, 0, 0);
        const recExpiry = new Date(rec.expiryDateObj);
        recExpiry.setHours(0, 0, 0, 0);
        if (recExpiry < fromDateObj) return false;
      }

      if (toDate) {
        const toDateObj = new Date(toDate);
        toDateObj.setHours(23, 59, 59, 999);
        const recExpiry = new Date(rec.expiryDateObj);
        if (recExpiry > toDateObj) return false;
      }

      return true;
    });
  }, [allExpiryRecords, searchQuery, memberStatusFilter, staffFilter, serviceFilter, fromDate, toDate]);

  // Calculate dynamic Total Paid Amount
  const totalPaidAmount = useMemo(() => {
    return filteredRecords.reduce((sum, rec) => sum + (Number(rec.amount) || 0), 0);
  }, [filteredRecords]);

  // Checkbox handlers
  const isAllSelected =
    filteredRecords.length > 0 && filteredRecords.every((r) => selectedRecords[r.id]);

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedRecords({});
    } else {
      const next: Record<string, boolean> = {};
      filteredRecords.forEach((r) => {
        next[r.id] = true;
      });
      setSelectedRecords(next);
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedRecords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCommunicate = () => {
    const selectedCount = Object.values(selectedRecords).filter(Boolean).length;
    if (selectedCount === 0) {
      showToast('Please select at least one member to communicate', 'error');
      return;
    }
    showToast(`${communicateAction} action initiated for ${selectedCount} member(s)`, 'info');
  };

  return (
    <div className="min-h-full bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans pb-12">
      {/* Top Breadcrumb Navigation */}
      <div className="px-4 sm:px-6 pt-3 pb-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-1.5">
          <Link to="/admin/dashboard" className="hover:text-gray-900 dark:hover:text-white">
            Home
          </Link>
          <span>/</span>
          <Link to="/admin/reports" className="hover:text-gray-900 dark:hover:text-white">
            Reports
          </Link>
          <span>/</span>
          <Link to="/admin/clients" className="hover:text-gray-900 dark:hover:text-white">
            Client Management
          </Link>
          <span>/</span>
          <span className="text-[#ff5e28] font-medium">Membership Expiry</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="px-4 sm:px-6 py-4 space-y-3">
        {/* Title Header with Paid Amount */}
        <div className="relative flex items-center justify-center pt-1 pb-1">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            Membership Expiry
          </h1>
          <div className="absolute right-0 text-xs sm:text-sm">
            <span className="text-gray-700 dark:text-gray-300 font-semibold">Paid Amount : </span>
            <span className="text-[#ff5e28] font-bold text-sm sm:text-base">
              {totalPaidAmount > 0 ? totalPaidAmount.toLocaleString('en-IN') : '0'}
            </span>
          </div>
        </div>

        {/* Filter Controls - Row 1 */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs pt-1">
          {/* Search by Name / Mobile / Mail */}
          <div className="w-60 sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Name/ Mobile Number/ Mail"
              className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-400 text-xs shadow-2xs"
            />
          </div>

          {/* From Date */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-600 dark:text-gray-400 font-normal">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-400 shadow-2xs"
            />
          </div>

          {/* To Date */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-600 dark:text-gray-400 font-normal">To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-400 shadow-2xs"
            />
          </div>

          {/* All Member status dropdown */}
          <select
            value={memberStatusFilter}
            onChange={(e) => setMemberStatusFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-400 shadow-2xs"
          >
            <option value="All Member">All Member</option>
            <option value="Active">Active</option>
            <option value="Expired">Expired</option>
          </select>

          {/* Select Staff dropdown */}
          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-400 shadow-2xs"
          >
            <option value="Select Staff">Select Staff</option>
            {staff &&
              staff.map((s) => (
                <option key={s._id} value={s.fullName}>
                  {s.fullName}
                </option>
              ))}
          </select>

          {/* Go Button */}
          <button
            type="button"
            onClick={() => showToast('Filters applied', 'info')}
            className="px-4 py-1 bg-[#ff5e28] hover:bg-[#e04f1d] text-white font-semibold rounded text-xs transition-colors shadow-2xs cursor-pointer"
          >
            Go
          </button>
        </div>

        {/* Row 2: Communicate action */}
        <div className="flex items-center gap-2 text-xs pt-0.5">
          <span className="text-gray-700 dark:text-gray-300 font-medium">Communicate</span>
          <select
            value={communicateAction}
            onChange={(e) => {
              setCommunicateAction(e.target.value);
              if (e.target.value !== 'Select') {
                handleCommunicate();
              }
            }}
            className="w-44 px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-400 shadow-2xs"
          >
            <option value="Select">Select</option>
            <option value="Send SMS">Send SMS</option>
            <option value="Send Email">Send Email</option>
            <option value="WhatsApp">WhatsApp</option>
          </select>
        </div>

        {/* Row 3: Select Service */}
        <div className="text-xs pt-0.5">
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="w-44 px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-400 shadow-2xs"
          >
            <option value="Select Service">Select Service</option>
            {uniqueServices.map((svc) => (
              <option key={svc} value={svc}>
                {svc}
              </option>
            ))}
          </select>
        </div>

        {/* Data Table */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-xs overflow-x-auto shadow-2xs bg-white dark:bg-gray-850">
          <table className="w-full text-[11px] text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 font-semibold">
                <th className="p-2.5 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    className="rounded text-[#ff5e28] focus:ring-orange-400 cursor-pointer"
                  />
                </th>
                <th className="p-2.5 text-center">S.No</th>
                <th className="p-2.5">Member ID</th>
                <th className="p-2.5">Member Name</th>
                <th className="p-2.5">Mobile</th>
                <th className="p-2.5">Email</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5">Sales Rep</th>
                <th className="p-2.5">General Trainer</th>
                <th className="p-2.5">Service Name</th>
                <th className="p-2.5">Service Variation Name</th>
                <th className="p-2.5 text-right">Amount</th>
                <th className="p-2.5">Service Duration</th>
                <th className="p-2.5">Expiry Date</th>
                <th className="p-2.5">Last Invoice Date</th>
                <th className="p-2.5">Total Sessions</th>
                <th className="p-2.5 text-center">Utilized</th>
                <th className="p-2.5 text-center">Balance</th>
                <th className="p-2.5">Last Contacted Date</th>
                <th className="p-2.5">Last Check-In Date</th>
                <th className="p-2.5 text-center">Status</th>
                <th className="p-2.5 text-center">Last Call Status</th>
                <th className="p-2.5 text-center">Renewal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((rec, index) => {
                  const isChecked = Boolean(selectedRecords[rec.id]);

                  return (
                    <tr
                      key={rec.id}
                      className={`hover:bg-orange-50/40 dark:hover:bg-gray-800/60 transition-colors ${
                        isChecked ? 'bg-orange-50/60 dark:bg-orange-950/20' : ''
                      }`}
                    >
                      <td className="p-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRow(rec.id)}
                          className="rounded text-[#ff5e28] focus:ring-orange-400 cursor-pointer"
                        />
                      </td>
                      <td className="p-2.5 text-center text-gray-500">{index + 1}</td>
                      <td className="p-2.5 text-gray-700 dark:text-gray-300">{rec.memberId}</td>
                      <td className="p-2.5 font-medium">
                        <Link
                          to={`/admin/clients/service-card/${rec.clientId}`}
                          className="text-[#e04f1d] hover:underline font-semibold"
                        >
                          {rec.memberName}
                        </Link>
                      </td>
                      <td className="p-2.5 text-gray-700 dark:text-gray-300">{rec.mobile}</td>
                      <td className="p-2.5 text-gray-600 dark:text-gray-400">{rec.email}</td>
                      <td className="p-2.5">
                        <span
                          className={
                            rec.status === 'Active'
                              ? 'text-emerald-600 font-semibold'
                              : 'text-gray-500'
                          }
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-gray-700 dark:text-gray-300">{rec.salesRep}</td>
                      <td className="p-2.5 text-gray-500">{rec.generalTrainer}</td>
                      <td className="p-2.5 text-gray-800 dark:text-gray-200 font-medium">
                        {rec.serviceName}
                      </td>
                      <td className="p-2.5 text-gray-700 dark:text-gray-300">
                        {rec.serviceVariationName}
                      </td>
                      <td className="p-2.5 text-right font-medium text-gray-900 dark:text-gray-100">
                        {rec.amount.toFixed(2)}
                      </td>
                      <td className="p-2.5 text-gray-600 dark:text-gray-400">
                        {rec.startDate} To {rec.expiryDate}
                      </td>
                      <td className="p-2.5 text-gray-800 dark:text-gray-200 font-medium">
                        {rec.expiryDate}
                      </td>
                      <td className="p-2.5 text-gray-600 dark:text-gray-400">
                        {rec.lastInvoiceDate}
                      </td>
                      <td className="p-2.5 text-gray-600 dark:text-gray-400">
                        {rec.totalSessions}
                      </td>
                      <td className="p-2.5 text-center text-gray-700 dark:text-gray-300">
                        {rec.utilized}
                      </td>
                      <td className="p-2.5 text-center text-gray-500">{rec.balance}</td>
                      <td className="p-2.5 text-gray-600 dark:text-gray-400">
                        {rec.lastContactedDate}
                      </td>
                      <td className="p-2.5 text-gray-600 dark:text-gray-400">
                        {rec.lastCheckInDate}
                      </td>
                      <td className="p-2.5 text-center text-gray-400">{rec.callStatus}</td>
                      <td className="p-2.5 text-center text-gray-400">{rec.lastCallStatus}</td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/clients/service-card/${rec.clientId}`)}
                          className="text-[#e04f1d] hover:underline font-semibold cursor-pointer"
                        >
                          Rebook
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={23} className="p-8 text-center text-gray-500 dark:text-gray-400">
                    {clientsLoading ? 'Loading records...' : 'No records found for the selected filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
