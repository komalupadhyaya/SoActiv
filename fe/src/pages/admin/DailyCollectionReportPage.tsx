import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Mail, MessageSquare, Printer, Download, Eye, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useClient } from '../../hooks/useClient';
import { useToast } from '../../contexts/ToastContext';

export const DailyCollectionReportPage: React.FC = () => {
  const { clients, loading } = useClient();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<string>('Payment');
  const [activeSubTab, setActiveSubTab] = useState<string>('Daily Collection');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isSearchFilterOpen, setIsSearchFilterOpen] = useState<boolean>(false);

  // Safe helper to extract string from potential populated object
  const getStaffName = (staffField: any): string => {
    if (!staffField) return 'Admin / Head Branch';
    if (typeof staffField === 'object') {
      return staffField.fullName || staffField.name || 'Admin / Head Branch';
    }
    return String(staffField);
  };

  const getClientName = (clientField: any): string => {
    if (!clientField) return 'Member';
    if (typeof clientField === 'object') {
      return clientField.fullName || clientField.name || 'Member';
    }
    return String(clientField);
  };

  // Map clients to bills / collections records
  const billsData = useMemo(() => {
    if (!clients || clients.length === 0) {
      return [
        {
          id: '1',
          billNumber: 'BILL-100001',
          memberName: 'Prince K',
          memberPhone: '+91914777383759',
          paymentDetails: 'Cash: 15,000',
          billDate: '25 Aug 2026',
          fromDate: '25 Aug 2026',
          toDate: '25 Aug 2027',
          grandTotal: 15000,
          taxDue: 0,
          balance: 0,
          generatedBy: 'sales',
        },
      ];
    }

    return clients.map((c: any, idx: number) => {
      const billNo = `BILL-${100000 + idx + 1}`;
      const inv = (c.invoices && c.invoices.length > 0) ? c.invoices[0] : c.invoice;
      const totalAmount = Number(inv?.totalDue ?? inv?.net ?? inv?.amount ?? c.packagePrice) || 2500;
      const paid = inv?.paid !== undefined
        ? Number(inv.paid)
        : inv?.totalPaid !== undefined
        ? Number(inv.totalPaid)
        : (Array.isArray(inv?.paymentModes) && inv.paymentModes.length > 0)
        ? inv.paymentModes.reduce((acc: number, pm: any) => acc + (Number(pm.amount) || 0), 0)
        : totalAmount;
      const pending = inv?.pending !== undefined
        ? Number(inv.pending)
        : inv?.pendingAmount !== undefined
        ? Number(inv.pendingAmount)
        : Math.max(0, totalAmount - paid);

      const bDate = c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '26 Aug 2026';
      const fDate = c.startDate ? new Date(c.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : bDate;

      // Check if invoice items has specific expiryDate or duration
      const invoiceExpiry = inv?.items?.[0]?.expiryDate || c.invoice?.items?.[0]?.expiryDate;
      const calculatedEndDate = (() => {
        if (invoiceExpiry) return new Date(invoiceExpiry);
        if (c.endDate) {
          const startMs = new Date(c.startDate || c.createdAt || Date.now()).getTime();
          const endMs = new Date(c.endDate).getTime();
          const diffDays = (endMs - startMs) / (1000 * 3600 * 24);
          if (diffDays > 300 && (totalAmount <= 5000 || c.plan === 'basic' || !c.invoice)) {
            const d = new Date(c.startDate || c.createdAt || Date.now());
            d.setMonth(d.getMonth() + 1);
            return d;
          }
          return new Date(c.endDate);
        }
        const d = new Date(c.startDate || c.createdAt || Date.now());
        d.setMonth(d.getMonth() + 1);
        return d;
      })();

      const tDate = calculatedEndDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const payMode = c.paymentMode || inv?.mode || inv?.paymentModes?.find((pm: any) => pm.mode && pm.mode !== 'Select')?.mode || 'Cash';

      return {
        id: c._id || String(idx),
        billNumber: billNo,
        memberName: getClientName(c.fullName),
        memberPhone: typeof c.contactNumber === 'object' ? String((c.contactNumber as any)?.phone || '') : (c.contactNumber || ''),
        paymentDetails: `${payMode}: ${paid.toLocaleString()}`,
        billDate: bDate,
        fromDate: fDate,
        toDate: tDate,
        grandTotal: totalAmount,
        taxDue: Number(inv?.taxDue || inv?.tax || 0),
        balance: pending,
        generatedBy: getStaffName(c.salesRep) === 'Admin / Head Branch' ? 'sales' : getStaffName(c.salesRep),
      };
    });
  }, [clients]);

  // Filter bills
  const filteredBills = useMemo(() => {
    if (!searchTerm.trim()) return billsData;
    const term = searchTerm.toLowerCase();
    return billsData.filter(
      (b) =>
        b.billNumber.toLowerCase().includes(term) ||
        b.memberName.toLowerCase().includes(term) ||
        b.memberPhone.toLowerCase().includes(term) ||
        b.paymentDetails.toLowerCase().includes(term)
    );
  }, [billsData, searchTerm]);

  const totalPages = Math.ceil(filteredBills.length / entriesPerPage) || 1;
  const paginatedBills = filteredBills.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  const handleActionClick = (actionName: string) => {
    showToast(`${actionName} triggered`, 'info');
  };

  return (
    <div className="min-h-full bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col font-sans">
      {/* Breadcrumb Navigation */}
      <div className="px-4 sm:px-6 pt-4 pb-2.5 flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
        <Link to="/admin/dashboard" className="hover:text-gray-900 dark:hover:text-gray-200">
          Home
        </Link>
        <span>/</span>
        <Link to="/admin/reports" className="hover:text-gray-900 dark:hover:text-gray-200">
          Reports
        </Link>
        <span>/</span>
        <span>Finance & Tax</span>
        <span>/</span>
        <span className="text-[#ff5e28] font-medium">Daily Collection</span>
      </div>

      {/* Main Tabs (Enquiry, Payment, Staff, etc.) */}
      <div className="px-4 sm:px-6 pt-1 border-b border-gray-200 dark:border-gray-700 flex items-center gap-1.5 overflow-x-auto text-xs sm:text-sm">
        {['Enquiry', 'Payment', 'Staff', 'Marketing', 'Training', 'Operations'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 font-semibold text-xs transition-colors cursor-pointer whitespace-nowrap rounded-t-sm ${
              activeTab === tab
                ? 'bg-[#f59e0b] text-white shadow-xs'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Sub Header / Orange Bar */}
      <div className="px-4 sm:px-6 py-2 bg-[#f59e0b] text-white flex flex-wrap items-center justify-between gap-2.5 shadow-xs">
        <div className="font-bold text-xs sm:text-sm tracking-wide uppercase">
          REPORTS - DAILY COLLECTION
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            'View Tax (H) Summary',
            'Hsn Summary',
            'Bill Details Collection',
            "Today's Bills",
            'Export Excel',
            'Daily Collection Summary',
            'Bill Collection User Wise',
          ].map((btnText) => (
            <button
              key={btnText}
              type="button"
              onClick={() => handleActionClick(btnText)}
              className="px-2.5 py-1 text-[11px] font-semibold bg-white text-gray-800 hover:bg-gray-100 rounded-sm shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
            >
              {btnText}
            </button>
          ))}
        </div>
      </div>

      {/* Table Controls (Entries selector + Search Filter + Search bar) */}
      <div className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <span>Show</span>
          <select
            value={entriesPerPage}
            onChange={(e) => {
              setEntriesPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>entries</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSearchFilterOpen(!isSearchFilterOpen)}
            className="px-3 py-1 font-semibold text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-xs hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
          >
            Search Filter ▾
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-600 dark:text-gray-300 font-medium">Search:</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Collapsible Search Filter Section if opened */}
      {isSearchFilterOpen && (
        <div className="mx-4 sm:mx-6 mb-3 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-gray-500 mb-1">From Date:</label>
            <input type="date" className="px-2 py-1 border border-gray-300 rounded bg-white dark:bg-gray-700" />
          </div>
          <div>
            <label className="block text-gray-500 mb-1">To Date:</label>
            <input type="date" className="px-2 py-1 border border-gray-300 rounded bg-white dark:bg-gray-700" />
          </div>
          <div className="pt-4">
            <button type="button" onClick={() => showToast('Filter applied', 'success')} className="px-3 py-1 bg-amber-500 text-white font-semibold rounded">Apply</button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="px-4 sm:px-6 pb-6 overflow-x-auto">
        <div className="border border-gray-200 dark:border-gray-700 rounded shadow-2xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-bold text-gray-800 dark:text-gray-200">
                <th className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">Bill Number</th>
                <th className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">Member</th>
                <th className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">Payment Received Details</th>
                <th className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">Bill Date</th>
                <th className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">From</th>
                <th className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">To</th>
                <th className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">Grand Total</th>
                <th className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">Tax Due</th>
                <th className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">Balance</th>
                <th className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700 text-center whitespace-nowrap">Actions</th>
                <th className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700 text-center whitespace-nowrap">Send Invoice / Receipt By</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Bill Generated User / Branch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-gray-500">
                    Loading daily collection bills...
                  </td>
                </tr>
              ) : paginatedBills.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-gray-400">
                    No bills found
                  </td>
                </tr>
              ) : (
                paginatedBills.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700 font-semibold text-[#0284c7]">
                      {b.billNumber}
                    </td>
                    <td className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700">
                      <div className="font-medium text-gray-900 dark:text-white">{b.memberName}</div>
                      <div className="text-[11px] text-gray-500">{b.memberPhone}</div>
                    </td>
                    <td className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700 font-medium">
                      {b.paymentDetails}
                    </td>
                    <td className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                      {b.billDate}
                    </td>
                    <td className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                      {b.fromDate}
                    </td>
                    <td className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                      {b.toDate}
                    </td>
                    <td className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">
                      ₹{b.grandTotal.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                      ₹{b.taxDue}
                    </td>
                    <td className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                      ₹{b.balance}
                    </td>
                    <td className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleActionClick(`Print Bill ${b.billNumber}`)}
                          className="text-[#0284c7] hover:text-[#0369a1] p-1 cursor-pointer"
                          title="Print / View Invoice"
                        >
                          <Printer size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleActionClick(`Download Bill ${b.billNumber}`)}
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white p-1 cursor-pointer"
                          title="Download PDF"
                        >
                          <Download size={15} />
                        </button>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700 text-center">
                      <div className="flex items-center justify-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleActionClick(`Send Email for ${b.billNumber}`)}
                          className="text-[#0284c7] hover:text-[#0369a1] p-1 cursor-pointer"
                          title="Send Email"
                        >
                          <Mail size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleActionClick(`Send SMS for ${b.billNumber}`)}
                          className="text-green-600 hover:text-green-700 p-1 cursor-pointer"
                          title="Send SMS"
                        >
                          <MessageSquare size={15} />
                        </button>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300 font-medium">
                      {b.generatedBy}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600 dark:text-gray-400">
          <div>
            Showing {filteredBills.length === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1} to{' '}
            {Math.min(currentPage * entriesPerPage, filteredBills.length)} of {filteredBills.length} entries
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 disabled:opacity-40 hover:bg-gray-50 cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-3 py-1 font-semibold text-gray-800 dark:text-gray-200">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 disabled:opacity-40 hover:bg-gray-50 cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
