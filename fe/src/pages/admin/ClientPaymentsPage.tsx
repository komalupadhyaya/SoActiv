import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Printer,
  Send,
  FileText,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useClient } from '../../hooks/useClient';
import { useToast } from '../../contexts/ToastContext';
import { ProFormaInvoiceModal } from '../../components/modals/ProFormaInvoiceModal';
import {
  buildCollectPaymentUpdate,
  getClientVisibleInvoices,
  getInvoicePaymentBreakdown,
} from '../../utils/invoicePayment';

const formatCurrency = (val: number | string) => {
  const num = Number(val) || 0;
  return `₹ ${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const ClientPaymentsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clients, updateClient, fetchClients, getClientById } = useClient();
  const { addToast } = useToast();
  const showToast = addToast;

  const memId = id || searchParams.get('memid') || '';

  const [directClient, setDirectClient] = useState<any>(null);

  React.useEffect(() => {
    fetchClients?.();
  }, [fetchClients]);

  React.useEffect(() => {
    if (memId && getClientById) {
      getClientById(memId).then((res) => {
        if (res) setDirectClient(res);
      });
    }
  }, [memId, getClientById]);

  const client = useMemo(() => {
    if (directClient && (!memId || String(directClient._id) === String(memId))) {
      return directClient;
    }
    if (!memId) return clients[0] || null;
    return clients.find((c) => String(c._id) === String(memId)) || directClient || clients[0] || null;
  }, [clients, memId, directClient]);

  const [activeTab, setActiveTab] = useState<'Payments' | string>('Payments');
  const [filterBy, setFilterBy] = useState<string>('All');
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [collectInvoice, setCollectInvoice] = useState<any>(null);
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectMode, setCollectMode] = useState<string>('Paytm');
  const [collectNotes, setCollectNotes] = useState<string>('');
  const [isCollecting, setIsCollecting] = useState(false);

  const paymentMode = useMemo(() => {
    if ((client as any)?.paymentMode) return (client as any).paymentMode;
    if ((client as any)?.invoice?.paymentModes?.length > 0) {
      const pm = (client as any).invoice.paymentModes.find((p: any) => p.mode && p.mode !== 'Select');
      if (pm?.mode) return pm.mode;
    }
    if ((client as any)?.paymentMethod) return (client as any).paymentMethod;
    return 'Cash';
  }, [client]);

  const clientName = client?.fullName || 'Member';
  const packagePrice = client?.packagePrice !== undefined ? client.packagePrice : 0;
  const formattedDate = client?.startDate
    ? new Date(client.startDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).replace(/\//g, '-')
    : '26-08-2026';

  const defaultInvoiceNo = useMemo(() => {
    if ((client as any)?.invoice?.invoiceNo) return (client as any).invoice.invoiceNo;
    if ((client as any)?.invoiceNo) return (client as any).invoiceNo;

    const dateObj = client?.startDate
      ? new Date(client.startDate)
      : client?.createdAt
      ? new Date(client.createdAt)
      : new Date();
    const monthStr = dateObj.toLocaleString('en-US', { month: 'short' });
    const yearStr = dateObj.getFullYear();

    if (client?._id) {
      const hex = client._id.replace(/[^0-9a-fA-F]/g, '').slice(-4) || '94';
      const num = (parseInt(hex, 16) % 90) + 10;
      return `${monthStr}${num}-${yearStr}`;
    }

    return `${monthStr}94-${yearStr}`;
  }, [client]);

  const allInvoices = useMemo(() => {
    if (!client) return [];

    const mapInvoice = (inv: any, idx: number) => {
      const isCancelled = Boolean(inv.isCancelled || inv.status === 'Cancelled');
      const isPaymentCancelled = Boolean(inv.paymentCancelled);

      const invDate = inv.date || inv.invoiceDate || inv.createdAt || client.startDate;
      const formattedInvDate = invDate
        ? new Date(invDate).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }).replace(/\//g, '-')
        : formattedDate;

      const invAmount = Number(inv.amount ?? inv.totalDue ?? packagePrice) || 0;
      const { net: invNet, paid: invPaid, pending: invPending } = getInvoicePaymentBreakdown(
        inv,
        packagePrice
      );

      const invTax = Number(inv.tax ?? inv.taxDue ?? 0) || 0;
      const invMode = isCancelled
        ? '-'
        : isPaymentCancelled
        ? 'Pending'
        : inv.mode ||
          inv.paymentModes?.find((pm: any) => pm.mode && pm.mode !== 'Select')?.mode ||
          paymentMode;

      return {
        id: inv._id || inv.id || String(idx),
        purchasedDate: formattedInvDate,
        name: clientName,
        invoiceNo: inv.invoiceNo || (idx === 0 ? defaultInvoiceNo : `${defaultInvoiceNo}-${idx + 1}`),
        amount: invAmount,
        tax: invTax,
        net: invNet,
        paid: invPaid,
        pending: invPending,
        mode: invMode,
        writeOff: isCancelled ? 'Yes (Cancelled)' : (inv.writeOff || 'No'),
        isCancelled: isCancelled,
        isPaymentCancelled: isPaymentCancelled,
        rawInvoice: inv,
      };
    };

    // Exclude transferred-in membership invoices from recipient's Payments page.
    const visibleInvoices = getClientVisibleInvoices(client);
    if (visibleInvoices.length > 0) {
      return visibleInvoices.map((inv: any, idx: number) => mapInvoice(inv, idx));
    }

    const isInactiveOrTransfer =
      client.status === 'inactive' ||
      (client as any).isTransfer ||
      (Number(client.packagePrice) === 0 && !client.invoice && (!client.invoices || client.invoices.length === 0));

    if (!isInactiveOrTransfer && Number(packagePrice) > 0) {
      const fbAmount = Number(packagePrice) || 3000;
      const fbPaid = (client as any).paid !== undefined
        ? Number((client as any).paid)
        : (client as any).pendingAmount !== undefined
        ? Math.max(0, fbAmount - Number((client as any).pendingAmount))
        : fbAmount;
      const fbPending = (client as any).pending !== undefined
        ? Number((client as any).pending)
        : (client as any).pendingAmount !== undefined
        ? Number((client as any).pendingAmount)
        : Math.max(0, fbAmount - fbPaid);

      return [
        {
          id: '1',
          purchasedDate: formattedDate,
          name: clientName,
          invoiceNo: defaultInvoiceNo,
          amount: fbAmount,
          tax: 0,
          net: fbAmount,
          paid: fbPaid,
          pending: fbPending,
          mode: paymentMode,
          writeOff: 'No',
          rawInvoice: null,
        },
      ];
    }

    return [];
  }, [client, clientName, defaultInvoiceNo, formattedDate, packagePrice, paymentMode]);

  const filteredInvoices = useMemo(() => {
    if (filterBy === 'All') return allInvoices;
    if (filterBy === 'Paid') return allInvoices.filter((inv) => inv.pending === 0);
    if (filterBy === 'Pending') return allInvoices.filter((inv) => inv.pending > 0);
    if (filterBy === 'Pro Forma') return allInvoices;
    return allInvoices;
  }, [allInvoices, filterBy]);

  const handleSaveCollectFromPaymentsPage = async () => {
    if (!client?._id || !collectInvoice) return;
    setIsCollecting(true);
    try {
      const { amount, updatePayload } = buildCollectPaymentUpdate(
        client,
        collectInvoice,
        collectAmount,
        collectMode,
        collectNotes
      );

      const result = await updateClient(client._id, updatePayload as any);
      if (!result?.success) {
        return;
      }
      if (result.data) {
        setDirectClient(result.data);
      }

      setIsCollectModalOpen(false);
      showToast(`Payment of ₹ ${amount} collected successfully via ${collectMode}!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to collect payment', 'error');
    } finally {
      setIsCollecting(false);
    }
  };

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
    setActiveTab(tab);
    if (tab === 'Profile' && client) {
      navigate(`/admin/client-form/${client._id}`);
    } else if (tab === 'Service Card' && client) {
      navigate(`/admin/clients/service-card/${client._id}`);
    } else if (tab === 'Appointments' && client) {
      navigate(`/admin/clients/appointments/${client._id}`);
    } else if (tab === 'Training' && client) {
      navigate(`/admin/clients/training/${client._id}`);
    } else if (tab === 'Schedule') {
      navigate('/admin/schedule');
    }
  };

  const handleSaveInvoice = async (invoiceData: any) => {
    const dateObj = new Date();
    const monthStr = dateObj.toLocaleString('en-US', { month: 'short' });
    const yearStr = dateObj.getFullYear();
    const randomNum = Math.floor(Math.random() * 90) + 10;
    const newInvoiceNo = `${monthStr}${randomNum}-${yearStr}`;

    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const isClientExpiredByDate = client?.endDate
      ? new Date(client.endDate).setHours(0, 0, 0, 0) < todayMidnight.getTime()
      : false;

    const isRenewalAction =
      client?.status === 'expired' ||
      isClientExpiredByDate ||
      (client?.invoices && client.invoices.length > 0) ||
      Boolean(client?.invoice);

    const firstItem = invoiceData.items?.[0];
    const newStartDate =
      firstItem?.startDate ||
      invoiceData.startDate ||
      invoiceData.invoiceDate ||
      new Date().toISOString();
    let newEndDate = firstItem?.expiryDate || invoiceData.expiryDate;
    if (!newEndDate) {
      const endD = new Date(newStartDate);
      endD.setMonth(endD.getMonth() + 1);
      newEndDate = endD.toISOString();
    }

    const entryTotalDue = Number(invoiceData.totalDue ?? packagePrice) || 0;
    const entryPaid =
      invoiceData.paid !== undefined && !isNaN(Number(invoiceData.paid))
        ? Number(invoiceData.paid)
        : invoiceData.totalPaid !== undefined && !isNaN(Number(invoiceData.totalPaid))
        ? Number(invoiceData.totalPaid)
        : (invoiceData.paymentModes || []).reduce((acc: number, pm: any) => acc + (Number(pm.amount) || 0), 0);
    const entryPending =
      invoiceData.pending !== undefined && !isNaN(Number(invoiceData.pending))
        ? Number(invoiceData.pending)
        : invoiceData.pendingAmount !== undefined && !isNaN(Number(invoiceData.pendingAmount))
        ? Number(invoiceData.pendingAmount)
        : Math.max(0, entryTotalDue - entryPaid);

    const newInvoiceEntry = {
      ...invoiceData,
      invoiceNo: newInvoiceNo,
      createdAt: new Date().toISOString(),
      date: invoiceData.invoiceDate || new Date().toISOString(),
      amount: entryTotalDue,
      tax: invoiceData.taxDue || 0,
      net: entryTotalDue,
      paid: entryPaid,
      totalPaid: entryPaid,
      pending: entryPending,
      pendingAmount: entryPending,
      mode:
        invoiceData.paymentModes?.find((pm: any) => pm.mode && pm.mode !== 'Select')?.mode ||
        paymentMode,
      status: entryPending === 0 ? 'Paid' : 'Partially Paid',
      writeOff: 'No',
      isUpgrade: !isRenewalAction,
      isRenewal: isRenewalAction,
      startDate: newStartDate,
      expiryDate: newEndDate,
      serviceName: firstItem?.serviceName || client?.plan,
      duration: firstItem?.duration || '12 Months',
    };

    const existingInvoices =
      client?.invoices && client.invoices.length > 0
        ? [...client.invoices]
        : client?.invoice
        ? [client.invoice]
        : [
            {
              invoiceNo: defaultInvoiceNo,
              createdAt: client?.startDate || new Date().toISOString(),
              date: client?.startDate || new Date().toISOString(),
              amount: packagePrice,
              tax: 0,
              net: packagePrice,
              paid: packagePrice,
              pending: 0,
              mode: paymentMode,
              status: 'Paid',
              writeOff: 'No',
            },
          ];

    const updatedInvoices = [newInvoiceEntry, ...existingInvoices];

    if (client?._id) {
      const selectedSvcLower = (firstItem?.serviceName || '').toLowerCase();
      const resolvedPlan: 'basic' | 'premium' = selectedSvcLower.includes('premium')
        ? 'premium'
        : selectedSvcLower.includes('basic')
        ? 'basic'
        : client.plan === 'premium'
        ? 'premium'
        : 'basic';

      const updatePayload: any = {
        invoice: newInvoiceEntry,
        invoices: updatedInvoices,
        packagePrice: invoiceData.totalDue || packagePrice,
        paymentMode: newInvoiceEntry.mode,
      };

      if (isRenewalAction) {
        updatePayload.status = 'active';
        updatePayload.isRenewal = true;
        updatePayload.renewedAt = new Date().toISOString();
        updatePayload.plan = resolvedPlan;
        if (newStartDate) updatePayload.startDate = newStartDate;
        if (newEndDate) updatePayload.endDate = newEndDate;
      }

      const result = await updateClient(client._id, updatePayload);
      if (!result?.success) {
        return;
      }
      if (result.data) {
        setDirectClient(result.data);
      }
    }

    setIsInvoiceModalOpen(false);
    showToast(
      isRenewalAction
        ? 'Service renewed successfully'
        : 'Invoice saved successfully',
      'success'
    );
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Top Breadcrumb Navigation */}
      <div className="bg-white dark:bg-gray-850 px-4 sm:px-6 py-2.5 border-b border-gray-200 dark:border-gray-800 text-xs">
        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
          <Link to="/admin/dashboard" className="hover:text-gray-900 dark:hover:text-white">
            Home
          </Link>
          <span>/</span>
          <Link to="/admin/clients" className="hover:text-gray-900 dark:hover:text-white">
            Clients
          </Link>
          <span>/</span>
          <Link to="/admin/clients" className="hover:text-gray-900 dark:hover:text-white">
            Purchase type Based
          </Link>
          <span>/</span>
          <span className="text-[#ff5e28] font-medium">
            Payments - {clientName}
          </span>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="bg-white dark:bg-gray-850 px-4 sm:px-6 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
        <div className="flex items-center gap-6 text-xs whitespace-nowrap">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabClick(tab)}
              className={`py-3 font-medium transition-colors cursor-pointer border-b-2 ${
                activeTab === tab
                  ? 'text-[#ff5e28] border-[#ff5e28]'
                  : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Top Banner / Header Bar */}
      <div className="bg-[#fff3eb] dark:bg-gray-800 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 border-b border-orange-100 dark:border-gray-700">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-wide">
          Payments - {clientName}
        </h1>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => showToast('Inter branch transfer opened', 'info')}
            className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-2xs cursor-pointer"
          >
            Inter branch transfer
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-2xs cursor-pointer"
          >
            Print profile
          </button>
          <button
            type="button"
            onClick={() => showToast('Add advance payment opened', 'info')}
            className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-2xs cursor-pointer"
          >
            Add Advance Payment
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedInvoice(null);
              setIsInvoiceModalOpen(true);
            }}
            className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-2xs cursor-pointer"
          >
            New Invoice
          </button>
          <button
            type="button"
            onClick={() => showToast('New Call log opened', 'info')}
            className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-2xs cursor-pointer"
          >
            New Call
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/schedule')}
            className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-2xs cursor-pointer"
          >
            New appointment
          </button>
        </div>
      </div>

      {/* Filter and Actions Bar */}
      <div className="px-4 sm:px-6 py-3 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-700 dark:text-gray-300">Filter by</span>
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-[#22b0e6] rounded-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#22b0e6] cursor-pointer min-w-[120px]"
          >
            <option value="All">All</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Pro Forma">Pro Forma</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedInvoice(null);
              setIsInvoiceModalOpen(true);
            }}
            className="px-4 py-1.5 bg-[#ff5e28] hover:bg-[#e04f1d] text-white text-xs font-semibold rounded-xs shadow-xs transition-colors cursor-pointer"
          >
            New Invoice
          </button>
          <button
            type="button"
            onClick={() => showToast('Product catalogue opened', 'info')}
            className="px-4 py-1.5 bg-[#ff5e28] hover:bg-[#e04f1d] text-white text-xs font-semibold rounded-xs shadow-xs transition-colors cursor-pointer"
          >
            Product
          </button>
        </div>
      </div>

      {/* Pagination Bar */}
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
        <button type="button" disabled className="p-1 opacity-30 cursor-not-allowed">
          <ChevronsLeft size={16} />
        </button>
        <button type="button" disabled className="p-1 opacity-30 cursor-not-allowed">
          <ChevronLeft size={16} />
        </button>
        <span className="px-2 font-medium">Page 1 of 1</span>
        <button type="button" disabled className="p-1 opacity-30 cursor-not-allowed">
          <ChevronRight size={16} />
        </button>
        <button type="button" disabled className="p-1 opacity-30 cursor-not-allowed">
          <ChevronsRight size={16} />
        </button>
      </div>

      {/* Payments Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-bold text-gray-800 dark:text-gray-200">
              <th className="py-3 px-3">Purchased</th>
              <th className="py-3 px-3">Name</th>
              <th className="py-3 px-3">Pro Forma Invoice No.</th>
              <th className="py-3 px-3">Amount</th>
              <th className="py-3 px-3">Tax</th>
              <th className="py-3 px-3">Net</th>
              <th className="py-3 px-3">Paid</th>
              <th className="py-3 px-3">TDS Amount</th>
              <th className="py-3 px-3">Pending</th>
              <th className="py-3 px-3">Mode</th>
              <th className="py-3 px-3">Write Off</th>
              <th className="py-3 px-3 text-center">Paid Invoice & Receipt</th>
              <th className="py-3 px-3 text-center">Pro Forma Invoice Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-xs text-gray-400">
                  No invoices found for this client.
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv: any, idx: number) => (
              <tr
                key={inv.id || idx}
                className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
              >
                {/* Purchased */}
                <td className="py-3.5 px-3 text-gray-600 dark:text-gray-400">
                  {inv.purchasedDate}
                </td>

                {/* Name */}
                <td className="py-3.5 px-3 font-medium text-gray-900 dark:text-white">
                  {inv.name}
                </td>

                {/* Pro Forma Invoice No. */}
                <td className="py-3.5 px-3 text-gray-700 dark:text-gray-300">
                  {inv.invoiceNo}
                </td>

                {/* Amount */}
                <td className="py-3.5 px-3 font-medium text-gray-800 dark:text-gray-200">
                  {formatCurrency(inv.amount)}
                </td>

                {/* Tax */}
                <td className="py-3.5 px-3 text-gray-600 dark:text-gray-400">
                  {formatCurrency(inv.tax)}
                </td>

                {/* Net */}
                <td className="py-3.5 px-3 font-medium text-gray-800 dark:text-gray-200">
                  {formatCurrency(inv.net)}
                </td>

                {/* Paid */}
                <td className="py-3.5 px-3 font-semibold text-[#22c55e]">
                  {formatCurrency(inv.paid)}
                </td>

                {/* TDS Amount */}
                <td className="py-3.5 px-3 text-gray-600 dark:text-gray-400">
                  ₹ 0.00
                </td>

                {/* Pending */}
                <td className="py-3.5 px-3 text-gray-700 dark:text-gray-300 font-medium">
                  <div className="flex items-center gap-2">
                    <span className={inv.pending > 0 ? 'text-red-500 font-bold' : ''}>
                      {formatCurrency(inv.pending)}
                    </span>
                    {inv.pending > 0 && !inv.isCancelled && (
                      <button
                        type="button"
                        onClick={() => {
                          setCollectInvoice({
                            ...(inv.rawInvoice || {}),
                            invoiceNo: inv.invoiceNo,
                            id: inv.id,
                            net: inv.net,
                            amount: inv.amount,
                            paid: inv.paid,
                            pending: inv.pending,
                          });
                          setCollectAmount(inv.pending);
                          setCollectMode('Paytm');
                          setCollectNotes('');
                          setIsCollectModalOpen(true);
                        }}
                        className="px-2 py-0.5 bg-[#22c55e] hover:bg-[#16a34a] text-white text-[10px] font-bold rounded shadow-2xs transition-colors cursor-pointer"
                        title="Collect this pending payment"
                      >
                        Pay
                      </button>
                    )}
                  </div>
                </td>

                {/* Mode */}
                <td className="py-3.5 px-3 text-gray-700 dark:text-gray-300">
                  {inv.mode}
                </td>

                {/* Write Off */}
                <td className="py-3.5 px-3 text-[#ff5e28] font-medium">
                  {inv.writeOff}
                </td>

                {/* Paid Invoice & Receipt */}
                <td className="py-3.5 px-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-[#ff5e28]">
                    <button
                      type="button"
                      onClick={() => showToast('Downloading invoice PDF...', 'info')}
                      className="p-1 hover:bg-orange-50 dark:hover:bg-orange-950/40 rounded cursor-pointer"
                      title="Download Invoice"
                    >
                      <FileText size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast('Downloading payment receipt...', 'info')}
                      className="p-1 hover:bg-orange-50 dark:hover:bg-orange-950/40 rounded cursor-pointer"
                      title="Download Receipt"
                    >
                      <FileText size={15} />
                    </button>
                  </div>
                </td>

                {/* Pro Forma Invoice Details */}
                <td className="py-3.5 px-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-[#ff5e28]">
                    <button
                      type="button"
                      onClick={() => {
                        const targetClient = client?._id || memId || id;
                        const targetInv = inv.rawInvoice?.invoiceNo || inv.invoiceNo || String(idx + 1);
                        navigate(`/admin/reports/proforma-invoice-details/${targetClient}/${targetInv}`);
                      }}
                      className="p-1 hover:bg-orange-50 dark:hover:bg-orange-950/40 rounded cursor-pointer"
                      title="View Pro Forma Invoice"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="p-1 hover:bg-orange-50 dark:hover:bg-orange-950/40 rounded cursor-pointer"
                      title="Print Invoice"
                    >
                      <Printer size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/admin/mail-invoice')}
                      className="p-1 hover:bg-orange-50 dark:hover:bg-orange-950/40 rounded cursor-pointer"
                      title="Send Invoice"
                    >
                      <Send size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>

      {/* Pro Forma Invoice Modal */}
      <ProFormaInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setSelectedInvoice(null);
        }}
        onSave={handleSaveInvoice}
        memberData={
          selectedInvoice
            ? {
                fullName: clientName,
                contactNumber: client?.contactNumber || '',
                email: client?.email || '',
                salesRep: selectedInvoice?.salesRep || (client as any)?.salesRep,
                invoiceDate: selectedInvoice?.date
                  ? new Date(selectedInvoice.date).toISOString().slice(0, 10)
                  : selectedInvoice?.invoiceDate
                  ? new Date(selectedInvoice.invoiceDate).toISOString().slice(0, 10)
                  : undefined,
                packagePrice: selectedInvoice?.amount || selectedInvoice?.totalDue || packagePrice,
                paymentMode: selectedInvoice?.mode || paymentMode,
                paymentModes: selectedInvoice?.paymentModes,
                personalTrainer: selectedInvoice?.personalTrainer,
                makePtAsSalesRep: selectedInvoice?.makePtAsSalesRep,
              }
            : {
                fullName: clientName,
                contactNumber: client?.contactNumber || '',
                email: client?.email || '',
                salesRep: (client as any)?.salesRep,
              }
        }
        recentPurchasedServices={
          selectedInvoice
            ? (selectedInvoice?.items && selectedInvoice.items.length > 0
                ? selectedInvoice.items
                : [
                    {
                      serviceName:
                        selectedInvoice?.serviceName ||
                        (client?.plan === 'premium' ? 'PREMIUM MEMBERSHIP' : 'CLUB MEMBERSHIP'),
                      duration: selectedInvoice?.duration || '12 Months',
                      fee: Number(selectedInvoice?.amount || selectedInvoice?.totalDue || packagePrice),
                      startDate: selectedInvoice?.startDate || client?.startDate,
                      expiryDate: selectedInvoice?.expiryDate || client?.endDate,
                      quantity: 1,
                      taxRate: selectedInvoice?.tax ? 5 : 0,
                    },
                  ])
            : undefined
        }
      />
      {/* Collect Payment Modal on Payments Page */}
      {isCollectModalOpen && collectInvoice && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-5 space-y-4 border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold text-sm">
                <CheckCircle2 size={18} />
                <span>Collect Payment - {collectInvoice.invoiceNo}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCollectModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-700 dark:text-gray-300">
              <div>
                <label className="block font-semibold text-gray-800 dark:text-gray-200 mb-1">
                  Amount to Collect (₹):
                </label>
                <input
                  type="number"
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-xs font-bold text-gray-900 dark:text-white focus:ring-1 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-800 dark:text-gray-200 mb-1">
                  Mode of Payment:
                </label>
                <select
                  value={collectMode}
                  onChange={(e) => setCollectMode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-xs font-semibold focus:ring-1 focus:ring-green-500"
                >
                  <option value="Paytm">Paytm</option>
                  <option value="Google Pay">Google Pay</option>
                  <option value="PhonePe">PhonePe</option>
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Credit / Debit Card">Credit / Debit Card</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-800 dark:text-gray-200 mb-1">
                  Remarks / Notes (Optional):
                </label>
                <input
                  type="text"
                  value={collectNotes}
                  onChange={(e) => setCollectNotes(e.target.value)}
                  placeholder="e.g. Paid by Paytm not cash"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-xs focus:ring-1 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                disabled={isCollecting}
                onClick={() => setIsCollectModalOpen(false)}
                className="px-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                disabled={isCollecting}
                onClick={handleSaveCollectFromPaymentsPage}
                className="px-4 py-1.5 bg-[#22c55e] hover:bg-[#16a34a] text-white font-semibold rounded text-xs flex items-center gap-1.5 cursor-pointer"
              >
                {isCollecting ? 'Saving...' : 'Save & Collect Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
