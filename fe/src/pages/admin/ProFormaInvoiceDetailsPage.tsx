import React, { useMemo, useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useClient } from '../../hooks/useClient';
import { useStaff } from '../../hooks/useStaff';
import { useToast } from '../../contexts/ToastContext';
import { Dumbbell, X, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

export const ProFormaInvoiceDetailsPage: React.FC = () => {
  const { clientId, invoiceId } = useParams<{ clientId?: string; invoiceId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clients, updateClient } = useClient();
  const { staff, fetchAllStaff } = useStaff();
  const { addToast } = useToast();
  const showToast = addToast;

  useEffect(() => {
    fetchAllStaff?.();
  }, [fetchAllStaff]);

  const memId = clientId || searchParams.get('memid') || searchParams.get('clientId') || '';
  const invIdentifier = invoiceId || searchParams.get('invno') || searchParams.get('invoiceNo') || '';

  const client = useMemo(() => {
    if (!memId) return clients[0] || null;
    return clients.find((c) => c._id === memId) || clients[0] || null;
  }, [clients, memId]);

  const matchesInvoice = (targetInv: any, refInv: any) => {
    if (!targetInv || !refInv) return false;
    if (refInv.invoiceNo && targetInv.invoiceNo) {
      return targetInv.invoiceNo === refInv.invoiceNo;
    }
    if (refInv._id && targetInv._id) {
      return String(targetInv._id) === String(refInv._id);
    }
    if (refInv.id && targetInv.id) {
      return String(targetInv.id) === String(refInv.id);
    }
    return false;
  };

  const invoice = useMemo(() => {
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
      return client.invoices[0];
    }

    if (client.invoice) {
      return client.invoice;
    }

    return null;
  }, [client, invIdentifier]);

  // Modal states
  const [isCancelPaymentModalOpen, setIsCancelPaymentModalOpen] = useState(false);
  const [cancelPaymentReason, setCancelPaymentReason] = useState('Paid by Paytm not cash');
  const [customCancelReason, setCustomCancelReason] = useState('');

  const [isCollectPaymentModalOpen, setIsCollectPaymentModalOpen] = useState(false);
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectPaymentMode, setCollectPaymentMode] = useState<string>('Paytm');
  const [collectNotes, setCollectNotes] = useState<string>('');

  const [isCancelInvoiceModalOpen, setIsCancelInvoiceModalOpen] = useState(false);
  const [cancelInvoiceReason, setCancelInvoiceReason] = useState('Customer requested cancellation');

  const [isProcessing, setIsProcessing] = useState(false);

  // Helper to resolve staff member MongoDB _id to human full name
  const resolveStaffName = (idOrName?: string) => {
    if (!idOrName) return '';
    const found = staff?.find((s) => s._id === idOrName);
    if (found?.fullName) return found.fullName;
    if (/^[0-9a-fA-F]{24}$/.test(idOrName)) {
      if ((client as any)?.salesRepName) return (client as any).salesRepName;
      return 'Staff';
    }
    return idOrName;
  };

  const clientName = client?.fullName || 'Client';
  const clientEmail = client?.email || '';
  const clientMobile = client?.contactNumber || '';

  const attendanceId = useMemo(() => {
    if ((client as any)?.attendanceId) return (client as any).attendanceId;
    if (client?._id) {
      const hex = client._id.replace(/[^0-9a-fA-F]/g, '').slice(-4) || '1264';
      const num = 1000 + (parseInt(hex, 16) % 9000);
      return String(num);
    }
    return '1264';
  }, [client]);

  const placeOfSupply = (client as any)?.state || 'Punjab';

  const invoiceNo = invoice?.invoiceNo || invIdentifier || 'Sep92-2026';
  const rawDate =
    invoice?.date ||
    invoice?.invoiceDate ||
    invoice?.createdAt ||
    client?.startDate ||
    new Date().toISOString();

  const invoiceDateFormatted = useMemo(() => {
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return '01-09-2026';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }, [rawDate]);

  const invoiceDateTimeFormatted = useMemo(() => {
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return '01-09-2026 05:30 AM';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const timeStr = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${day}-${month}-${year} ${timeStr}`;
  }, [rawDate]);

  const formatInvoiceType = (type?: string) => {
    if (!type) return 'New Booking';
    const lower = type.toLowerCase();
    if (lower === 'service') return 'Service Booking';
    if (lower === 'package') return 'Package Booking';
    if (lower === 'deal') return 'Deal Booking';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const invoiceType = formatInvoiceType(
    invoice?.invoiceType || (invoice?.isUpgrade ? 'Upgraded Booking' : 'New Booking')
  );
  const rawSalesRep = invoice?.salesRep || (client as any)?.salesRep || '';
  const salesRep = resolveStaffName(rawSalesRep) || 'FitZone Team';
  const createdBy = salesRep;

  const rawPersonalTrainer = invoice?.personalTrainer || (client as any)?.personalTrainer || '';
  const personalTrainer = resolveStaffName(rawPersonalTrainer);

  // Invoice Items
  const items = useMemo(() => {
    if (invoice?.items && Array.isArray(invoice.items) && invoice.items.length > 0) {
      return invoice.items.map((item: any) => {
        const isPT =
          (item.serviceName || '').toLowerCase().includes('personal') ||
          (item.serviceName || '').toLowerCase().includes('pt') ||
          Boolean(personalTrainer);

        const sDate = item.startDate
          ? new Date(item.startDate)
              .toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
              .replace(/\//g, '-')
          : invoiceDateFormatted;

        const eDate = item.expiryDate
          ? new Date(item.expiryDate)
              .toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
              .replace(/\//g, '-')
          : '01-10-2026';

        const sessions =
          item.sessions && item.sessions !== 'NaN' && item.sessions !== 'undefined'
            ? item.sessions
            : isPT
            ? '12'
            : 'Not Applicable';

        const fee = Number(item.fee ?? item.price ?? invoice.amount ?? 2000);

        return {
          serviceName: item.serviceName || (isPT ? 'Personal Session' : 'Club Membership'),
          variationName:
            item.duration || item.serviceVariationName || (isPT ? 'PT 1 Month - 30 Day(s)' : '12 Months'),
          startDate: sDate,
          expiryDate: eDate,
          sessions: sessions,
          personalTrainer: personalTrainer,
          durationText: isPT
            ? `${sessions} Sessions. 1 Hours 00 minutes per session. Valid for 30 day(s).`
            : `7 Days Per week. Valid for ${item.duration || '12 Months'}.`,
          baseFee: fee,
          isPT: isPT,
        };
      });
    }

    const isPT = Boolean(personalTrainer);
    const fee = Number(invoice?.amount ?? invoice?.totalDue ?? client?.packagePrice ?? 2000);

    return [
      {
        serviceName: invoice?.serviceName || (isPT ? 'Personal Session' : 'Club Membership'),
        variationName: invoice?.duration || (isPT ? 'PT 1 Month - 30 Day(s)' : '12 Months'),
        startDate: invoiceDateFormatted,
        expiryDate: '01-10-2026',
        sessions: isPT ? '12' : 'Not Applicable',
        personalTrainer: personalTrainer,
        durationText: isPT
          ? `12 Sessions. 1 Hours 00 minutes per session. Valid for 30 day(s).`
          : `7 Days Per week. Valid for 12 month(s).`,
        baseFee: fee,
        isPT: isPT,
      },
    ];
  }, [invoice, personalTrainer, invoiceDateFormatted, client]);

  const subTotal = useMemo(() => {
    if (invoice?.subTotal !== undefined) return Number(invoice.subTotal);
    return items.reduce((sum, it) => sum + it.baseFee, 0);
  }, [invoice, items]);

  const taxDue = useMemo(() => {
    if (invoice?.taxDue !== undefined) return Number(invoice.taxDue);
    if (invoice?.tax !== undefined) return Number(invoice.tax);
    return 0;
  }, [invoice]);

  const totalDue = useMemo(() => {
    if (invoice?.totalDue !== undefined) return Number(invoice.totalDue);
    if (invoice?.net !== undefined) return Number(invoice.net);
    return subTotal + taxDue;
  }, [invoice, subTotal, taxDue]);

  const isCancelled = Boolean(invoice?.isCancelled || invoice?.status === 'Cancelled');
  const isPaymentCancelled = Boolean(invoice?.paymentCancelled);

  const paidAmount = useMemo(() => {
    if (isCancelled || isPaymentCancelled) return 0;
    if (invoice?.paid !== undefined) return Number(invoice.paid);
    return totalDue;
  }, [invoice, totalDue, isCancelled, isPaymentCancelled]);

  const pendingAmount = useMemo(() => {
    if (isCancelled) return 0;
    if (isPaymentCancelled) return totalDue;
    if (invoice?.pending !== undefined) return Number(invoice.pending);
    return Math.max(0, totalDue - paidAmount);
  }, [invoice, totalDue, paidAmount, isCancelled, isPaymentCancelled]);

  const paymentMode = useMemo(() => {
    if (invoice?.mode) return invoice.mode;
    if (invoice?.paymentModes?.length > 0) {
      const pm = invoice.paymentModes.find((p: any) => p.mode && p.mode !== 'Select');
      if (pm?.mode) return pm.mode;
    }
    return (client as any)?.paymentMode || 'Cash';
  }, [invoice, client]);

  const paidMonthYearFormatted = useMemo(() => {
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return '01-September-26';
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'long' });
    const yearShort = String(d.getFullYear()).slice(2);
    return `${day}-${month}-${yearShort}`;
  }, [rawDate]);

  const financialYear = useMemo(() => {
    const d = new Date(rawDate);
    const year = isNaN(d.getTime()) ? 2026 : d.getFullYear();
    const curYear = String(year).slice(2);
    const nextYear = String(year + 1).slice(2);
    return `${curYear}-${nextYear}`;
  }, [rawDate]);

  const paidInvoiceNo = useMemo(() => {
    if (client?._id) {
      const hex = client._id.replace(/[^0-9a-fA-F]/g, '').slice(-2) || '08';
      return `FZG/S/${hex}/${financialYear}`;
    }
    return `FZG/S/08/${financialYear}`;
  }, [client, financialYear]);

  const receiptNo = useMemo(() => {
    if (client?._id) {
      const hex = client._id.replace(/[^0-9a-fA-F]/g, '').slice(-2) || '08';
      return `R/FZG/S/${hex}/${financialYear}`;
    }
    return `R/FZG/S/08/${financialYear}`;
  }, [client, financialYear]);

  // Set default collect amount when opening modal
  useEffect(() => {
    if (pendingAmount > 0) {
      setCollectAmount(pendingAmount);
    }
  }, [pendingAmount]);

  // Handle 1: Cancel Collected Payment
  const handleConfirmCancelPayment = async () => {
    if (!client?._id) return;
    setIsProcessing(true);
    const effectiveReason = customCancelReason.trim() || cancelPaymentReason;

    try {
      const updatedInvoices = (client.invoices || []).map((inv: any) => {
        if (matchesInvoice(inv, invoice)) {
          return {
            ...inv,
            paid: 0,
            pending: totalDue,
            status: 'Pending',
            paymentCancelled: true,
            cancelPaymentReason: effectiveReason,
            paymentCancelDate: new Date().toISOString(),
            cancelledPaymentDetails: {
              previousMode: paymentMode,
              previousAmount: paidAmount || totalDue,
              reason: effectiveReason,
              cancelledAt: new Date().toISOString(),
            },
          };
        }
        return inv;
      });

      let updatedSingleInvoice = client.invoice;
      if (client.invoice && matchesInvoice(client.invoice, invoice)) {
        updatedSingleInvoice = {
          ...client.invoice,
          paid: 0,
          pending: totalDue,
          status: 'Pending',
          paymentCancelled: true,
          cancelPaymentReason: effectiveReason,
          paymentCancelDate: new Date().toISOString(),
        };
      }

      await updateClient(client._id, {
        invoices: updatedInvoices,
        invoice: updatedSingleInvoice,
      } as any);

      setIsCancelPaymentModalOpen(false);
      showToast(
        `Payment of ₹ ${paidAmount || totalDue} cancelled. Reason: "${effectiveReason}". You can now collect payment with the new mode.`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel payment', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle 2: Collect Payment (e.g. via Paytm or other mode)
  const handleConfirmCollectPayment = async () => {
    if (!client?._id) return;
    setIsProcessing(true);

    try {
      const amount = Number(collectAmount) || pendingAmount;
      const newPending = Math.max(0, totalDue - amount);

      const updatedInvoices = (client.invoices || []).map((inv: any) => {
        if (matchesInvoice(inv, invoice)) {
          return {
            ...inv,
            paid: amount,
            pending: newPending,
            mode: collectPaymentMode,
            paymentModes: [{ id: '1', mode: collectPaymentMode, amount: amount }],
            status: newPending === 0 ? 'Paid' : 'Partially Paid',
            paymentCancelled: false,
            date: new Date().toISOString(),
            collectPaymentNotes: collectNotes,
          };
        }
        return inv;
      });

      let updatedSingleInvoice = client.invoice;
      if (client.invoice && matchesInvoice(client.invoice, invoice)) {
        updatedSingleInvoice = {
          ...client.invoice,
          paid: amount,
          pending: newPending,
          mode: collectPaymentMode,
          paymentModes: [{ id: '1', mode: collectPaymentMode, amount: amount }],
          status: newPending === 0 ? 'Paid' : 'Partially Paid',
          paymentCancelled: false,
          date: new Date().toISOString(),
          collectPaymentNotes: collectNotes,
        };
      }

      await updateClient(client._id, {
        invoices: updatedInvoices,
        invoice: updatedSingleInvoice,
        paymentMode: collectPaymentMode,
      } as any);

      setIsCollectPaymentModalOpen(false);
      showToast(`Payment of ₹ ${amount} collected successfully via ${collectPaymentMode}!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to collect payment', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle 3: Cancel Entire Invoice
  const handleConfirmCancelInvoice = async () => {
    if (!client?._id) return;
    setIsProcessing(true);

    try {
      const updatedInvoices = (client.invoices || []).map((inv: any) => {
        if (matchesInvoice(inv, invoice)) {
          return {
            ...inv,
            status: 'Cancelled',
            isCancelled: true,
            writeOff: 'Yes (Cancelled)',
            cancelInvoiceReason: cancelInvoiceReason,
            cancelledAt: new Date().toISOString(),
            pending: 0,
            paid: 0,
          };
        }
        return inv;
      });

      const remainingActiveInvoices = updatedInvoices.filter(
        (inv: any) => !inv.isCancelled && inv.status !== 'Cancelled'
      );
      const latestActiveInvoice = remainingActiveInvoices.length > 0 ? remainingActiveInvoices[0] : null;

      const stillHasPT = remainingActiveInvoices.some((inv: any) => {
        return (
          Boolean(inv.personalTrainer) ||
          inv.items?.some((it: any) =>
            (it.serviceName || '').toLowerCase().includes('personal') ||
            (it.serviceName || '').toLowerCase().includes('pt')
          )
        );
      });

      let updatedSingleInvoice = latestActiveInvoice || {
        ...client.invoice,
        status: 'Cancelled',
        isCancelled: true,
        writeOff: 'Yes (Cancelled)',
        cancelInvoiceReason: cancelInvoiceReason,
        cancelledAt: new Date().toISOString(),
      };

      await updateClient(client._id, {
        invoices: updatedInvoices,
        invoice: updatedSingleInvoice,
        hasPersonalTraining: stillHasPT,
        personalTrainer: stillHasPT ? (latestActiveInvoice?.personalTrainer || client.personalTrainer) : null,
      } as any);

      setIsCancelInvoiceModalOpen(false);
      showToast(`Invoice ${invoiceNo} cancelled successfully`, 'success');
      navigate(`/admin/clients/payments/${client._id}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel invoice', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Top Breadcrumb Navigation */}
      <div className="bg-white dark:bg-gray-850 px-4 sm:px-8 py-3 border-b border-gray-200 dark:border-gray-800 text-xs">
        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
          <Link to="/admin/dashboard" className="hover:text-gray-900 dark:hover:text-white">
            Home
          </Link>
          <span>/</span>
          <Link to="/admin/reports" className="hover:text-gray-900 dark:hover:text-white">
            Reports
          </Link>
          <span>/</span>
          <Link to={`/admin/clients/payments/${client?._id || memId}`} className="hover:text-gray-900 dark:hover:text-white">
            Finance
          </Link>
          <span>/</span>
          <span className="text-[#ff5e28] font-medium">Pro Forma Invoice Details</span>
        </div>
      </div>

      {/* Main Printable Invoice Paper Container */}
      <div className="max-w-4xl mx-auto my-6 bg-white dark:bg-gray-850 shadow-md border border-gray-200 dark:border-gray-800 rounded-xs p-6 sm:p-10 space-y-6 text-xs">
        {/* Title */}
        <div className="text-center space-y-1">
          <h1 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white tracking-wide">
            Pro Forma Invoice
          </h1>
          {isCancelled && (
            <div className="inline-block px-3 py-0.5 bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 font-bold text-xs rounded-xs">
              INVOICE CANCELLED
            </div>
          )}
        </div>

        {/* Top Header Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pt-2">
          {/* Left Column: Logo & Member Info */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 pb-2">
              <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-orange-500">
                <Dumbbell size={22} className="rotate-45" />
              </div>
              <div className="font-bold text-gray-900 dark:text-white text-sm">FitZone Gym</div>
            </div>

            <div className="space-y-1 pt-1">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Name : </span>
                <span className="font-bold text-gray-900 dark:text-white">{clientName}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Email : </span>
                <span className="font-bold text-gray-900 dark:text-white">{clientEmail}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Mobile : </span>
                <span className="font-bold text-gray-900 dark:text-white">{clientMobile}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Attendance ID : </span>
                <span className="font-bold text-gray-900 dark:text-white">{attendanceId}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Place of Supply : </span>
                <span className="text-gray-900 dark:text-white font-medium">{placeOfSupply}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Gym Location & Invoice Meta */}
          <div className="text-left md:text-right space-y-1">
            <div className="text-gray-700 dark:text-gray-300 font-medium pb-2">
              SCO 9 & 10 First Floor, Hollywood Plaza Market, VIP Road Zirakpur, Punjab, India
            </div>

            <div className="space-y-1 pt-1">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Invoice Type : </span>
                <span className="font-bold text-gray-900 dark:text-white">{invoiceType}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Date, Time : </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {invoiceDateTimeFormatted}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Invoice Number : </span>
                <span className="font-bold text-gray-900 dark:text-white">{invoiceNo}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Date of Invoice: </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {invoiceDateFormatted}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Created by : </span>
                <span className="text-gray-900 dark:text-white">{createdBy}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Sales Rep : </span>
                <span className="text-gray-900 dark:text-white font-medium">{salesRep}</span>
              </div>
              {personalTrainer && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Personal Trainer : </span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {personalTrainer}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-700">
                <th className="py-2.5 px-4 w-[45%]">DESCRIPTION</th>
                <th className="py-2.5 px-4 w-[35%]">DURATION</th>
                <th className="py-2.5 px-4 w-[20%] text-right">SERVICE FEE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {items.map((it, idx) => (
                <tr key={idx} className="align-top">
                  {/* Description */}
                  <td className="py-3 px-4 space-y-1">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {it.serviceName} - {it.variationName}
                    </div>
                    <div className="text-[11px] text-gray-700 dark:text-gray-300">
                      <span className="font-bold">Start date : </span>
                      {it.startDate}, <span className="font-bold">Expiry date :</span>
                      {it.expiryDate}, <span className="font-bold">Sessions :</span>
                      {it.sessions},
                    </div>
                    {it.personalTrainer && (
                      <div className="text-[11px] text-gray-700 dark:text-gray-300">
                        <span className="font-bold">Personal Trainer : </span>
                        {it.personalTrainer}
                      </div>
                    )}
                  </td>

                  {/* Duration */}
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{it.durationText}</td>

                  {/* Service Fee */}
                  <td className="py-3 px-4 text-right text-gray-900 dark:text-white font-medium whitespace-nowrap">
                    Base Fee : ₹ {it.baseFee.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}

              {/* Subtotal */}
              <tr className="border-t border-gray-200 dark:border-gray-700">
                <td colSpan={2} className="py-2.5 px-4 font-medium text-gray-700 dark:text-gray-300">
                  Subtotal
                </td>
                <td className="py-2.5 px-4 text-right font-medium text-gray-900 dark:text-white">
                  ₹ {subTotal.toLocaleString('en-IN')}
                </td>
              </tr>

              {/* GST */}
              <tr>
                <td colSpan={2} className="py-2.5 px-4 font-medium text-gray-700 dark:text-gray-300">
                  GST
                </td>
                <td className="py-2.5 px-4 text-right font-medium text-gray-900 dark:text-white">
                  ₹ {taxDue.toLocaleString('en-IN')}
                </td>
              </tr>

              {/* Total Due Highlighted Row */}
              <tr className="bg-gray-100 dark:bg-gray-800 font-bold border-t border-b border-gray-300 dark:border-gray-600">
                <td colSpan={2} className="py-2.5 px-4 text-gray-900 dark:text-white">
                  Total Due
                </td>
                <td className="py-2.5 px-4 text-right text-gray-900 dark:text-white">
                  ₹ {totalDue.toLocaleString('en-IN')}
                </td>
              </tr>

              {/* Paid Breakdown */}
              <tr className="align-top">
                <td colSpan={2} className="py-3 px-4 space-y-1">
                  <div className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <span>Paid ({paidMonthYearFormatted})</span>
                    {isPaymentCancelled && (
                      <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 text-[10px] rounded-xs font-semibold">
                        Payment Cancelled
                      </span>
                    )}
                  </div>
                  {!isPaymentCancelled ? (
                    <>
                      <div className="text-[11px] text-gray-600 dark:text-gray-400">
                        Paid Invoice No. :
                        <span className="text-[#0ea5e9] hover:underline cursor-pointer">
                          {paidInvoiceNo}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-600 dark:text-gray-400">
                        Receipt No. :
                        <span className="text-[#0ea5e9] hover:underline cursor-pointer">
                          {receiptNo}
                        </span>
                      </div>
                      <div className="pt-2">
                        <span className="inline-block border border-gray-300 dark:border-gray-600 px-2.5 py-1 rounded bg-gray-50 dark:bg-gray-800 text-[11px] text-gray-800 dark:text-gray-200">
                          Mode of Payment : {paidAmount}({paymentMode})
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 italic pt-1">
                      Payment was cancelled ({invoice?.cancelPaymentReason || 'Payment mode cancellation'}). Amount returned to pending.
                    </div>
                  )}
                </td>
                <td className="py-3 px-4 text-right font-bold text-gray-900 dark:text-white space-y-2">
                  <div>₹ {paidAmount.toLocaleString('en-IN')}</div>
                  {!isCancelled && !isPaymentCancelled && paidAmount > 0 && (
                    <div>
                      {/* Cancellation Option 1: Cancel Collected Payment */}
                      <button
                        type="button"
                        onClick={() => setIsCancelPaymentModalOpen(true)}
                        className="text-[#0ea5e9] hover:underline text-[11px] font-medium cursor-pointer"
                        title="Cancel this collected payment to collect again with new mode"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </td>
              </tr>

              {/* Pending Row */}
              <tr className="border-t border-gray-200 dark:border-gray-700 bg-orange-50/20 dark:bg-orange-950/10">
                <td colSpan={2} className="py-2.5 px-4 font-medium text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-3">
                    <span>Pending</span>
                    {pendingAmount > 0 && !isCancelled && (
                      <button
                        type="button"
                        onClick={() => {
                          setCollectAmount(pendingAmount);
                          setCollectPaymentMode('Paytm');
                          setIsCollectPaymentModalOpen(true);
                        }}
                        className="px-3 py-1 bg-[#22c55e] hover:bg-[#16a34a] text-white text-[11px] font-bold rounded-xs shadow-2xs cursor-pointer flex items-center gap-1 transition-colors"
                      >
                        <RefreshCw size={12} />
                        Collect Payment
                      </button>
                    )}
                  </div>
                </td>
                <td className="py-2.5 px-4 text-right font-bold text-gray-900 dark:text-white">
                  ₹ {pendingAmount.toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Terms and Conditions Box */}
        <div className="pt-4 text-center space-y-2 border-t border-dashed border-gray-200 dark:border-gray-700">
          <div className="font-bold text-gray-900 dark:text-white tracking-wider">
            TERMS AND CONDITIONS
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-[11px]">
            The membership paid for in this bill is not transferrable.
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-[11px]">
            The membership paid for in this bill is non refundable.
          </p>

          <div className="pt-3 text-[11px] text-gray-500 dark:text-gray-400">
            If you have any questions about this bill, please contact Mail : support@fitzonegym.com, Phone : +91 9876543210
          </div>
          <div className="font-semibold text-gray-800 dark:text-gray-200 text-xs">
            Thank You For Your Business!
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-col items-center gap-3">
          {/* Cancellation Option 2: Cancel Entire Invoice */}
          {!isCancelled ? (
            <button
              type="button"
              onClick={() => setIsCancelInvoiceModalOpen(true)}
              className="px-8 py-2 bg-[#00a8e8] hover:bg-[#0096d1] text-white text-xs font-semibold rounded-xs shadow-xs transition-colors cursor-pointer"
              title="Cancel the entire invoice"
            >
              Cancel
            </button>
          ) : (
            <div className="text-red-500 font-bold text-xs">
              This invoice is cancelled ({invoice?.cancelInvoiceReason || 'Cancelled'})
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                showToast('Downloading Pro Forma Invoice PDF...', 'info');
                window.print();
              }}
              className="px-4 py-1.5 bg-[#00a8e8] hover:bg-[#0096d1] text-white text-xs font-medium rounded-xs shadow-2xs transition-colors cursor-pointer"
            >
              PDF
            </button>
            <button
              type="button"
              onClick={() => showToast('Exporting to Excel...', 'info')}
              className="px-4 py-1.5 bg-[#00a8e8] hover:bg-[#0096d1] text-white text-xs font-medium rounded-xs shadow-2xs transition-colors cursor-pointer"
            >
              Excel
            </button>
          </div>
        </div>
      </div>

      {/* Modal 1: Cancel Collected Payment Modal */}
      {isCancelPaymentModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-5 space-y-4 border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                <AlertTriangle size={18} />
                <span>Cancel Collected Payment</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCancelPaymentModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-700 dark:text-gray-300">
              <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded border border-amber-200 dark:border-amber-800 text-[11px] space-y-1">
                <div className="font-semibold text-amber-800 dark:text-amber-200">
                  Cancel Recorded Payment
                </div>
                <div>
                  This will cancel the currently recorded payment of{' '}
                  <span className="font-bold">₹ {paidAmount.toLocaleString('en-IN')}</span> (Mode:{' '}
                  <span className="font-bold">{paymentMode}</span>).
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  The amount will return to <span className="font-bold text-red-500">Pending</span> so you can immediately collect it with the correct mode (e.g. Paytm).
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                  Reason for cancelling payment:
                </label>
                <select
                  value={cancelPaymentReason}
                  onChange={(e) => setCancelPaymentReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-xs focus:ring-1 focus:ring-sky-500"
                >
                  <option value="Paid by Paytm not cash">Person paid by Paytm not cash</option>
                  <option value="Paid by Google Pay / PhonePe / UPI not cash">Person paid by Google Pay / PhonePe / UPI not cash</option>
                  <option value="Paid by Card not cash">Person paid by Card not cash</option>
                  <option value="Incorrect payment mode recorded">Incorrect payment mode recorded</option>
                  <option value="Cheque bounced / failed">Cheque bounced / failed</option>
                  <option value="Other">Other reason...</option>
                </select>
              </div>

              {cancelPaymentReason === 'Other' && (
                <div>
                  <label className="block font-semibold text-gray-800 dark:text-gray-200 mb-1">
                    Specify Custom Reason:
                  </label>
                  <input
                    type="text"
                    value={customCancelReason}
                    onChange={(e) => setCustomCancelReason(e.target.value)}
                    placeholder="Enter reason..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-xs focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setIsCancelPaymentModalOpen(false)}
                className="px-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Close
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmCancelPayment}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded text-xs flex items-center gap-1.5"
              >
                {isProcessing ? 'Cancelling...' : 'Confirm Cancel Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Collect Payment Modal */}
      {isCollectPaymentModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-5 space-y-4 border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold text-sm">
                <CheckCircle2 size={18} />
                <span>Collect Payment - {invoiceNo}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCollectPaymentModalOpen(false)}
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
                  value={collectPaymentMode}
                  onChange={(e) => setCollectPaymentMode(e.target.value)}
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
                  placeholder="e.g. Corrected payment collected via Paytm"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-xs focus:ring-1 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setIsCollectPaymentModalOpen(false)}
                className="px-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Close
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmCollectPayment}
                className="px-4 py-1.5 bg-[#22c55e] hover:bg-[#16a34a] text-white font-semibold rounded text-xs flex items-center gap-1.5"
              >
                {isProcessing ? 'Saving...' : 'Save & Collect Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Cancel Entire Invoice Modal */}
      {isCancelInvoiceModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-5 space-y-4 border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm">
                <AlertTriangle size={18} />
                <span>Cancel Entire Invoice</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCancelInvoiceModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-700 dark:text-gray-300">
              <div className="bg-red-50 dark:bg-red-950/40 p-3 rounded border border-red-200 dark:border-red-800 text-[11px] space-y-1 text-red-800 dark:text-red-200">
                <div className="font-bold">Warning: Permanent Cancellation</div>
                <div>
                  Are you sure you want to cancel the entire invoice <span className="font-bold">{invoiceNo}</span> for <span className="font-bold">{clientName}</span>?
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  This will completely void the invoice and mark it as cancelled in all client records.
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-800 dark:text-gray-200 mb-1">
                  Reason for cancelling invoice:
                </label>
                <input
                  type="text"
                  value={cancelInvoiceReason}
                  onChange={(e) => setCancelInvoiceReason(e.target.value)}
                  placeholder="Enter cancellation reason..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-xs focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setIsCancelInvoiceModalOpen(false)}
                className="px-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Keep Invoice
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmCancelInvoice}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded text-xs flex items-center gap-1.5"
              >
                {isProcessing ? 'Cancelling...' : 'Yes, Cancel Entire Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
