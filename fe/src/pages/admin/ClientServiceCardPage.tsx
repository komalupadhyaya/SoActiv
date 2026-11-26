import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  User,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useClient } from '../../hooks/useClient';
import { useStaff } from '../../hooks/useStaff';
import { useServices } from '../../hooks/useServices';
import { useToast } from '../../contexts/ToastContext';
import { ProFormaInvoiceModal } from '../../components/modals/ProFormaInvoiceModal';
import { TransferServiceModal } from '../../components/modals/TransferServiceModal';
import {
  getClientPendingSummary,
  getInvoicePaymentBreakdown,
  buildCollectPaymentUpdate,
} from '../../utils/invoicePayment';

export const ClientServiceCardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clients, updateClient, fetchClients, getClientById } = useClient();
  const { staff, fetchAllStaff } = useStaff();
  const { services, fetchServices } = useServices();
  const { addToast } = useToast();
  const showToast = addToast;

  const [directClient, setDirectClient] = useState<any>(null);

  useEffect(() => {
    fetchAllStaff?.();
    fetchClients?.();
    fetchServices?.();
  }, [fetchAllStaff, fetchClients, fetchServices]);

  const memId = id || searchParams.get('memid') || '';

  useEffect(() => {
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

  const resolveStaffName = (idOrName?: string) => {
    if (!idOrName) return '';
    const found = staff?.find((s) => s._id === idOrName);
    if (found?.fullName) return found.fullName;
    if (/^[0-9a-fA-F]{24}$/.test(idOrName)) {
      if ((client as any)?.salesRepName) return (client as any).salesRepName;
      return 'Thomas';
    }
    return idOrName;
  };

  const [activeTopTab, setActiveTopTab] = useState<'Service Card' | string>('Service Card');
  const [accessModeTab, setAccessModeTab] = useState<'Individual Access' | string>('Individual Access');
  const [serviceStatusTab, setServiceStatusTab] = useState<'Active' | 'Expired'>('Active');
  const [biometricDevice, setBiometricDevice] = useState<string>('');
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceModalMode, setInvoiceModalMode] = useState<'new' | 'renew' | 'upgrade'>('new');
  const [serviceToRenew, setServiceToRenew] = useState<any | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [serviceToTransfer, setServiceToTransfer] = useState<any | null>(null);
  const [isTransferInvoiceModalOpen, setIsTransferInvoiceModalOpen] = useState(false);
  const [transferPayload, setTransferPayload] = useState<any | null>(null);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [collectInvoice, setCollectInvoice] = useState<any>(null);
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectMode, setCollectMode] = useState<string>('Paytm');
  const [collectNotes, setCollectNotes] = useState<string>('');
  const [isCollecting, setIsCollecting] = useState(false);

  const pendingSummary = useMemo(() => getClientPendingSummary(client), [client]);

  const openCollectModalForInvoice = (inv: any) => {
    const targetInv = inv || pendingSummary.pendingInvoices[0]?.invoice;
    if (!targetInv) return;
    const breakdown = getInvoicePaymentBreakdown(targetInv, Number(client?.packagePrice) || 0);
    setCollectInvoice({
      ...targetInv,
      net: breakdown.net,
      paid: breakdown.paid,
      pending: breakdown.pending,
    });
    setCollectAmount(breakdown.pending);
    setCollectMode('Paytm');
    setCollectNotes('');
    setIsCollectModalOpen(true);
  };

  const handleSaveCollectFromServiceCard = async () => {
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
      setCollectInvoice(null);
      showToast(`Payment of ₹ ${amount} collected successfully via ${collectMode}!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to collect payment', 'error');
    } finally {
      setIsCollecting(false);
    }
  };

  const clientName = client?.fullName || 'Member';
  const packagePrice = client?.packagePrice !== undefined ? client.packagePrice : 0;
  const attendanceId = client?.attendanceId || '2871';

  // Calculate deterministic numeric Member ID
  const memberId = useMemo(() => {
    if (client?._id) {
      const hex = client._id.replace(/[^0-9a-fA-F]/g, '').slice(-6) || '3061938';
      const num = 3000000 + (parseInt(hex, 16) % 90000);
      return String(num);
    }
    return '3061938';
  }, [client]);

  const serviceId = useMemo(() => {
    if (client?._id) {
      const hex = client._id.replace(/[^0-9a-fA-F]/g, '').slice(-4) || '7492';
      return String(7400000 + (parseInt(hex, 16) % 99999));
    }
    return '7492515';
  }, [client]);

  const formattedRelationshipDate = client?.createdAt
    ? new Date(client.createdAt).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).replace(/\//g, '-')
    : client?.startDate
      ? new Date(client.startDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).replace(/\//g, '-')
      : '26-08-2026';

  const ownInvoice = useMemo(() => {
    if (client?.invoices && Array.isArray(client.invoices)) {
      const found = client.invoices.find((inv: any) => !inv.isTransferred && !inv.isTransferFee && !inv.transferredFrom);
      if (found) return found;
    }
    if (client?.invoice && !client.invoice.isTransferred && !client.invoice.isTransferFee && !client.invoice.transferredFrom) {
      return client.invoice;
    }
    return null;
  }, [client]);

  const serviceName = useMemo(() => {
    if (ownInvoice?.items?.[0]?.serviceName) return ownInvoice.items[0].serviceName;
    if (ownInvoice?.serviceName) return ownInvoice.serviceName;
    if (client?.packagePrice && client.packagePrice >= 8000) return 'Gym Workout - 3 months';
    if (client?.packagePrice && client.packagePrice >= 5000) return 'Gym Workout - 2 months';
    if (client?.plan === 'premium') return 'PREMIUM MEMBERSHIP';
    return 'Gym Workout - 1 Month';
  }, [ownInvoice, client]);

  const serviceVariationName = useMemo(() => {
    if (ownInvoice?.items?.[0]?.duration) return ownInvoice.items[0].duration;
    if (ownInvoice?.duration) return ownInvoice.duration;
    if (client?.packagePrice && client.packagePrice >= 8000) return '90 Day(s)';
    if (client?.packagePrice && client.packagePrice >= 5000) return '60 Day(s)';
    if (client?.packagePrice && client.packagePrice <= 2500) return '30 Day(s)';
    return '30 Day(s)';
  }, [ownInvoice, client]);

  const latestFreeze = useMemo(() => {
    // Only consider active (Frozen) freezes — skip unfrozen records
    if (client?.freezes && client.freezes.length > 0) {
      const activeFreezes = client.freezes.filter((f: any) => f.status !== 'Unfreeze');
      if (activeFreezes.length > 0) return activeFreezes[0];
    }
    if (client?.freezeInfo && client.freezeInfo.status !== 'Unfreeze') {
      return client.freezeInfo;
    }
    return null;
  }, [client]);

  const freezeActiveTillFormatted = useMemo(() => {
    if (!latestFreeze?.freezeTillDate) return null;
    const d = new Date(latestFreeze.freezeTillDate);
    if (isNaN(d.getTime())) return latestFreeze.freezeTillDate;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }, [latestFreeze]);

  const durationValidText = useMemo(() => {
    const varLower = serviceVariationName.toLowerCase();
    return `6 Days Per week. Valid for ${varLower}.`;
  }, [serviceVariationName]);

  const totalFreezeDays = useMemo(() => {
    if (client?.freezes && client.freezes.length > 0) {
      // Only count days from records that are still Frozen (not Unfreeze)
      return client.freezes
        .filter((f: any) => f.status !== 'Unfreeze')
        .reduce((sum: number, f: any) => sum + (Number(f.numberOfDays) || 0), 0);
    }
    if (client?.freezeInfo?.numberOfDays && client.freezeInfo.status !== 'Unfreeze') {
      return Number(client.freezeInfo.numberOfDays) || 0;
    }
    return 0;
  }, [client]);

  const startDateObj = useMemo(() => {
    if (ownInvoice?.items?.[0]?.startDate) return new Date(ownInvoice.items[0].startDate);
    if (ownInvoice?.date) return new Date(ownInvoice.date);
    if (client?.createdAt) return new Date(client.createdAt);
    if (client?.startDate) return new Date(client.startDate);
    return new Date();
  }, [ownInvoice, client]);

  const endDateObj = useMemo(() => {
    let baseEnd: Date;
    if (ownInvoice?.items?.[0]?.expiryDate) {
      baseEnd = new Date(ownInvoice.items[0].expiryDate);
    } else if (ownInvoice?.expiryDate) {
      baseEnd = new Date(ownInvoice.expiryDate);
    } else {
      baseEnd = new Date(startDateObj);
      if (client?.packagePrice && client.packagePrice >= 8000) {
        baseEnd.setDate(baseEnd.getDate() + 90);
      } else if (client?.packagePrice && client.packagePrice >= 5000) {
        baseEnd.setDate(baseEnd.getDate() + 60);
      } else {
        baseEnd.setDate(baseEnd.getDate() + 30);
      }
    }

    if (totalFreezeDays > 0) {
      const extended = new Date(baseEnd);
      extended.setDate(extended.getDate() + totalFreezeDays);
      return extended;
    }

    return baseEnd;
  }, [ownInvoice, client, startDateObj, totalFreezeDays]);

  const formattedExpiryDate = useMemo(() => {
    if (!endDateObj) return '';
    const day = String(endDateObj.getDate()).padStart(2, '0');
    const month = String(endDateObj.getMonth() + 1).padStart(2, '0');
    const year = endDateObj.getFullYear();
    return `${day}-${month}-${year}`;
  }, [endDateObj]);

  const activeServiceText = useMemo(() => {
    if (!serviceVariationName || !formattedExpiryDate) return '';
    return `Following service(s) is currently active : ${serviceVariationName}, Expiring on ${formattedExpiryDate}`;
  }, [serviceVariationName, formattedExpiryDate]);

  const purchasedServices = useMemo(() => {
    if (!client) return [];

    const resolveServiceDisplay = (
      rawName: string | undefined,
      source: any,
      isPT: boolean,
      sessionsVal: string | number
    ) => {
      const raw = (rawName || '').trim();
      let resolvedServiceName = source?.baseServiceName || '';
      let matchedVariation: any = null;
      let parsedVariationName = '';

      if (services && services.length > 0) {
        if (resolvedServiceName) {
          const svcMatch = services.find(
            (s) => s.name.toLowerCase() === resolvedServiceName.toLowerCase()
          );
          if (svcMatch) {
            const targetVar = (source?.serviceVariationName || '').toLowerCase();
            if (targetVar) {
              matchedVariation = (svcMatch.variations || []).find(
                (v) => v.name.toLowerCase() === targetVar
              );
            }
          }
        } else if (raw) {
          const rawLower = raw.toLowerCase();
          for (const s of services) {
            for (const v of s.variations || []) {
              if (`${s.name} - ${v.name}`.toLowerCase() === rawLower) {
                resolvedServiceName = s.name;
                matchedVariation = v;
                parsedVariationName = v.name;
                break;
              }
            }
            if (resolvedServiceName) break;
          }

          if (!resolvedServiceName) {
            const prefixMatch = services.find((s) =>
              rawLower.startsWith(`${s.name.toLowerCase()} - `)
            );
            if (prefixMatch) {
              resolvedServiceName = prefixMatch.name;
              parsedVariationName = raw.slice(prefixMatch.name.length + 3).trim();
              matchedVariation = (prefixMatch.variations || []).find(
                (v) => v.name.toLowerCase() === parsedVariationName.toLowerCase()
              );
            } else {
              const exactMatch = services.find((s) => s.name.toLowerCase() === rawLower);
              if (exactMatch) {
                resolvedServiceName = exactMatch.name;
              }
            }
          }
        }
      }

      if (!resolvedServiceName) {
        if (raw.includes(' - ')) {
          const sepIdx = raw.indexOf(' - ');
          resolvedServiceName = raw.slice(0, sepIdx).trim();
          parsedVariationName = raw.slice(sepIdx + 3).trim();
        } else {
          resolvedServiceName = raw || (isPT ? 'Personal Session' : 'Club Membership');
        }
      }

      const durationLabel =
        source?.duration ||
        matchedVariation?.duration ||
        (isPT ? '30 day(s)' : '12 Months');

      const resolvedVariationName =
        source?.serviceVariationName ||
        matchedVariation?.name ||
        parsedVariationName ||
        source?.duration ||
        (isPT ? 'PT 1 Month' : '12 Months');

      const resolvedDaysPerWeek =
        source?.daysPerWeek ||
        matchedVariation?.daysPerWeek ||
        '7 Days Per week';

      const svcType = source?.serviceType || matchedVariation?.serviceType || '';
      const resolvedDurationText = isPT
        ? `${sessionsVal} Sessions, 1 Hours 00 minutes per session. Valid for 30 day(s).`
        : svcType === '1 Day pass' || svcType === 'Multiple Day pass'
          ? `Valid for ${durationLabel}.`
          : `${resolvedDaysPerWeek}. Valid for ${durationLabel}.`;

      return {
        serviceName: resolvedServiceName,
        serviceVariationName: resolvedVariationName,
        daysPerWeek: resolvedDaysPerWeek,
        durationLabel,
        durationText: resolvedDurationText,
      };
    };

    const list: any[] = [];
    let sIdx = 0;

    const processInvoice = (inv: any, invIdx: number | string) => {
      if (!inv) return;
      const isCancelled = Boolean(inv.isCancelled || inv.status === 'Cancelled' || inv.serviceCancelled);

      if (inv.items && Array.isArray(inv.items) && inv.items.length > 0) {
        inv.items.forEach((item: any, itemIdx: number) => {
          const nameLower = (item.serviceName || '').toLowerCase();
          const isPT =
            nameLower.includes('personal') ||
            nameLower.includes('pt') ||
            Boolean(inv.personalTrainer);

          const start = item.startDate
            ? new Date(item.startDate)
            : inv.date
              ? new Date(inv.date)
              : client.startDate
                ? new Date(client.startDate)
                : new Date();

          let end: Date;
          if (item.expiryDate) {
            end = new Date(item.expiryDate);
          } else if (item.endDate) {
            end = new Date(item.endDate);
          } else {
            end = new Date(start);
            end.setMonth(end.getMonth() + 1);
          }

          if (totalFreezeDays > 0 && !isPT) {
            end.setDate(end.getDate() + totalFreezeDays);
          }

          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const endMidnight = new Date(end);
          endMidnight.setHours(0, 0, 0, 0);
          const countdown = Math.max(
            0,
            Math.ceil((endMidnight.getTime() - today.getTime()) / (1000 * 3600 * 24))
          );
          const isTransferredOut = Boolean(item.isTransferred && item.transferredTo) || Boolean(inv.isTransferred && inv.transferredTo) || Boolean(item.serviceTransferred) || Boolean(inv.serviceTransferred);
          const isTransferredIn = Boolean(item.isTransferred && item.transferredFrom) || Boolean(inv.isTransferred && inv.transferredFrom) || Boolean(inv.transferredFrom);
          const isTransferFee = (item.serviceName || '').toLowerCase().includes('transfer fee') || Boolean(inv.isTransferFee);

          const isExpired = isTransferredOut ? false : (countdown === 0 && endMidnight < today);
          const status = isCancelled ? 'Cancelled' : isTransferredOut ? 'Transferred' : isExpired ? 'Expired' : 'Active';

          const hex = (client._id || '7492').replace(/[^0-9a-fA-F]/g, '').slice(-4);
          const sId = String(3080000 + (parseInt(hex, 16) % 9000) + sIdx * 73 + 1);

          const sessionsVal =
            item.sessions && item.sessions !== 'NaN' && item.sessions !== 'undefined'
              ? item.sessions
              : isPT
                ? '12'
                : 'Not Applicable';

          const invBreakdown = getInvoicePaymentBreakdown(inv, Number(client?.packagePrice) || 0);
          const itemPending = isCancelled || isTransferredOut ? 0 : invBreakdown.pending;
          const display = resolveServiceDisplay(item.serviceName, item, isPT, sessionsVal);

          list.push({
            key: `inv-${invIdx}-${itemIdx}`,
            serviceName: display.serviceName,
            serviceVariationName: display.serviceVariationName,
            daysPerWeek: display.daysPerWeek,
            durationLabel: display.durationLabel,
            serviceId: sId,
            isPT: isPT,
            ptStaff: resolveStaffName(inv.personalTrainer || (client as any)?.personalTrainer || 'Thomas'),
            totalSessions: sessionsVal,
            usedSessions: isPT ? '0' : 'Not Applicable',
            pendingSessions: sessionsVal,
            durationText: display.durationText,
            startDate: start,
            expiryDate: end,
            countdownDays: isCancelled ? 0 : countdown,
            status: status,
            isCancelled: isCancelled,
            isUpgrade: inv.isUpgrade,
            isTransferred: isTransferredIn,
            isTransferredOut: isTransferredOut,
            isTransferFee: isTransferFee,
            transferredFromName: inv.transferredFromName || item.transferredFromName,
            pendingAmount: itemPending,
            invoice: inv,
            rawItem: item,
          });
          sIdx++;
        });
      } else {
        // Single invoice without items
        const isPT = Boolean(inv.personalTrainer);
        const start = inv.date
          ? new Date(inv.date)
          : client.startDate
            ? new Date(client.startDate)
            : new Date();
        let end = inv.expiryDate ? new Date(inv.expiryDate) : new Date(start);
        if (!inv.expiryDate) end.setMonth(end.getMonth() + 1);

        if (totalFreezeDays > 0 && !isPT) {
          end.setDate(end.getDate() + totalFreezeDays);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endMidnight = new Date(end);
        endMidnight.setHours(0, 0, 0, 0);
        const countdown = Math.max(
          0,
          Math.ceil((endMidnight.getTime() - today.getTime()) / (1000 * 3600 * 24))
        );
        const isTransferredOut = Boolean(inv.isTransferred && inv.transferredTo) || Boolean(inv.serviceTransferred);
        const isTransferredIn = Boolean(inv.isTransferred && inv.transferredFrom) || Boolean(inv.transferredFrom);
        const isTransferFee = (inv.serviceName || '').toLowerCase().includes('transfer fee') || Boolean(inv.isTransferFee);

        const isExpired = isTransferredOut ? false : (countdown === 0 && endMidnight < today);
        const status = isCancelled ? 'Cancelled' : isTransferredOut ? 'Transferred' : isExpired ? 'Expired' : 'Active';

        const hex = (client._id || '7492').replace(/[^0-9a-fA-F]/g, '').slice(-4);
        const sId = String(3080000 + (parseInt(hex, 16) % 9000) + sIdx * 73 + 1);

        const invBreakdown = getInvoicePaymentBreakdown(inv, Number(client?.packagePrice) || 0);
        const itemPending = isCancelled || isTransferredOut ? 0 : invBreakdown.pending;
        const singleSessions = isPT ? '12' : 'Not Applicable';
        const display = resolveServiceDisplay(inv.serviceName, inv, isPT, singleSessions);

        list.push({
          key: `inv-${invIdx}`,
          serviceName: display.serviceName,
          serviceVariationName: display.serviceVariationName,
          daysPerWeek: display.daysPerWeek,
          durationLabel: display.durationLabel,
          serviceId: sId,
          isPT: isPT,
          ptStaff: resolveStaffName(inv.personalTrainer || 'Thomas'),
          totalSessions: singleSessions,
          usedSessions: isPT ? '0' : 'Not Applicable',
          pendingSessions: singleSessions,
          durationText: display.durationText,
          startDate: start,
          expiryDate: end,
          countdownDays: isCancelled ? 0 : countdown,
          status: status,
          isCancelled: isCancelled,
          isUpgrade: inv.isUpgrade,
          isTransferred: isTransferredIn,
          isTransferredOut: isTransferredOut,
          isTransferFee: isTransferFee,
          transferredFromName: inv.transferredFromName,
          pendingAmount: itemPending,
          invoice: inv,
        });
        sIdx++;
      }
    };

    // 1. Process client.invoices array
    if (client.invoices && Array.isArray(client.invoices) && client.invoices.length > 0) {
      client.invoices.forEach((inv: any, idx: number) => {
        processInvoice(inv, idx);
      });
    }

    // 2. Process client.invoice if it is not already in list
    if (client.invoice) {
      const alreadyInList = list.some(
        (item) =>
          item.invoice?.invoiceNo === client.invoice?.invoiceNo ||
          item.invoice?.id === client.invoice?.id ||
          item.invoice?._id === client.invoice?._id
      );
      if (!alreadyInList) {
        processInvoice(client.invoice, 'primary');
      }
    }

    // 3. Process client.transfersReceived if not already in list
    if (client.transfersReceived && Array.isArray(client.transfersReceived) && client.transfersReceived.length > 0) {
      client.transfersReceived.forEach((tr: any, trIdx: number) => {
        const exists = list.some(
          (item) =>
            item.invoice?.transferId === tr.transferId ||
            item.invoice?.invoiceNo === tr.transferFeeInvoiceNo ||
            item.key === `tr-rec-${trIdx}` ||
            (item.isTransferred && item.serviceName === tr.serviceName)
        );
        if (!exists) {
          const start = tr.startDate ? new Date(tr.startDate) : new Date();
          const end = tr.expiryDate ? new Date(tr.expiryDate) : new Date(start);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const startMidnight = new Date(start);
          startMidnight.setHours(0, 0, 0, 0);
          const endMidnight = new Date(end);
          endMidnight.setHours(0, 0, 0, 0);

          // Countdown = days from TODAY to expiry (time remaining counter)
          const countdown = Math.max(
            0,
            Math.ceil((endMidnight.getTime() - today.getTime()) / (1000 * 3600 * 24))
          );
          const isExpired = countdown === 0 && endMidnight < today;

          // Actual plan duration = days from startDate to expiryDate
          const planDurationDays = Math.max(
            1,
            Math.ceil((endMidnight.getTime() - startMidnight.getTime()) / (1000 * 3600 * 24))
          );

          // Build a variation name that reflects actual transferred duration
          // Prefer stored serviceVariationName but append computed days for clarity
          const storedVariationName = tr.serviceVariationName || tr.duration || '';
          const planDurationLabel = `${planDurationDays} Day(s)`;
          // If stored name already contains "Day(s)" or is just a number string, use computed label;
          // otherwise append the day count so it reads e.g. "1 Month / 30 Day(s)"
          let finalVariationName = storedVariationName;
          if (!storedVariationName) {
            finalVariationName = planDurationLabel;
          } else if (!storedVariationName.toLowerCase().includes('day')) {
            finalVariationName = `${storedVariationName} / ${planDurationLabel}`;
          }

          const finalDurationText =
            tr.durationText ||
            `7 Days Per week. Valid for ${planDurationLabel}. (${storedVariationName || planDurationLabel})`;

          list.unshift({
            key: `tr-rec-${trIdx}`,
            serviceName: tr.serviceName || 'Club Membership',
            serviceVariationName: finalVariationName,
            serviceId: tr.serviceId || String(3081000 + trIdx * 73),
            isPT: false,
            totalSessions: tr.sessions || 'Not Applicable',
            usedSessions: 'Not Applicable',
            pendingSessions: tr.sessions || 'Not Applicable',
            durationText: finalDurationText,
            startDate: start,
            expiryDate: end,
            countdownDays: countdown,
            status: isExpired ? 'Expired' : 'Active',
            isTransferred: true,
            isTransferredOut: false,
            transferredFromName: tr.fromClientName,
            transferData: tr,
          });
        }
      });
    }

    // 4. If list has NO non-transferred membership, include member's own registration membership!
    const hasOwnMembership = list.some((item) => !item.isTransferred && !item.isTransferFee);
    const isInactiveOrTransfer =
      client.status === 'inactive' ||
      (client as any).isTransfer ||
      (Number(client.packagePrice) === 0 && !client.invoice && (!client.invoices || client.invoices.length === 0));

    if (!hasOwnMembership && !isInactiveOrTransfer) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endMidnight = new Date(endDateObj);
      endMidnight.setHours(0, 0, 0, 0);
      const countdown = Math.max(
        0,
        Math.ceil((endMidnight.getTime() - today.getTime()) / (1000 * 3600 * 24))
      );

      const isTransferredOut =
        (client.transfersSent && client.transfersSent.length > 0) ||
        Boolean((client as any)?.serviceTransferred) ||
        (client.status === 'expired' && (client.transfersSent?.length || 0) > 0);
      const status = isTransferredOut
        ? 'Expired'
        : countdown === 0 && endMidnight < today
          ? 'Expired'
          : 'Active';

      list.unshift({
        key: 'own-registration-card',
        serviceName: serviceName,
        serviceVariationName: serviceVariationName,
        serviceId: serviceId,
        isPT: false,
        totalSessions: 'Not Applicable',
        usedSessions: 'Not Applicable',
        pendingSessions: 'Not Applicable',
        durationText: durationValidText,
        startDate: startDateObj,
        expiryDate: endDateObj,
        countdownDays: isTransferredOut ? 0 : countdown,
        status: status,
        isTransferredOut: isTransferredOut,
        isTransferred: false,
        isUpgrade: false,
        pendingAmount: isTransferredOut ? 0 : pendingSummary.totalPending,
        invoice: pendingSummary.pendingInvoices[0]?.invoice,
      });
    }

    return list;
  }, [
    client,
    services,
    startDateObj,
    endDateObj,
    totalFreezeDays,
    serviceName,
    serviceVariationName,
    serviceId,
    durationValidText,
    pendingSummary,
  ]);

  const hasActiveService = useMemo(() => {
    return purchasedServices.some((s) => s.status === 'Active' && !s.isCancelled);
  }, [purchasedServices]);

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
    setActiveTopTab(tab);
    if (tab === 'Profile' && client) {
      navigate(`/admin/client-form/${client._id}`);
    } else if (tab === 'Payments' && client) {
      navigate(`/admin/clients/payments/${client._id}`);
    } else if (tab === 'Appointments' && client) {
      navigate(`/admin/clients/appointments/${client._id}`);
    } else if (tab === 'Training' && client) {
      navigate(`/admin/clients/training/${client._id}`);
    } else if (tab === 'Schedule') {
      navigate('/admin/schedule');
    }
  };

  return (
    <div className="min-h-full bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col font-sans">
      {/* Breadcrumbs Header */}
      <div className="px-4 sm:px-6 pt-3 pb-2 flex items-center justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <Link to="/admin/dashboard" className="hover:text-gray-900 dark:hover:text-gray-200">
            Home
          </Link>
          <span>/</span>
          <Link to="/admin/clients" className="hover:text-gray-900 dark:hover:text-gray-200">
            Clients
          </Link>
          <span>/</span>
          <span>Validity Based</span>
          <span>/</span>
          <span className="text-[#ff5e28] font-semibold">Service Card - {clientName}</span>
        </div>
      </div>

      {/* Top Tabs Navigation */}
      <div className="px-4 sm:px-6 pt-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
        <div className="flex items-center gap-6 min-w-max text-xs text-gray-600 dark:text-gray-400">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabClick(tab)}
              className={`pb-2.5 transition-colors cursor-pointer ${activeTopTab === tab
                ? 'text-[#ff5e28] font-medium border-b-2 border-[#ff5e28]'
                : 'hover:text-gray-900 dark:hover:text-gray-200'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Banner / Header Row */}
      <div className="mx-4 sm:mx-6 mt-4 p-4 bg-[#ffece5] dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded-xs flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
          Service Card - {clientName}
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
              setInvoiceModalMode('new');
              setServiceToRenew(null);
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

      {/* Member Details Overview Grid */}
      <div className="mx-4 sm:mx-6 mt-4 p-4 border border-gray-200 dark:border-gray-800 rounded-xs grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
        {/* Left 2 Columns */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          {/* Column 1 */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Current Membership status</span>
              <span
                className={
                  purchasedServices.some((svc) => svc.status === 'Active' && !svc.isTransferFee)
                    ? 'text-[#22c55e] font-bold'
                    : 'text-red-500 font-bold'
                }
              >
                {purchasedServices.some((svc) => svc.status === 'Active' && !svc.isTransferFee)
                  ? 'Active'
                  : 'Inactive'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Relationship since</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium">{formattedRelationshipDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">
                Total Bookings ({purchasedServices.filter((s) => !s.isTransferFee).length})
              </span>
              <span className="text-gray-900 dark:text-gray-100">
                Total Booking value : {purchasedServices.filter((s) => !s.isTransferFee).length === 0 ? 0 : packagePrice}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Total Referrals (0)</span>
              <span className="text-gray-900 dark:text-gray-100">Total Referral value : 0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Total Product purchased : 0</span>
              <span className="text-gray-900 dark:text-gray-100">Total Product value : 0</span>
            </div>
            <div className="flex items-center justify-between">
              <Link
                to={`/admin/clients/transfers-sent/${client?._id || memId || id}`}
                className="text-sky-600 hover:text-sky-700 hover:underline font-medium"
              >
                Transfers Sent ({client?.transfersSent?.length || 0})
              </Link>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Member Id : {memberId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Attendance ID : {attendanceId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Total Loyalty Points:0</span>
              <button
                type="button"
                onClick={() => showToast('Loyalty points details opened', 'info')}
                className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xs text-[11px] hover:bg-gray-200 cursor-pointer"
              >
                Add/View Loyalty Points
              </button>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xs text-[11px] hover:bg-gray-200 cursor-pointer"
              >
                Advance: Current Balance(0)
              </button>
            </div>
            <div className="flex items-center justify-between">
              <Link
                to={`/admin/clients/transfers-received/${client?._id || memId || id}`}
                className="text-sky-600 hover:text-sky-700 hover:underline font-medium"
              >
                Transfers Received ({client?.transfersReceived?.length || 0})
              </Link>
              <div className="flex items-center gap-2">
                <span
                  className={`font-medium ${pendingSummary.totalPending > 0
                    ? 'text-red-500 font-bold'
                    : 'text-gray-700 dark:text-gray-300'
                    }`}
                >
                  Total Pending payment ({pendingSummary.totalPending})
                </span>
                {pendingSummary.totalPending > 0 && pendingSummary.pendingInvoices[0] && (
                  <button
                    type="button"
                    onClick={() => openCollectModalForInvoice(pendingSummary.pendingInvoices[0].invoice)}
                    className="px-2 py-0.5 bg-[#22c55e] hover:bg-[#16a34a] text-white text-[10px] font-bold rounded-xs shadow-2xs transition-colors cursor-pointer"
                    title="Collect pending payment"
                  >
                    Pay
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Member Photo Avatar */}
        <div className="lg:col-span-4 flex items-center justify-center lg:justify-end">
          <div className="w-36 h-36 border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden rounded-xs">
            {client?.profileImage ? (
              <img src={client.profileImage} alt={clientName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#1e293b] text-white flex items-center justify-center">
                <User size={64} className="text-gray-400" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Biometric Access Section */}
      <div className="mx-4 sm:mx-6 mt-4 p-4 border-t border-b border-gray-100 dark:border-gray-800 space-y-3">
        <div className="text-red-500 font-medium text-xs">
          {hasActiveService
            ? 'Biometric Access : No biometric data found'
            : 'Biometric Access : No biometric accessible service card found'}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => showToast('Resync triggered to device', 'success')}
            className="px-3.5 py-1.5 bg-[#ff5e28] hover:bg-[#e04f1d] text-white font-semibold rounded-xs shadow-2xs transition-colors cursor-pointer"
          >
            Resync To Device
          </button>
          <button
            type="button"
            onClick={() => showToast('Member revoked from device', 'info')}
            className="px-3.5 py-1.5 bg-[#ff5e28] hover:bg-[#e04f1d] text-white font-semibold rounded-xs shadow-2xs transition-colors cursor-pointer"
          >
            Revoke Member From Device
          </button>

          {hasActiveService && (
            <>
              <select
                value={biometricDevice}
                onChange={(e) => setBiometricDevice(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xs text-gray-700 dark:text-gray-200 text-xs focus:ring-1 focus:ring-orange-500 cursor-pointer min-w-[140px]"
              >
                <option value="">Select</option>
                <option value="Main Gate Device">Main Gate Device</option>
                <option value="Gym Entrance">Gym Entrance</option>
              </select>
              <span className="text-red-500 font-bold">*</span>
              <button
                type="button"
                onClick={() => showToast('Enroll fingerprint modal opened', 'info')}
                className="px-3.5 py-1.5 bg-[#ff5e28] hover:bg-[#e04f1d] text-white font-semibold rounded-xs shadow-2xs transition-colors cursor-pointer"
              >
                Enroll Fingerprint
              </button>
            </>
          )}
        </div>
      </div>

      {/* Access Mode Tabs */}
      <div className="mx-4 sm:mx-6 mt-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-6 text-xs text-gray-600 dark:text-gray-400">
          {['Individual Access', 'Shared Access', 'Multiclub Access', 'Postpaid Subscription'].map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setAccessModeTab(mode)}
              className={`pb-2 font-medium cursor-pointer transition-colors ${accessModeTab === mode
                ? 'text-[#ff5e28] border-b-2 border-[#ff5e28]'
                : 'hover:text-gray-900 dark:hover:text-gray-200'
                }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Purchased Services Section */}
      <div className="mx-4 sm:mx-6 mt-4 pb-12 space-y-4">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          Recent purchased services
        </h2>

        {/* Active / Expired Sub-tabs */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setServiceStatusTab('Active')}
            className={`pb-1 cursor-pointer ${serviceStatusTab === 'Active'
              ? 'text-[#ff5e28] border-b-2 border-[#ff5e28]'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400'
              }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setServiceStatusTab('Expired')}
            className={`pb-1 cursor-pointer ${serviceStatusTab === 'Expired'
              ? 'text-[#ff5e28] border-b-2 border-[#ff5e28]'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400'
              }`}
          >
            Expired
          </button>
        </div>

        {/* Service Cards Detail Boxes */}
        {purchasedServices.filter((svc) =>
          serviceStatusTab === 'Active'
            ? svc.status === 'Active' || svc.status === 'Transferred'
            : svc.status === 'Expired' || svc.status === 'Cancelled'
        ).length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-xs bg-gray-50/50 dark:bg-gray-800/20">
            No {serviceStatusTab.toLowerCase()} services found for this member.
          </div>
        ) : (
          purchasedServices
            .filter((svc) =>
              serviceStatusTab === 'Active'
                ? svc.status === 'Active' || svc.status === 'Transferred'
                : svc.status === 'Expired' || svc.status === 'Cancelled'
            )
            .map((svc) => {
              const sDay = svc.startDate.getDate();
              const sMonth =
                svc.startDate.toLocaleString('en-US', { month: 'long' }).toUpperCase() +
                `'` +
                String(svc.startDate.getFullYear()).slice(2);
              const sDayName = svc.startDate.toLocaleDateString('en-US', { weekday: 'long' });

              const eDay = svc.expiryDate.getDate();
              const eMonth =
                svc.expiryDate.toLocaleString('en-US', { month: 'long' }).toUpperCase() +
                `'` +
                String(svc.expiryDate.getFullYear()).slice(2);
              const eDayName = svc.expiryDate.toLocaleDateString('en-US', { weekday: 'long' });

              const isFeeItem =
                Boolean(svc.isTransferFee) ||
                (svc.serviceName || '').toLowerCase().includes('transfer fee') ||
                (svc.serviceVariationName || '').toLowerCase().includes('transfer fee') ||
                svc.durationText === '-' ||
                svc.serviceVariationName === '-';

              if (isFeeItem) {
                return (
                  <div
                    key={svc.key}
                    className="border border-gray-200 dark:border-gray-800 border-l-4 border-l-[#22b0e6] p-4 rounded-xs text-xs space-y-4 bg-white dark:bg-gray-850 shadow-2xs"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-x-8 gap-y-1">
                        <div>
                          <span className="text-gray-500">Service Name : </span>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">
                            {svc.serviceName}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Service Variation Name : </span>
                          <span className="text-gray-800 dark:text-gray-200">
                            {svc.serviceVariationName}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Service Id : </span>
                          <span className="text-gray-800 dark:text-gray-200">{svc.serviceId}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-gray-500">Duration: </span>
                        <span className="text-gray-800 dark:text-gray-200">-</span>
                      </div>
                    </div>

                    {/* Bottom Actions Row for Fee Item */}
                    <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          const targetClient = client?._id || memId || id;
                          if (targetClient) {
                            navigate(`/admin/clients/cancel-refund/${targetClient}`);
                          }
                        }}
                        className="px-2.5 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xs text-[11px] hover:bg-gray-50 dark:hover:bg-gray-700 shadow-2xs cursor-pointer text-gray-800 dark:text-gray-200"
                      >
                        Cancel/Refund
                      </button>
                    </div>
                  </div>
                );
              }

              if (svc.status === 'Expired') {
                const cleanDuration = (() => {
                  if (svc.durationText && !svc.durationText.includes('7 Days Per week')) {
                    return svc.durationText;
                  }
                  const varName = svc.serviceVariationName || '';
                  const numMatch = varName.match(/\d+/);
                  if (varName.toLowerCase().includes('day')) {
                    const days = numMatch ? numMatch[0] : '15';
                    return `Valid for ${days} day(s)`;
                  }
                  if (varName.toLowerCase().includes('month')) {
                    const months = numMatch ? numMatch[0] : '1';
                    return `Valid for ${months} month(s)`;
                  }
                  if (varName.toLowerCase().includes('year')) {
                    const years = numMatch ? numMatch[0] : '1';
                    return `Valid for ${years} year(s)`;
                  }
                  if (svc.durationText) {
                    return svc.durationText.replace(/^7 Days Per week\.\s*/i, '').trim();
                  }
                  return `Valid for ${varName || '1 month(s)'}`;
                })();

                return (
                  <div
                    key={svc.key}
                    className="border border-gray-200 dark:border-gray-800 rounded-xs bg-white dark:bg-gray-850 shadow-2xs overflow-hidden flex"
                  >
                    {/* Left decorative stripe with subtle dots matching Image 1 */}
                    <div className="w-3 sm:w-3.5 bg-[#edf8f8] dark:bg-teal-950/30 border-r border-[#a8dfdc] dark:border-teal-800/50 flex flex-col justify-around items-center py-3 shrink-0 select-none">
                      <div className="flex flex-col gap-2 opacity-50">
                        <div className="flex gap-0.5">
                          <span className="w-0.5 h-0.5 rounded-full bg-[#2da19c]" />
                          <span className="w-0.5 h-0.5 rounded-full bg-[#2da19c]" />
                        </div>
                        <div className="flex gap-0.5">
                          <span className="w-0.5 h-0.5 rounded-full bg-[#2da19c]" />
                          <span className="w-0.5 h-0.5 rounded-full bg-[#2da19c]" />
                        </div>
                        <div className="flex gap-0.5">
                          <span className="w-0.5 h-0.5 rounded-full bg-[#2da19c]" />
                          <span className="w-0.5 h-0.5 rounded-full bg-[#2da19c]" />
                        </div>
                        <div className="flex gap-0.5">
                          <span className="w-0.5 h-0.5 rounded-full bg-[#2da19c]" />
                          <span className="w-0.5 h-0.5 rounded-full bg-[#2da19c]" />
                        </div>
                        <div className="flex gap-0.5">
                          <span className="w-0.5 h-0.5 rounded-full bg-[#2da19c]" />
                          <span className="w-0.5 h-0.5 rounded-full bg-[#2da19c]" />
                        </div>
                      </div>
                    </div>

                    {/* Expired Service Card Body */}
                    <div className="flex-1 p-4 text-xs space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        {/* Left Details */}
                        <div className="lg:col-span-8 space-y-2.5">
                          <div className="flex flex-wrap items-center gap-x-8 gap-y-1">
                            <div>
                              <span className="text-gray-500">Service Name : </span>
                              <span className="font-semibold text-gray-800 dark:text-gray-200 uppercase">
                                {svc.serviceName}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Service Variation Name : </span>
                              <span className="text-gray-800 dark:text-gray-200">
                                {svc.serviceVariationName}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Service Id : </span>
                              <span className="text-gray-800 dark:text-gray-200">{svc.serviceId}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-8 gap-y-1">
                            <div>
                              <span className="text-gray-500">Duration: </span>
                              <span className="text-gray-800 dark:text-gray-200">
                                {cleanDuration}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Branch: </span>
                              <span className="text-gray-800 dark:text-gray-200">VIP Road</span>
                            </div>
                          </div>

                          <div>
                            <span className="text-gray-500">Total Sessions : </span>
                            <span className="text-gray-800 dark:text-gray-200">
                              {svc.isPT ? svc.totalSessions : 'Not Applicable'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-8 pt-1">
                            <div>
                              <span className="text-gray-500">Status : </span>
                              <span className="font-semibold text-[#f59e0b] dark:text-[#fbbf24]">
                                Expired
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Last visited on : -</span>
                            </div>
                            {svc.pendingAmount > 0 && !svc.isCancelled && !svc.isTransferredOut && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">Pending Payment : </span>
                                <span className="font-bold text-red-500">₹ {svc.pendingAmount}</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    openCollectModalForInvoice(
                                      svc.invoice || pendingSummary.pendingInvoices[0]?.invoice
                                    )
                                  }
                                  className="px-2 py-0.5 bg-[#22c55e] hover:bg-[#16a34a] text-white text-[10px] font-bold rounded-xs shadow-2xs transition-colors cursor-pointer"
                                >
                                  Pay
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right Countdown & Dates */}
                        <div className="lg:col-span-4 flex flex-col items-center lg:items-end justify-between gap-3">
                          <div className="flex items-center gap-6 text-center">
                            {/* Countdown */}
                            <div>
                              <div className="text-[10px] text-gray-500 font-semibold tracking-wider">
                                COUNTDOWN
                              </div>
                              <div className="text-3xl font-black text-gray-900 dark:text-white leading-tight">
                                0
                              </div>
                              <div className="text-[10px] text-gray-500 font-bold">DAY(S)</div>
                            </div>

                            {/* Start Date */}
                            <div>
                              <div className="text-[10px] text-gray-500 font-semibold tracking-wider">
                                START DATE
                              </div>
                              <div className="text-3xl font-black text-gray-900 dark:text-white leading-tight">
                                {sDay}
                              </div>
                              <div className="text-[10px] text-gray-800 dark:text-gray-200 font-bold">
                                {sMonth}
                              </div>
                              <div className="text-[10px] text-gray-400 italic">{sDayName}</div>
                            </div>

                            {/* Expiry Date */}
                            <div>
                              <div className="text-[10px] text-gray-500 font-semibold tracking-wider">
                                EXPIRY DATE
                              </div>
                              <div className="text-3xl font-black text-gray-900 dark:text-white leading-tight">
                                {eDay}
                              </div>
                              <div className="text-[10px] text-gray-800 dark:text-gray-200 font-bold">
                                {eMonth}
                              </div>
                              <div className="text-[10px] text-gray-400 italic">{eDayName}</div>
                            </div>
                          </div>

                          {/* Right Action: ONLY Change Date */}
                          <div>
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/admin/clients/change-date/${client?._id || memId || id}`)
                              }
                              className="px-2.5 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xs text-[11px] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-2xs cursor-pointer"
                            >
                              Change Date
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Actions Row: ONLY Renew and Cancel/Refund */}
                      <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setInvoiceModalMode('renew');
                            setServiceToRenew(svc);
                            setIsInvoiceModalOpen(true);
                          }}
                          className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xs text-[11px] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-2xs cursor-pointer"
                        >
                          Renew
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const targetClient = client?._id || memId || id;
                            if (targetClient) {
                              navigate(`/admin/clients/cancel-refund/${targetClient}`);
                            }
                          }}
                          className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xs text-[11px] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-2xs cursor-pointer"
                        >
                          Cancel/Refund
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={svc.key}
                  className={`border border-gray-200 dark:border-gray-800 border-l-4 ${svc.isTransferredOut ? 'border-l-[#a855f7]' : svc.isTransferred ? 'border-l-[#eab308]' : 'border-l-[#22b0e6]'
                    } p-4 rounded-xs text-xs space-y-4 bg-white dark:bg-gray-850 shadow-2xs`}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Left Details */}
                    <div className="lg:col-span-8 space-y-2">
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Service Name : </span>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">
                            {svc.serviceName}
                          </span>
                          {svc.isTransferred && (
                            <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 text-[10px] font-bold rounded-xs border border-yellow-300 dark:border-yellow-700">
                              Transferred Membership
                            </span>
                          )}
                          {svc.isTransferredOut && (
                            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 text-[10px] font-bold rounded-xs border border-purple-300 dark:border-purple-700">
                              Transferred Out
                            </span>
                          )}
                          {svc.isTransferred && (svc.transferredFromName || svc.transferData?.fromClientName) && (
                            <span className="text-gray-500 text-[11px]">
                              (From: {svc.transferredFromName || svc.transferData?.fromClientName})
                            </span>
                          )}
                          {svc.isTransferredOut && svc.invoice?.transferredToName && (
                            <span className="text-gray-500 text-[11px]">
                              (To: {svc.invoice.transferredToName})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-500">Service Variation Name : </span>
                          <span className="text-gray-800 dark:text-gray-200">
                            {svc.serviceVariationName}
                          </span>
                          {svc.isPT && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-red-500 text-red-500 font-bold text-[10px]">
                              PT
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-gray-500">Service Id : </span>
                          <span className="text-gray-800 dark:text-gray-200">{svc.serviceId}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                        <div>
                          <span className="text-gray-500">Duration: </span>
                          <span className="text-gray-800 dark:text-gray-200">
                            {svc.durationText}
                          </span>
                        </div>
                        {!svc.isPT && (
                          <div>
                            <span className="text-gray-500">Branch: </span>
                            <span className="text-gray-800 dark:text-gray-200">VIP Road</span>
                          </div>
                        )}
                      </div>

                      {svc.isPT ? (
                        <>
                          <div>
                            <span className="text-gray-500">PT Staff: </span>
                            <span className="text-gray-800 dark:text-gray-200">{svc.ptStaff}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                            <div>
                              <span className="text-gray-500">Total Sessions : </span>
                              <span className="text-gray-800 dark:text-gray-200">
                                {svc.totalSessions}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Used Sessions : </span>
                              <span className="text-gray-800 dark:text-gray-200">
                                {svc.usedSessions}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Pending Sessions : </span>
                              <span className="text-gray-800 dark:text-gray-200">
                                {svc.pendingSessions}
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div>
                          <span className="text-gray-500">Total Sessions : </span>
                          <span className="text-gray-800 dark:text-gray-200">Not Applicable</span>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-4 pt-1">
                        <div>
                          <span className="text-gray-500">Status : </span>
                          <span
                            className={`font-semibold ${svc.status === 'Active'
                              ? 'text-[#22c55e]'
                              : svc.status === 'Transferred'
                                ? 'text-purple-500'
                                : svc.status === 'Cancelled'
                                  ? 'text-red-500'
                                  : 'text-amber-500'
                              }`}
                          >
                            {svc.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Last visited on : -</span>
                          <button
                            type="button"
                            onClick={() => showToast('Attendance details', 'info')}
                            className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xs text-[11px] hover:bg-gray-200 cursor-pointer"
                          >
                            Attendance
                          </button>
                        </div>
                        {svc.pendingAmount > 0 && !svc.isCancelled && !svc.isTransferredOut && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Pending Payment : </span>
                            <span className="font-bold text-red-500">₹ {svc.pendingAmount}</span>
                            <button
                              type="button"
                              onClick={() =>
                                openCollectModalForInvoice(
                                  svc.invoice || pendingSummary.pendingInvoices[0]?.invoice
                                )
                              }
                              className="px-2 py-0.5 bg-[#22c55e] hover:bg-[#16a34a] text-white text-[10px] font-bold rounded-xs shadow-2xs transition-colors cursor-pointer"
                            >
                              Pay
                            </button>
                          </div>
                        )}
                      </div>

                      {freezeActiveTillFormatted && !svc.isPT && (
                        <div className="pt-1 text-xs">
                          <span className="text-gray-700 dark:text-gray-300 font-normal">
                            Freeze Active Till :{' '}
                          </span>
                          <span className="text-red-500 font-medium">
                            {freezeActiveTillFormatted}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right Countdown & Dates */}
                    <div className="lg:col-span-4 flex flex-col items-center lg:items-end justify-between gap-3">
                      <div className="flex items-center gap-6 text-center">
                        {/* Countdown */}
                        <div>
                          <div className="text-[10px] text-gray-500 font-semibold tracking-wider">
                            {svc.isTransferred ? 'UNTIL EXPIRY' : 'COUNTDOWN'}
                          </div>
                          <div className="text-3xl font-black text-gray-900 dark:text-white leading-tight">
                            {svc.countdownDays}
                          </div>
                          <div className="text-[10px] text-gray-500 font-bold">DAY(S)</div>
                        </div>

                        {/* Start Date */}
                        <div>
                          <div className="text-[10px] text-gray-500 font-semibold tracking-wider">
                            START DATE
                          </div>
                          <div className="text-3xl font-black text-gray-900 dark:text-white leading-tight">
                            {sDay}
                          </div>
                          <div className="text-[10px] text-gray-800 dark:text-gray-200 font-bold">
                            {sMonth}
                          </div>
                          <div className="text-[10px] text-gray-400 italic">{sDayName}</div>
                        </div>

                        {/* Expiry Date */}
                        <div>
                          <div className="text-[10px] text-gray-500 font-semibold tracking-wider">
                            EXPIRY DATE
                          </div>
                          <div className="text-3xl font-black text-gray-900 dark:text-white leading-tight">
                            {eDay}
                          </div>
                          <div className="text-[10px] text-gray-800 dark:text-gray-200 font-bold">
                            {eMonth}
                          </div>
                          <div className="text-[10px] text-gray-400 italic">{eDayName}</div>
                        </div>
                      </div>

                      {/* Right Change Date & Freeze buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/admin/clients/change-date/${client?._id || memId || id}`)
                          }
                          className="px-2.5 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xs text-[11px] hover:bg-gray-50 dark:hover:bg-gray-700 shadow-2xs cursor-pointer"
                        >
                          Change Date
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/admin/clients/freeze/${client?._id || memId || id}`)
                          }
                          className="px-2.5 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xs text-[11px] hover:bg-gray-50 dark:hover:bg-gray-700 shadow-2xs cursor-pointer"
                        >
                          Freeze
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Actions Row */}
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-2 text-xs">
                    {(svc.isTransferredOut
                      ? ['Cancel/Refund']
                      : svc.isTransferred
                        ? [
                          'Transferred',
                          'Suspend',
                          'Staff Update',
                          'Add Appointment',
                          'Cancel/Refund',
                          'Bulk Reservation',
                        ]
                        : svc.isPT
                          ? [
                            'Suspend',
                            'Staff Update',
                            'Add Appointment',
                            'Change Session',
                            'Cancel/Refund',
                            'Bulk Reservation',
                          ]
                          : svc.isUpgrade
                            ? [
                              'Cancel Upgraded',
                              'Suspend',
                              'Staff Update',
                              'Add Appointment',
                              'Cancel/Refund',
                              'Bulk Reservation',
                            ]
                            : svc.isTransferFee
                              ? ['Cancel/Refund']
                              : [
                                'Transfer',
                                'Upgrade',
                                'Suspend',
                                'Staff Update',
                                'Add Appointment',
                                'Cancel/Refund',
                                'Bulk Reservation',
                              ]
                    ).map((action) => {
                      if (action === 'Transferred') {
                        return (
                          <button
                            key={action}
                            type="button"
                            className="px-2.5 py-1 bg-[#ffff00] border border-yellow-400 text-gray-900 font-semibold rounded-xs shadow-2xs cursor-default text-[11px]"
                          >
                            Transferred
                          </button>
                        );
                      }

                      return (
                        <button
                          key={action}
                          type="button"
                          onClick={() => {
                            if (action === 'Transfer') {
                              setServiceToTransfer(svc);
                              setIsTransferModalOpen(true);
                            } else if (action === 'Upgrade') {
                              setInvoiceModalMode('upgrade');
                              setServiceToRenew(null);
                              setIsInvoiceModalOpen(true);
                            } else if (action === 'Cancel Upgraded') {
                              showToast('Upgraded service cancelled', 'info');
                            } else if (action === 'Cancel/Refund') {
                              const targetClient = client?._id || memId || id;
                              if (targetClient) {
                                navigate(`/admin/clients/cancel-refund/${targetClient}`);
                              }
                            } else {
                              showToast(`${action} action clicked`, 'info');
                            }
                          }}
                          className="px-2.5 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-2xs cursor-pointer text-[11px]"
                        >
                          {action}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }))}

        {/* Load More Button */}
        <div className="flex justify-center pt-2">
          <button
            type="button"
            className="px-4 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xs text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-2xs cursor-pointer"
          >
            Load More
          </button>
        </div>
      </div>

      {/* Regular Pro Forma Invoice Modal for Renewals / Upgrades / New Invoices */}
      <ProFormaInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setServiceToRenew(null);
          setInvoiceModalMode('new');
        }}
        onSave={async (invoiceData: any) => {
          const dateObj = new Date();
          const monthStr = dateObj.toLocaleString('en-US', { month: 'short' });
          const yearStr = dateObj.getFullYear();
          const randomNum = Math.floor(Math.random() * 90) + 10;
          const newInvoiceNo = `${monthStr}${randomNum}-${yearStr}`;

          const entryTotalDue = Number(invoiceData.totalDue) || Number(packagePrice) || 0;
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

          const todayMidnight = new Date();
          todayMidnight.setHours(0, 0, 0, 0);
          const isClientExpiredByDate = client?.endDate
            ? new Date(client.endDate).setHours(0, 0, 0, 0) < todayMidnight.getTime()
            : false;

          const isRenewalAction =
            invoiceModalMode === 'renew' ||
            (invoiceModalMode !== 'upgrade' &&
              (client?.status === 'expired' ||
                isClientExpiredByDate ||
                (client?.invoices && client.invoices.length > 0) ||
                Boolean(client?.invoice)));

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
              (client as any)?.paymentMode ||
              'Cash',
            status: entryPending === 0 ? 'Paid' : 'Partially Paid',
            writeOff: 'No',
            isUpgrade: invoiceModalMode === 'upgrade' || !isRenewalAction,
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
                : Number(client?.packagePrice) > 0
                  ? [
                    {
                      invoiceNo: (client as any)?.invoiceNo || `${monthStr}94-${yearStr}`,
                      createdAt: client?.startDate || client?.createdAt || new Date().toISOString(),
                      date: client?.startDate || new Date().toISOString(),
                      expiryDate: client?.endDate,
                      serviceName: serviceName,
                      duration: serviceVariationName,
                      amount: client?.packagePrice || 0,
                      tax: 0,
                      net: client?.packagePrice || 0,
                      paid: client?.packagePrice || 0,
                      pending: 0,
                      mode: (client as any)?.paymentMode || 'Cash',
                      status: 'Paid',
                      writeOff: 'No',
                    },
                  ]
                  : [];

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
              packagePrice: invoiceData.totalDue || client.packagePrice,
              paymentMode: newInvoiceEntry.mode,
            };

            if (isRenewalAction || invoiceModalMode === 'upgrade') {
              updatePayload.status = 'active';
              updatePayload.plan = resolvedPlan;
              if (newStartDate) updatePayload.startDate = newStartDate;
              if (newEndDate) updatePayload.endDate = newEndDate;
              if (isRenewalAction) {
                updatePayload.isRenewal = true;
                updatePayload.renewedAt = new Date().toISOString();
              }
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
          setServiceToRenew(null);
          setInvoiceModalMode('new');
          showToast(
            isRenewalAction
              ? 'Service renewed successfully'
              : 'Invoice saved successfully',
            'success'
          );
          navigate(`/admin/clients/payments/${memId || id}`);
        }}
        memberData={{
          fullName: clientName,
          contactNumber: client?.contactNumber || '',
          email: client?.email || '',
          salesRep: (client as any)?.salesRep?._id || (client as any)?.salesRep || '',
          packagePrice: serviceToRenew
            ? Number(serviceToRenew.rawItem?.fee || serviceToRenew.invoice?.amount || packagePrice) || 0
            : undefined,
          paymentMode: (client as any)?.paymentMode || 'Cash',
          activeServiceText: hasActiveService ? activeServiceText : undefined,
        }}
        recentPurchasedServices={
          invoiceModalMode === 'renew' && serviceToRenew
            ? (() => {
              const now = new Date();
              const startStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
              const endD = new Date(now);
              const varName = (serviceToRenew.durationLabel || serviceToRenew.serviceVariationName || '').toLowerCase();
              const numMatch = varName.match(/\d+/);
              const num = numMatch ? parseInt(numMatch[0], 10) : 0;
              if (varName.includes('year') && num > 0) {
                endD.setFullYear(endD.getFullYear() + num);
              } else if (varName.includes('month') && num > 0) {
                endD.setMonth(endD.getMonth() + num);
              } else if (varName.includes('day') && num > 0) {
                endD.setDate(endD.getDate() + num);
              } else if (serviceToRenew.startDate && serviceToRenew.expiryDate) {
                const origDays = Math.max(
                  1,
                  Math.round(
                    (new Date(serviceToRenew.expiryDate).getTime() - new Date(serviceToRenew.startDate).getTime()) /
                    (1000 * 3600 * 24)
                  )
                );
                endD.setDate(endD.getDate() + origDays);
              } else {
                endD.setMonth(endD.getMonth() + 1);
              }
              const expiryStr = `${endD.getFullYear()}-${String(endD.getMonth() + 1).padStart(2, '0')}-${String(endD.getDate()).padStart(2, '0')}`;

              return [
                {
                  serviceName:
                    serviceToRenew.serviceVariationName &&
                      serviceToRenew.serviceVariationName !== serviceToRenew.serviceName
                      ? `${serviceToRenew.serviceName} - ${serviceToRenew.serviceVariationName}`
                      : serviceToRenew.serviceName,
                  baseServiceName: serviceToRenew.serviceName,
                  serviceVariationName: serviceToRenew.serviceVariationName,
                  daysPerWeek: serviceToRenew.daysPerWeek,
                  duration: serviceToRenew.durationLabel || serviceToRenew.serviceVariationName,
                  startDate: startStr,
                  expiryDate: expiryStr,
                  sessions: serviceToRenew.isPT ? serviceToRenew.totalSessions : 'NaN',
                  sacCode: serviceToRenew.rawItem?.sacCode || '',
                  quantity: 1,
                  fee: Number(serviceToRenew.rawItem?.fee || serviceToRenew.invoice?.amount || packagePrice) || 0,
                  taxRate: serviceToRenew.rawItem?.taxRate || 0,
                },
              ];
            })()
            : undefined
        }
      />

      {/* Transfer Service Modal */}
      {isTransferModalOpen && serviceToTransfer && (
        <TransferServiceModal
          isOpen={isTransferModalOpen}
          onClose={() => {
            setIsTransferModalOpen(false);
            setServiceToTransfer(null);
          }}
          currentClient={client}
          service={serviceToTransfer}
          onProceedToBilling={(data) => {
            setIsTransferModalOpen(false);
            setTransferPayload(data);
            setIsTransferInvoiceModalOpen(true);
          }}
        />
      )}

      {/* Transfer Fee Billing Modal */}
      {isTransferInvoiceModalOpen && transferPayload && (
        <ProFormaInvoiceModal
          isOpen={isTransferInvoiceModalOpen}
          onClose={() => {
            setIsTransferInvoiceModalOpen(false);
            setTransferPayload(null);
            setServiceToTransfer(null);
          }}
          memberData={{
            fullName:
              transferPayload.billRaisedFor === 'From'
                ? transferPayload.fromClient?.fullName
                : transferPayload.toClient?.fullName,
            contactNumber:
              transferPayload.billRaisedFor === 'From'
                ? transferPayload.fromClient?.contactNumber
                : transferPayload.toClient?.contactNumber,
            email:
              transferPayload.billRaisedFor === 'From'
                ? transferPayload.fromClient?.email
                : transferPayload.toClient?.email,
            activeServiceText: `Following service(s) is currently active : ${transferPayload.serviceToTransfer?.serviceVariationName ||
              transferPayload.serviceToTransfer?.duration ||
              '3 Months'
              }, Expiring on ${transferPayload.endDate
                ? new Date(transferPayload.endDate).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                }).replace(/\//g, '-')
                : '28-02-2024'
              }`,
          }}
          onSave={async (invoiceData: any) => {
            const { fromClient, toClient, serviceToTransfer, billRaisedFor, startDate, endDate } = transferPayload;

            const dateObj = new Date();
            const monthStr = dateObj.toLocaleString('en-US', { month: 'short' });
            const yearStr = dateObj.getFullYear();
            const randomInvNum = Math.floor(10 + Math.random() * 90);
            const transferInvoiceNo = `${monthStr}${randomInvNum}-${yearStr}`;

            // 1. Create Transfer Record
            const transferRecord = {
              transferId: 'TR-' + Date.now(),
              fromClientId: fromClient._id,
              fromClientName: fromClient.fullName,
              fromClientPhone: fromClient.contactNumber,
              toClientId: toClient._id,
              toClientName: toClient.fullName,
              toClientPhone: toClient.contactNumber,
              serviceId: serviceToTransfer.serviceId || '3081363',
              serviceName: serviceToTransfer.serviceName || 'Club Membership',
              serviceVariationName: serviceToTransfer.serviceVariationName || '3 Months',
              duration: serviceToTransfer.serviceVariationName || '3 Months',
              durationText: serviceToTransfer.durationText,
              sessions: serviceToTransfer.totalSessions || 'Not Applicable',
              startDate: startDate,
              expiryDate: endDate,
              transferDate: new Date().toISOString(),
              transferFeeInvoiceNo: transferInvoiceNo,
              billRaisedFor: billRaisedFor,
              status: 'Transferred',
              createdAt: new Date().toISOString(),
            };

            const totalPaid = (invoiceData.paymentModes || []).reduce(
              (acc: number, pm: any) => acc + (Number(pm.amount) || 0),
              0
            );

            // 2. Transfer Fee Invoice object
            const transferFeeInvoiceObj = {
              id: 'inv-fee-' + Date.now(),
              invoiceNo: transferInvoiceNo,
              date: invoiceData.invoiceDate || new Date().toISOString().split('T')[0],
              paid: totalPaid,
              amount: Number(invoiceData.subTotal) || 0,
              tax: Number(invoiceData.taxDue) || 0,
              net: Number(invoiceData.totalDue) || 0,
              pending: Number(invoiceData.pendingAmount) || 0,
              status: (Number(invoiceData.pendingAmount) || 0) > 0 ? 'Pending' : 'Paid',
              paymentMode: invoiceData.paymentModes?.[0]?.mode || 'Cash',
              paymentModes: invoiceData.paymentModes || [],
              salesRep: invoiceData.salesRep,
              salesRepName: resolveStaffName(invoiceData.salesRep),
              serviceName: invoiceData.items?.[0]?.serviceName || 'Membership Transfer Fee',
              duration: invoiceData.items?.[0]?.duration || '-',
              items: (invoiceData.items || []).map((it: any) => ({
                ...it,
                startDate: it.startDate || startDate,
                expiryDate: it.expiryDate || endDate,
              })),
              isTransferFee: true,
              terms: 'The membership paid for in this bill is not transferrable.',
            };

            try {
              // 3. Fetch fresh fromClient and toClient from MongoDB
              const fromClientFresh =
                (await getClientById(fromClient._id)) ||
                clients.find((c: any) => String(c._id) === String(fromClient._id)) ||
                fromClient;

              const toClientFresh =
                (await getClientById(toClient._id)) ||
                clients.find((c: any) => String(c._id) === String(toClient._id)) ||
                toClient;

              // Update fromClient invoices
              const updatedFromInvoices = (fromClientFresh.invoices || []).map((inv: any) => {
                if (
                  serviceToTransfer.invoice &&
                  (inv.invoiceNo === serviceToTransfer.invoice.invoiceNo ||
                    inv.id === serviceToTransfer.invoice.id ||
                    inv._id === serviceToTransfer.invoice._id)
                ) {
                  return {
                    ...inv,
                    serviceTransferred: true,
                    isTransferred: true,
                    transferredTo: toClient._id,
                    transferredToName: toClient.fullName,
                    transferredToPhone: toClient.contactNumber,
                    transferId: transferRecord.transferId,
                  };
                }
                return inv;
              });

              // If fromClient had a single invoice property
              let fromInvoiceSingle = fromClientFresh.invoice;
              if (fromInvoiceSingle) {
                fromInvoiceSingle = {
                  ...fromInvoiceSingle,
                  serviceTransferred: true,
                  isTransferred: true,
                  transferredTo: toClient._id,
                };
              }

              if (billRaisedFor === 'From') {
                updatedFromInvoices.unshift(transferFeeInvoiceObj);
              }

              const fromTransfersSent = [...(fromClientFresh.transfersSent || []), transferRecord];

              // Sanitize fromClient before saving
              const updatedFromRes = await updateClient(fromClient._id, {
                ...fromClientFresh,
                salesRep: fromClientFresh.salesRep?._id || fromClientFresh.salesRep,
                memberManager: fromClientFresh.memberManager?._id || fromClientFresh.memberManager,
                trainer: fromClientFresh.trainer?._id || fromClientFresh.trainer,
                personalTrainer: fromClientFresh.personalTrainer?._id || fromClientFresh.personalTrainer,
                invoice: fromInvoiceSingle,
                invoices: updatedFromInvoices,
                transfersSent: fromTransfersSent,
                status: 'expired',
              });

              if (updatedFromRes?.data && (String(client?._id) === String(fromClient._id) || String(id) === String(fromClient._id))) {
                setDirectClient(updatedFromRes.data);
              }

              // 5. Update toClient in MongoDB
              const existingToInvoices = [...(toClientFresh.invoices || [])];
              if (
                toClientFresh.invoice &&
                !existingToInvoices.some(
                  (inv: any) =>
                    inv.invoiceNo === toClientFresh.invoice?.invoiceNo ||
                    inv.id === toClientFresh.invoice?.id ||
                    inv._id === toClientFresh.invoice?._id
                )
              ) {
                existingToInvoices.push(toClientFresh.invoice);
              }

              // Do NOT add transferredServiceInvoiceObj to recipient's invoices array.
              // Transferred membership invoice belongs to the sender member who paid for it.
              // The recipient's transferred membership is tracked and rendered via transfersReceived on Service Card.
              // Filter out any previously stored transferred-in membership invoices to keep invoices clean.
              const cleanedToInvoices = existingToInvoices.filter(
                (inv: any) =>
                  !inv.transferredFrom &&
                  !(inv.isTransferred && !inv.transferredTo && !inv.isTransferFee && !inv.serviceTransferred) &&
                  inv.paymentMode !== 'Transferred'
              );

              const updatedToInvoices = [...cleanedToInvoices];

              if (billRaisedFor === 'To') {
                updatedToInvoices.unshift(transferFeeInvoiceObj);
              }

              const toTransfersReceived = [...(toClientFresh.transfersReceived || []), transferRecord];

              // Do NOT overwrite client-level startDate/endDate with transfer dates.
              // processInvoice falls back to client.startDate when invoice items lack explicit dates,
              // which would corrupt the recipient's own membership invoice display.
              // Transfer dates are already stored inside transferredServiceInvoiceObj.items and transfersReceived.

              const updatedToRes = await updateClient(toClient._id, {
                ...toClientFresh,
                salesRep: toClientFresh.salesRep?._id || toClientFresh.salesRep,
                memberManager: toClientFresh.memberManager?._id || toClientFresh.memberManager,
                trainer: toClientFresh.trainer?._id || toClientFresh.trainer,
                personalTrainer: toClientFresh.personalTrainer?._id || toClientFresh.personalTrainer,
                startDate: startDate || toClientFresh.startDate,
                endDate: endDate || toClientFresh.endDate,
                packagePrice: Number(toClientFresh.packagePrice) > 0 ? toClientFresh.packagePrice : Number(serviceToTransfer.rawItem?.fee || serviceToTransfer.invoice?.paid || 8000),
                invoices: updatedToInvoices,
                transfersReceived: toTransfersReceived,
                status: 'active',
              });

              if (updatedToRes?.data && (String(client?._id) === String(toClient._id) || String(id) === String(toClient._id))) {
                setDirectClient(updatedToRes.data);
              }

              await fetchClients?.();

              setIsTransferInvoiceModalOpen(false);
              setTransferPayload(null);
              setServiceToTransfer(null);

              showToast(`Membership transferred successfully to ${toClient.fullName}`, 'success');

              // Navigate to appropriate service card
              if (billRaisedFor === 'From') {
                navigate(`/admin/clients/service-card/${fromClient._id}`);
              } else {
                navigate(`/admin/clients/service-card/${toClient._id}`);
              }
            } catch (err: any) {
              console.error('Transfer save error:', err);
              showToast(err.message || 'Failed to complete membership transfer', 'error');
            }
          }}
        />
      )}

      {/* Collect Pending Payment Modal on Service Card */}
      {isCollectModalOpen && collectInvoice && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-5 space-y-4 border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold text-sm">
                <CheckCircle2 size={18} />
                <span>
                  Collect Payment{collectInvoice.invoiceNo ? ` - ${collectInvoice.invoiceNo}` : ''}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsCollectModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 cursor-pointer"
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
                  min="0"
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(Math.max(0, Number(e.target.value) || 0))}
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
                  placeholder="e.g. Paid pending balance"
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
                disabled={isCollecting || collectAmount <= 0}
                onClick={handleSaveCollectFromServiceCard}
                className="px-4 py-1.5 bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-50 text-white font-semibold rounded text-xs flex items-center gap-1.5 cursor-pointer"
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
