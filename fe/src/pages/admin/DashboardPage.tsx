// fe/src/pages/admin/DashboardPage.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Lock,
  FileText,
  CreditCard,
  Smartphone,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useClient } from '../../hooks/useClient';
import { useEnquiry } from '../../hooks/useEnquiry';
import { useStaff } from '../../hooks/useStaff';
import { useFollowUp } from '../../hooks/useFollowUp';
import { useClientAttendance } from '../../hooks/useClientAttendance';
import { useGymClass } from '../../hooks/useGymClass';
import { useSchedule } from '../../hooks/useSchedule';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate, Link } from 'react-router-dom';

type DateFilterType = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'all';

interface QuickNote {
  id: string;
  text: string;
  createdAt: string;
  author: string;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Top Tabs
  const [activeTab, setActiveTab] = useState<'snapshot' | 'follow-ups' | 'leaderboards'>('snapshot');

  // Main Date Filter Dropdown
  const [dateFilter, setDateFilter] = useState<DateFilterType>('today');
  const [selectedFilter, setSelectedFilter] = useState<DateFilterType>('today');

  // Summary Card Date Navigator (day offset relative to today)
  const [summaryDateOffset, setSummaryDateOffset] = useState<number>(0);

  // Modals
  const [isNotesModalOpen, setIsNotesModalOpen] = useState<boolean>(false);
  const [isPartnersModalOpen, setIsPartnersModalOpen] = useState<boolean>(false);
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [quickNotes, setQuickNotes] = useState<QuickNote[]>(() => {
    try {
      const saved = localStorage.getItem('soactiv_admin_quick_notes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Data Hooks
  const { clients, refresh: refreshClients } = useClient();
  const { enquiries, refreshEnquiries } = useEnquiry();
  const { staff, fetchAllStaff } = useStaff();
  const { followUps, fetchFollowUps } = useFollowUp();
  const { fetchTodayLogs } = useClientAttendance();
  const { sessions, fetchUpcomingSessions } = useGymClass();
  const { schedules, fetchSchedules } = useSchedule();

  const [todayAttendanceLogs, setTodayAttendanceLogs] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Initial Data Fetch
  const loadAllDashboardData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.allSettled([
        refreshClients(),
        refreshEnquiries(),
        fetchAllStaff(),
        fetchFollowUps(),
        fetchUpcomingSessions(undefined, 30),
        fetchSchedules(),
        fetchTodayLogs().then((logs) => setTodayAttendanceLogs(logs || [])),
      ]);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [
    refreshClients,
    refreshEnquiries,
    fetchAllStaff,
    fetchFollowUps,
    fetchUpcomingSessions,
    fetchSchedules,
    fetchTodayLogs,
  ]);

  useEffect(() => {
    loadAllDashboardData();
  }, [loadAllDashboardData]);

  // Save quick notes
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    const note: QuickNote = {
      id: Date.now().toString(),
      text: newNoteText.trim(),
      createdAt: new Date().toISOString(),
      author: user?.name || user?.fullName || user?.fullname || 'Admin',
    };
    const updated = [note, ...quickNotes];
    setQuickNotes(updated);
    localStorage.setItem('soactiv_admin_quick_notes', JSON.stringify(updated));
    setNewNoteText('');
    addToast('Note saved successfully!', 'success');
  };

  const handleDeleteNote = (id: string) => {
    const updated = quickNotes.filter((n) => n.id !== id);
    setQuickNotes(updated);
    localStorage.setItem('soactiv_admin_quick_notes', JSON.stringify(updated));
  };

  // Helper to test if a date string falls inside the selected filter
  const isDateInFilter = useCallback(
    (dateStr?: string | Date | null, filter: DateFilterType = selectedFilter): boolean => {
      if (!dateStr) return false;
      let targetDate: Date;
      if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [y, m, d] = dateStr.split('-').map(Number);
        targetDate = new Date(y, m - 1, d, 12, 0, 0);
      } else {
        targetDate = new Date(dateStr);
      }
      if (isNaN(targetDate.getTime())) return false;

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      switch (filter) {
        case 'today':
          return targetDate >= todayStart && targetDate <= todayEnd;
        case 'yesterday': {
          const yestStart = new Date(todayStart);
          yestStart.setDate(yestStart.getDate() - 1);
          const yestEnd = new Date(todayEnd);
          yestEnd.setDate(yestEnd.getDate() - 1);
          return targetDate >= yestStart && targetDate <= yestEnd;
        }
        case 'this_week': {
          const day = now.getDay();
          const diff = now.getDate() - day + (day === 0 ? -6 : 1);
          const monday = new Date(now.setDate(diff));
          monday.setHours(0, 0, 0, 0);
          return targetDate >= monday;
        }
        case 'this_month':
          return (
            targetDate.getFullYear() === now.getFullYear() &&
            targetDate.getMonth() === now.getMonth()
          );
        case 'last_month': {
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
          return targetDate >= lastMonth && targetDate <= lastMonthEnd;
        }
        case 'this_year':
          return targetDate.getFullYear() === now.getFullYear();
        case 'all':
        default:
          return true;
      }
    },
    [selectedFilter]
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 1. TOP 6 KPI METRICS (SALES, PAYMENTS COLLECTED, PENDING, NEW CLIENTS, RENEWALS, CHECK-INS)
  // ───────────────────────────────────────────────────────────────────────────
  const kpiData = useMemo(() => {
    let totalSales = 0;
    let totalCollected = 0;
    let totalPending = 0;
    let newClients = 0;
    let renewals = 0;

    // Payment mode breakdown map
    const payModeMap: Record<string, number> = {};

    clients.forEach((client) => {
      // Collect all invoices for this client (prefer client.invoices, fallback to client.invoice)
      const clientInvoices =
        client.invoices && Array.isArray(client.invoices) && client.invoices.length > 0
          ? client.invoices
          : client.invoice
          ? [client.invoice]
          : [];

      // Check if client had a renewal in this period
      let clientRenewalsInPeriod = 0;
      if (clientInvoices.length > 0) {
        clientInvoices.forEach((inv: any, idx: number) => {
          if (inv.isCancelled || inv.status === 'Cancelled') return;

          const invDate = inv.date || inv.invoiceDate || inv.createdAt;
          if (!invDate || !isDateInFilter(invDate)) return;

          // Determine if this invoice is a renewal:
          // 1. Explicit renewal or upgrade flag
          // 2. Client has multiple invoices and this is a subsequent invoice (not the oldest)
          // 3. Invoice date is distinctly after client initial creation date
          const isInitialInvoice = clientInvoices.length === 1 || idx === clientInvoices.length - 1;
          const isExplicitRenewal = Boolean(inv.isRenewal || inv.isUpgrade || inv.renewal);
          const isSubsequentInvoice = clientInvoices.length > 1 && !isInitialInvoice;
          const isAfterRegistration = client.createdAt && (
            new Date(invDate).getTime() - new Date(client.createdAt).getTime() > 24 * 60 * 60 * 1000
          );

          if (isExplicitRenewal || isSubsequentInvoice || isAfterRegistration) {
            clientRenewalsInPeriod += 1;
          }
        });
      }

      if (clientRenewalsInPeriod === 0) {
        if ((client as any).renewedAt && isDateInFilter((client as any).renewedAt)) {
          clientRenewalsInPeriod = 1;
        } else if ((client as any).isRenewal && client.startDate && isDateInFilter(client.startDate)) {
          clientRenewalsInPeriod = 1;
        }
      }

      renewals += clientRenewalsInPeriod;

      // Count new clients if their registration or initial start date falls within this filter
      const initialDate = client.createdAt || client.startDate;
      if (initialDate && isDateInFilter(initialDate)) {
        newClients += 1;
      }

      const isClientInPeriod = isDateInFilter(client.startDate || client.createdAt);

      const packagePrice = Number(client.packagePrice) || 0;
      const ptPrice = client.hasPersonalTraining && client.personalTrainingPrice ? Number(client.personalTrainingPrice) : 0;
      const clientTotal = packagePrice + ptPrice;

      if (clientInvoices.length > 0) {
        clientInvoices.forEach((inv: any) => {
          if (inv.isCancelled || inv.status === 'Cancelled') {
            return;
          }

          const invDate = inv.date || inv.invoiceDate || inv.createdAt || client.startDate || client.createdAt;
          if (!isDateInFilter(invDate)) {
            return;
          }

          const invTotal = Number(inv.net ?? inv.totalDue ?? inv.amount ?? inv.totalAmount) || 0;

          let invPaid = 0;
          if (inv.paymentCancelled) {
            invPaid = 0;
          } else if (inv.paid !== undefined && inv.paid !== null && !isNaN(Number(inv.paid))) {
            invPaid = Number(inv.paid);
          } else if (inv.totalPaid !== undefined && inv.totalPaid !== null && !isNaN(Number(inv.totalPaid))) {
            invPaid = Number(inv.totalPaid);
          } else if (inv.paidAmount !== undefined && inv.paidAmount !== null && !isNaN(Number(inv.paidAmount))) {
            invPaid = Number(inv.paidAmount);
          } else if (Array.isArray(inv.paymentModes) && inv.paymentModes.length > 0) {
            invPaid = inv.paymentModes.reduce((acc: number, pm: any) => acc + (Number(pm.amount) || 0), 0);
          } else if (inv.pendingAmount !== undefined && inv.pendingAmount !== null && !isNaN(Number(inv.pendingAmount))) {
            invPaid = Math.max(0, invTotal - Number(inv.pendingAmount));
          } else if (inv.pending !== undefined && inv.pending !== null && !isNaN(Number(inv.pending))) {
            invPaid = Math.max(0, invTotal - Number(inv.pending));
          } else if (inv.balanceAmount !== undefined && inv.balanceAmount !== null && !isNaN(Number(inv.balanceAmount))) {
            invPaid = Math.max(0, invTotal - Number(inv.balanceAmount));
          } else {
            invPaid = invTotal;
          }

          let invPending = 0;
          if (inv.paymentCancelled) {
            invPending = invTotal;
          } else if (inv.pending !== undefined && inv.pending !== null && !isNaN(Number(inv.pending))) {
            invPending = Number(inv.pending);
          } else if (inv.pendingAmount !== undefined && inv.pendingAmount !== null && !isNaN(Number(inv.pendingAmount))) {
            invPending = Number(inv.pendingAmount);
          } else if (inv.balanceAmount !== undefined && inv.balanceAmount !== null && !isNaN(Number(inv.balanceAmount))) {
            invPending = Number(inv.balanceAmount);
          } else {
            invPending = Math.max(0, invTotal - invPaid);
          }

          totalSales += invTotal;
          totalCollected += invPaid;
          totalPending += invPending;

          if (Array.isArray(inv.paymentModes) && inv.paymentModes.length > 0) {
            inv.paymentModes.forEach((pm: any) => {
              const amt = Number(pm.amount) || 0;
              if (amt > 0) {
                const pmMode = pm.mode && pm.mode !== 'Select' ? pm.mode : 'Cash';
                payModeMap[pmMode] = (payModeMap[pmMode] || 0) + amt;
              }
            });
          } else if (invPaid > 0) {
            const mode = inv.mode || client.paymentMode || 'Google Pay';
            payModeMap[mode] = (payModeMap[mode] || 0) + invPaid;
          }
        });
      } else if (isClientInPeriod) {
        const clientPaid = (client as any).paid !== undefined
          ? Number((client as any).paid)
          : (client as any).pendingAmount !== undefined
          ? Math.max(0, clientTotal - Number((client as any).pendingAmount))
          : (client as any).pending !== undefined
          ? Math.max(0, clientTotal - Number((client as any).pending))
          : clientTotal;

        const clientPending = (client as any).pending !== undefined
          ? Number((client as any).pending)
          : (client as any).pendingAmount !== undefined
          ? Number((client as any).pendingAmount)
          : Math.max(0, clientTotal - clientPaid);

        totalSales += clientTotal;
        totalCollected += clientPaid;
        totalPending += clientPending;

        const mode = client.paymentMode || (clientPaid > 0 ? 'Google Pay' : 'Pending');
        if (clientPaid > 0) {
          payModeMap[mode] = (payModeMap[mode] || 0) + clientPaid;
        }
      }
    });

    const paymentModeRows = Object.entries(payModeMap).map(([mode, amount], idx) => ({
      sNo: idx + 1,
      payMode: mode,
      amount: amount.toFixed(2),
    }));

    // Check-ins count for the period
    const checkIns = todayAttendanceLogs.filter((log) => isDateInFilter(log.date || log.createdAt)).length;

    return {
      sales: totalSales,
      paymentsCollected: totalCollected,
      paymentsPending: totalPending,
      newClientsCount: newClients,
      renewalsCount: renewals,
      checkInsCount: checkIns,
      paymentModeRows,
    };
  }, [clients, todayAttendanceLogs, isDateInFilter]);

  // ───────────────────────────────────────────────────────────────────────────
  // 2. SUMMARY CARD (Date-Navigated Right Column Widget)
  // ───────────────────────────────────────────────────────────────────────────
  const summaryDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + summaryDateOffset);
    return d;
  }, [summaryDateOffset]);

  const summaryDateLabel = useMemo(() => {
    if (summaryDateOffset === 0) return 'Today';
    if (summaryDateOffset === -1) return 'Yesterday';
    if (summaryDateOffset === 1) return 'Tomorrow';
    return summaryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  }, [summaryDate, summaryDateOffset]);

  const summaryStats = useMemo(() => {
    const targetDay = summaryDate.getDate();
    const targetMonth = summaryDate.getMonth();
    const targetYear = summaryDate.getFullYear();

    const isSameDate = (dStr?: string | Date | null) => {
      if (!dStr) return false;
      const d = new Date(dStr);
      return d.getDate() === targetDay && d.getMonth() === targetMonth && d.getFullYear() === targetYear;
    };

    const isSameMonthAndDay = (dStr?: string | Date | null) => {
      if (!dStr) return false;
      const d = new Date(dStr);
      return d.getDate() === targetDay && d.getMonth() === targetMonth;
    };

    // 1. Follow-ups (completed / total for that day)
    const dayFollowUps = followUps.filter((f) => isSameDate(f.scheduledDate || (f as any).date));
    const completedFollowUps = dayFollowUps.filter((f) => f.status === 'completed').length;
    const totalFollowUps = dayFollowUps.length;

    // 2. Appointments / PT Member Sessions
    const dayAppointments = schedules.filter((s) => isSameDate(s.scheduledDate) && s.type === 'member-session');
    const completedAppointments = dayAppointments.filter((s) => s.status === 'completed').length;
    const totalAppointments = dayAppointments.length;

    // 3. Classes
    const daySessions = sessions.filter((s) => isSameDate(s.date));
    const completedClasses = daySessions.filter((s) => s.status === 'completed').length;
    const totalClasses = daySessions.length;

    // 4. Service expiry (Memberships ending on this day or within next 7 days if today)
    const serviceExpiryCount = clients.filter((c) => {
      if (!c.endDate) return false;
      if (summaryDateOffset === 0) {
        const diffDays = Math.ceil((new Date(c.endDate).getTime() - summaryDate.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7 && c.status === 'active';
      }
      return isSameDate(c.endDate);
    }).length;

    // 5. PT expiry
    const ptExpiryCount = clients.filter((c) => {
      if (!c.hasPersonalTraining || !c.endDate) return false;
      if (summaryDateOffset === 0) {
        const diffDays = Math.ceil((new Date(c.endDate).getTime() - summaryDate.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7 && c.status === 'active';
      }
      return isSameDate(c.endDate);
    }).length;

    // 6. Upgrades
    const upgradesCount = clients.filter((c) => {
      return (c as any).planUpgraded && isSameDate((c as any).upgradedAt || c.updatedAt);
    }).length;

    // 7. Client birthdays
    const clientBirthdays = clients.filter((c) => isSameMonthAndDay(c.dateOfBirth)).length;

    // 8. Client Anniversaries (Joined gym on this month/day in past years)
    const clientAnniversaries = clients.filter((c) => {
      if (!c.startDate) return false;
      const startD = new Date(c.startDate);
      return startD.getFullYear() < targetYear && isSameMonthAndDay(c.startDate);
    }).length;

    // 9. Staff birthdays
    const staffBirthdays = staff.filter((s) => isSameMonthAndDay(s.dob)).length;

    // 10. Staff Anniversaries (Joined gym on this month/day in past years)
    const staffAnniversaries = staff.filter((s) => {
      const joinDate = s.joiningDate || s.dateOfJoining;
      if (!joinDate) return false;
      const joinD = new Date(joinDate);
      return joinD.getFullYear() < targetYear && isSameMonthAndDay(joinDate);
    }).length;

    return {
      followUpsText: `(${completedFollowUps}/${totalFollowUps})`,
      appointmentsText: `(${completedAppointments}/${totalAppointments})`,
      classesText: `(${completedClasses}/${totalClasses})`,
      serviceExpiry: serviceExpiryCount,
      ptExpiry: ptExpiryCount,
      upgrades: upgradesCount,
      clientBirthdays,
      clientAnniversaries,
      staffBirthdays,
      staffAnniversaries,
    };
  }, [summaryDate, summaryDateOffset, followUps, schedules, sessions, clients, staff]);

  // ───────────────────────────────────────────────────────────────────────────
  // 3. BOOKINGS / RESERVATIONS / CANCELLATIONS
  // ───────────────────────────────────────────────────────────────────────────
  const bookingsData = useMemo(() => {
    // Classes
    const classBookings = sessions.reduce((acc, s) => acc + (s.bookedCount || 0), 0);
    const classReservations = sessions.filter((s) => s.status === 'scheduled').length;
    const classCancellations = sessions.filter((s) => s.status === 'cancelled').length;

    // Sessions (PT / Member Sessions)
    const sessionBookings = schedules.filter((s) => s.type === 'member-session').length;
    const sessionReservations = schedules.filter((s) => s.type === 'member-session' && s.status === 'pending').length;
    const sessionCancellations = schedules.filter((s) => s.type === 'member-session' && s.status === 'cancelled').length;

    return {
      classes: { bookings: classBookings, reservations: classReservations, cancellations: classCancellations },
      sessions: { bookings: sessionBookings, reservations: sessionReservations, cancellations: sessionCancellations },
    };
  }, [sessions, schedules]);

  // ───────────────────────────────────────────────────────────────────────────
  // 4. ENQUIRIES & CLIENTS BREAKDOWNS
  // ───────────────────────────────────────────────────────────────────────────
  const enquiriesBreakdown = useMemo(() => {
    const total = enquiries.length;
    const open = enquiries.filter((e) => e.status !== 'converted' && e.status !== 'lost').length;
    const converted = enquiries.filter((e) => e.status === 'converted').length;
    const lost = enquiries.filter((e) => e.status === 'lost').length;

    const trials = enquiries.filter((e) => e.trialType && e.trialType !== 'no-trial');
    const scheduledTrials = trials.filter((e) => (e as any).trialStatus === 'scheduled' || e.trialDateTime).length;
    const completedTrials = trials.filter((e) => (e as any).trialStatus === 'completed').length;
    const notAttendedTrials = trials.filter((e) => (e as any).trialStatus === 'not-attended' || (e as any).trialStatus === 'missed').length;

    return {
      total,
      open,
      converted,
      lost,
      scheduledTrials,
      completedTrials,
      notAttendedTrials,
    };
  }, [enquiries]);

  const clientsBreakdown = useMemo(() => {
    const total = clients.length;
    const active = clients.filter((c) => c.status === 'active').length;
    const inactive = clients.filter((c) => c.status !== 'active').length;
    return { total, active, inactive };
  }, [clients]);

  // ───────────────────────────────────────────────────────────────────────────
  // 5. MEMBER SUPPORT REQUESTS & FEEDBACK
  // ───────────────────────────────────────────────────────────────────────────
  const supportAndFeedback = useMemo(() => {
    const supportRequests = enquiries.filter((e) => e.source === 'support' || (e as any).category === 'support');
    const raised = supportRequests.length;
    const closed = supportRequests.filter((e) => e.status === 'converted' || e.status === 'lost').length;
    const open = raised - closed;

    const feedbackEnquiries = enquiries.filter((e) => (e as any).callTag === 'cold' || (e as any).feedback);
    const received = feedbackEnquiries.length;
    const negative = feedbackEnquiries.filter((e) => (e as any).callTag === 'cold').length;

    return {
      support: { raised, closed, open },
      feedback: { received, negative },
    };
  }, [enquiries]);

  return (
    <div className="space-y-4 px-1 sm:px-2 w-full max-w-full pb-12">
      {/* Top Breadcrumb & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-gray-800 pb-2">
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <Link to="/admin/dashboard" className="hover:text-gray-900 dark:hover:text-white transition-colors">
            Home
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-[#ff5722] font-semibold">Dashboard</span>
        </div>

        {/* Snapshot / Follow-ups / Leaderboards Tabs */}
        <div className="flex items-center space-x-6 mt-3 sm:mt-0 text-sm font-medium">
          <button
            onClick={() => setActiveTab('snapshot')}
            className={`pb-1 border-b-2 transition-all cursor-pointer ${
              activeTab === 'snapshot'
                ? 'border-[#ff5722] text-[#ff5722] font-semibold'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Snapshot
          </button>
          <button
            onClick={() => navigate('/admin/follow-ups')}
            className="pb-1 border-b-2 border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all cursor-pointer"
          >
            Follow-ups
          </button>
          <button
            onClick={() => navigate('/admin/staff-targets')}
            className="pb-1 border-b-2 border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all cursor-pointer"
          >
            Leaderboards
          </button>
        </div>
      </div>

      {/* Disabled Feature Alerts for Admin */}
      {user?.gymFeatures && Object.values(user.gymFeatures).some((val) => val === false) && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 rounded-r-lg shadow-sm flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400">Gym Features Partially Disabled</h4>
            <p className="text-xs text-amber-700 dark:text-amber-500 mt-0.5">
              Some system features are restricted by your subscription tier. Contact support to unlock full functionality.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Left 2/3 and Right 1/3 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* LEFT COLUMN (lg:col-span-8) */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-8 space-y-4">
          {/* Date Filter Bar matching Image 1 */}
          <div className="flex items-center space-x-3">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
              className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#ff5722] min-w-[140px] cursor-pointer shadow-sm"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_year">This Year</option>
              <option value="all">All Time</option>
            </select>
            <button
              onClick={() => setSelectedFilter(dateFilter)}
              className="bg-[#ff5722] hover:bg-orange-600 text-white font-semibold text-sm px-5 py-1.5 rounded transition-colors shadow-sm cursor-pointer"
            >
              Go
            </button>
          </div>

          {/* 6 Metric KPI Cards (Grid 3x2) matching Image 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 1: SALES */}
            <div className="bg-[#fff5f5] dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-lg p-4 flex flex-col justify-between items-center text-center shadow-sm min-h-[125px]">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                SALES
              </span>
              <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white my-1">
                ₹ {kpiData.sales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <button
                onClick={() => navigate('/admin/reports')}
                className="text-[11px] font-bold text-[#ff5722] hover:underline uppercase tracking-wide cursor-pointer"
              >
                VIEW MORE
              </button>
            </div>

            {/* Card 2: PAYMENTS COLLECTED */}
            <div className="bg-[#fffdf0] dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-lg p-4 flex flex-col justify-between items-center text-center shadow-sm min-h-[125px]">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                PAYMENTS COLLECTED
              </span>
              <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white my-1">
                ₹ {kpiData.paymentsCollected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <button
                onClick={() => navigate('/admin/clients')}
                className="text-[11px] font-bold text-[#ff5722] hover:underline uppercase tracking-wide cursor-pointer"
              >
                VIEW MORE
              </button>
            </div>

            {/* Card 3: PAYMENTS PENDING */}
            <div className="bg-[#faf5ff] dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 rounded-lg p-4 flex flex-col justify-between items-center text-center shadow-sm min-h-[125px]">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                PAYMENTS PENDING
              </span>
              <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white my-1">
                ₹ {kpiData.paymentsPending.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <button
                onClick={() => navigate('/admin/clients')}
                className="text-[11px] font-bold text-[#ff5722] hover:underline uppercase tracking-wide cursor-pointer"
              >
                VIEW MORE
              </button>
            </div>

            {/* Card 4: NEW CLIENT(S) */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col justify-between items-center text-center shadow-sm min-h-[125px]">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                NEW CLIENT(S)
              </span>
              <div className="text-2xl font-bold text-sky-500 my-1">
                {kpiData.newClientsCount}
              </div>
              <button
                onClick={() => navigate('/admin/clients')}
                className="text-[11px] font-bold text-[#ff5722] hover:underline uppercase tracking-wide cursor-pointer"
              >
                VIEW MORE
              </button>
            </div>

            {/* Card 5: RENEWALS */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col justify-between items-center text-center shadow-sm min-h-[125px]">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                RENEWALS
              </span>
              <div className="text-2xl font-bold text-emerald-500 my-1">
                {kpiData.renewalsCount}
              </div>
              <button
                onClick={() => navigate('/admin/clients')}
                className="text-[11px] font-bold text-[#ff5722] hover:underline uppercase tracking-wide cursor-pointer"
              >
                VIEW MORE
              </button>
            </div>

            {/* Card 6: CHECK-INS */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col justify-between items-center text-center shadow-sm min-h-[125px]">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                CHECK-INS
              </span>
              <div className="text-2xl font-bold text-rose-500 my-1">
                {kpiData.checkInsCount}
              </div>
              <button
                onClick={() => navigate('/admin/attendance')}
                className="text-[11px] font-bold text-[#ff5722] hover:underline uppercase tracking-wide cursor-pointer"
              >
                VIEW MORE
              </button>
            </div>
          </div>

          {/* Bookings / Reservations / Cancellations Table matching Image 2 & 3 */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  <th className="py-2 text-left w-24"></th>
                  <th className="py-2 px-2">BOOKINGS</th>
                  <th className="py-2 px-2">RESERVATIONS</th>
                  <th className="py-2 px-2">CANCELLATIONS</th>
                  <th className="py-2 px-2 w-16"></th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                {/* Row 1: Classes */}
                <tr>
                  <td className="py-2 text-left text-sm font-medium text-gray-800 dark:text-gray-200">
                    Classes
                  </td>
                  <td className="py-2 px-2">
                    <div className="border border-gray-300 dark:border-gray-600 rounded py-1 px-4 text-sm font-semibold text-gray-800 dark:text-gray-200 max-w-[90px] mx-auto">
                      {bookingsData.classes.bookings}
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <div className="border border-gray-300 dark:border-gray-600 rounded py-1 px-4 text-sm font-semibold text-gray-800 dark:text-gray-200 max-w-[90px] mx-auto">
                      {bookingsData.classes.reservations}
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <div className="border border-gray-300 dark:border-gray-600 rounded py-1 px-4 text-sm font-semibold text-gray-800 dark:text-gray-200 max-w-[90px] mx-auto">
                      {bookingsData.classes.cancellations}
                    </div>
                  </td>
                  <td className="py-2 px-2 text-right">
                    <button
                      onClick={() => navigate('/admin/classes')}
                      className="text-xs font-semibold text-[#ff5722] hover:underline cursor-pointer"
                    >
                      View
                    </button>
                  </td>
                </tr>

                {/* Row 2: Sessions */}
                <tr>
                  <td className="py-2 text-left text-sm font-medium text-gray-800 dark:text-gray-200">
                    Sessions
                  </td>
                  <td className="py-2 px-2">
                    <div className="border border-gray-300 dark:border-gray-600 rounded py-1 px-4 text-sm font-semibold text-gray-800 dark:text-gray-200 max-w-[90px] mx-auto">
                      {bookingsData.sessions.bookings}
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <div className="border border-gray-300 dark:border-gray-600 rounded py-1 px-4 text-sm font-semibold text-gray-800 dark:text-gray-200 max-w-[90px] mx-auto">
                      {bookingsData.sessions.reservations}
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <div className="border border-gray-300 dark:border-gray-600 rounded py-1 px-4 text-sm font-semibold text-gray-800 dark:text-gray-200 max-w-[90px] mx-auto">
                      {bookingsData.sessions.cancellations}
                    </div>
                  </td>
                  <td className="py-2 px-2 text-right">
                    <button
                      onClick={() => navigate('/admin/schedule')}
                      className="text-xs font-semibold text-[#ff5722] hover:underline cursor-pointer"
                    >
                      View
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Enquiries & Total Clients Grid matching Image 2 & 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card Left: ENQUIRIES - X */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm text-center">
              <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                ENQUIRIES - {enquiriesBreakdown.total}
              </h4>
              <div className="grid grid-cols-3 gap-2 border-b border-gray-100 dark:border-gray-700 pb-3 mb-3">
                <div>
                  <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">OPEN</div>
                  <button
                    onClick={() => navigate('/admin/enquiries?status=new')}
                    className="text-lg font-bold text-[#ff5722] hover:underline cursor-pointer"
                  >
                    {enquiriesBreakdown.open}
                  </button>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">CONVERTED</div>
                  <button
                    onClick={() => navigate('/admin/enquiries?status=converted')}
                    className="text-lg font-bold text-[#ff5722] hover:underline cursor-pointer"
                  >
                    {enquiriesBreakdown.converted}
                  </button>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">LOST</div>
                  <button
                    onClick={() => navigate('/admin/enquiries?status=lost')}
                    className="text-lg font-bold text-[#ff5722] hover:underline cursor-pointer"
                  >
                    {enquiriesBreakdown.lost}
                  </button>
                </div>
              </div>

              {/* Sub-section: TRIALS */}
              <h5 className="text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                TRIALS
              </h5>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1">SCHEDULED</div>
                  <button
                    onClick={() => navigate('/admin/enquiries?stage=Trial+Scheduled')}
                    className="text-base font-bold text-[#ff5722] hover:underline cursor-pointer"
                  >
                    {enquiriesBreakdown.scheduledTrials}
                  </button>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1">COMPLETED</div>
                  <button
                    onClick={() => navigate('/admin/enquiries?stage=Post+Trial')}
                    className="text-base font-bold text-[#ff5722] hover:underline cursor-pointer"
                  >
                    {enquiriesBreakdown.completedTrials}
                  </button>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1">NOT-ATTENDED</div>
                  <button
                    onClick={() => navigate('/admin/enquiries')}
                    className="text-base font-bold text-[#ff5722] hover:underline cursor-pointer"
                  >
                    {enquiriesBreakdown.notAttendedTrials}
                  </button>
                </div>
              </div>
            </div>

            {/* Card Right: TOTAL CLIENTS */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  TOTAL CLIENTS
                </span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  {clientsBreakdown.total}
                </span>
              </div>

              <div className="my-4 space-y-2">
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    ACTIVE: {clientsBreakdown.active}
                  </span>
                  <span className="text-rose-500 dark:text-rose-400">
                    INACTIVE: {clientsBreakdown.inactive}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs font-bold text-[#ff5722] pt-2 border-t border-gray-100 dark:border-gray-700">
                <button onClick={() => navigate('/admin/clients?status=active')} className="hover:underline cursor-pointer">
                  VIEW
                </button>
                <button onClick={() => navigate('/admin/clients?status=inactive')} className="hover:underline cursor-pointer">
                  VIEW
                </button>
              </div>
            </div>
          </div>

          {/* Member Support Requests & Feedback Grid matching Image 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card Left: MEMBER SUPPORT REQUESTS */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm text-center">
              <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                MEMBER SUPPORT REQUESTS
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">RAISED</div>
                  <div className="text-lg font-bold text-[#ff5722]">{supportAndFeedback.support.raised}</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">CLOSED</div>
                  <div className="text-lg font-bold text-[#ff5722]">{supportAndFeedback.support.closed}</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">OPEN</div>
                  <div className="text-lg font-bold text-[#ff5722]">{supportAndFeedback.support.open}</div>
                </div>
              </div>
            </div>

            {/* Card Right: FEEDBACK */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm text-center">
              <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                FEEDBACK
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">RECEIVED</div>
                  <div className="text-lg font-bold text-[#ff5722]">{supportAndFeedback.feedback.received}</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">NEGATIVE</div>
                  <div className="text-lg font-bold text-[#ff5722]">{supportAndFeedback.feedback.negative}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* RIGHT COLUMN (lg:col-span-4) */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-4 space-y-4">
          {/* Action Button 1: Partners & Integrations matching Image 1 */}
          <button
            onClick={() => setIsPartnersModalOpen(true)}
            className="w-full bg-[#ff5722] hover:bg-orange-600 text-white font-bold text-sm py-2.5 px-4 rounded shadow-sm transition-colors text-center cursor-pointer"
          >
            Partners & Integrations
          </button>

          {/* Action Button 2: Notes + matching Image 1 */}
          <button
            onClick={() => setIsNotesModalOpen(true)}
            className="w-full bg-[#ff5722] hover:bg-orange-600 text-white font-bold text-sm py-2.5 px-4 rounded shadow-sm transition-colors flex items-center justify-between px-6 cursor-pointer"
          >
            <span>Notes</span>
            <span className="text-lg font-bold leading-none">+</span>
          </button>

          {/* Summary Card with Date Navigator matching Image 1 */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2 mb-2">
              <h3 className="font-bold text-gray-900 dark:text-white text-base">Summary</h3>
              <button
                onClick={loadAllDashboardData}
                title="Refresh Summary"
                className="text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Date Navigator Header < Today > */}
            <div className="flex items-center justify-center space-x-3 py-1 text-sm font-bold text-[#ff5722]">
              <button
                onClick={() => setSummaryDateOffset((prev) => prev - 1)}
                className="hover:bg-orange-50 dark:hover:bg-orange-950/40 p-1 rounded cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="min-w-[70px] text-center">{summaryDateLabel}</span>
              <button
                onClick={() => setSummaryDateOffset((prev) => prev + 1)}
                className="hover:bg-orange-50 dark:hover:bg-orange-950/40 p-1 rounded cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Metrics List */}
            <div className="divide-y divide-gray-100 dark:divide-gray-700/60 text-xs">
              <div className="flex justify-between py-2 text-gray-700 dark:text-gray-300">
                <span>Follow-ups</span>
                <span className="font-semibold text-gray-900 dark:text-white">{summaryStats.followUpsText}</span>
              </div>
              <div className="flex justify-between py-2 text-gray-700 dark:text-gray-300">
                <span>Appointments</span>
                <span className="font-semibold text-gray-900 dark:text-white">{summaryStats.appointmentsText}</span>
              </div>
              <div className="flex justify-between py-2 text-gray-700 dark:text-gray-300">
                <span>Classes</span>
                <span className="font-semibold text-gray-900 dark:text-white">{summaryStats.classesText}</span>
              </div>
              <div className="flex justify-between py-2 text-gray-700 dark:text-gray-300">
                <span>Service expiry</span>
                <span className="font-semibold text-gray-900 dark:text-white">{summaryStats.serviceExpiry}</span>
              </div>
              <div className="flex justify-between py-2 text-gray-700 dark:text-gray-300">
                <span>PT expiry</span>
                <span className="font-semibold text-gray-900 dark:text-white">{summaryStats.ptExpiry}</span>
              </div>
              <div className="flex justify-between py-2 text-gray-700 dark:text-gray-300">
                <span>Upgrades</span>
                <span className="font-semibold text-gray-900 dark:text-white">{summaryStats.upgrades}</span>
              </div>
              <div className="flex justify-between py-2 text-gray-700 dark:text-gray-300">
                <span>Client birthdays</span>
                <span className="font-semibold text-gray-900 dark:text-white">{summaryStats.clientBirthdays}</span>
              </div>
              <div className="flex justify-between py-2 text-gray-700 dark:text-gray-300">
                <span>Client Anniversaries</span>
                <span className="font-semibold text-gray-900 dark:text-white">{summaryStats.clientAnniversaries}</span>
              </div>
              <div className="flex justify-between py-2 text-gray-700 dark:text-gray-300">
                <span>Staff birthdays</span>
                <span className="font-semibold text-gray-900 dark:text-white">{summaryStats.staffBirthdays}</span>
              </div>
              <div className="flex justify-between py-2 text-gray-700 dark:text-gray-300">
                <span>Staff Anniversaries</span>
                <span className="font-semibold text-gray-900 dark:text-white">{summaryStats.staffAnniversaries}</span>
              </div>
            </div>
          </div>

          {/* Payment Collected Card matching Image 2 & 3 */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
            <h4 className="font-bold text-gray-900 dark:text-white text-sm text-center mb-3">
              Payment Collected
            </h4>
            <div className="border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 px-3 text-center w-12 font-semibold">S.No</th>
                    <th className="py-2 px-3 text-center font-semibold">Pay Mode</th>
                    <th className="py-2 px-3 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {kpiData.paymentModeRows.length > 0 ? (
                    kpiData.paymentModeRows.map((row) => (
                      <tr key={row.sNo}>
                        <td className="py-2 px-3 text-center text-gray-600 dark:text-gray-400">{row.sNo}</td>
                        <td className="py-2 px-3 text-center font-medium text-gray-800 dark:text-gray-200">{row.payMode}</td>
                        <td className="py-2 px-3 text-right font-semibold text-gray-900 dark:text-white">{row.amount}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-2 px-3 text-center text-gray-600 dark:text-gray-400">1</td>
                      <td className="py-2 px-3 text-center font-medium text-gray-800 dark:text-gray-200">Google Pay</td>
                      <td className="py-2 px-3 text-right font-semibold text-gray-900 dark:text-white">
                        {kpiData.paymentsCollected.toFixed(2)}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 dark:bg-gray-900 font-bold border-t border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                    <td colSpan={2} className="py-2 px-3 text-center">Total</td>
                    <td className="py-2 px-3 text-right">{kpiData.paymentsCollected.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* ADVANCE PAYMENT Card matching Image 3 */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm text-center">
            <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
              ADVANCE PAYMENT
            </h4>
            <div className="flex justify-around items-center text-xs font-semibold text-gray-600 dark:text-gray-400">
              <div>
                COLLECTED: <span className="text-[#ff5722] font-bold">0</span>
              </div>
              <div>
                UTILISED: <span className="text-[#ff5722] font-bold">0</span>
              </div>
            </div>
          </div>

          {/* Expenses Card matching Image 3 */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm text-center">
            <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
              Expenses
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 py-2">
              No result found
            </p>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: Quick Notes Modal */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {isNotesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <FileText size={18} className="text-[#ff5722]" /> Quick Notes
              </h3>
              <button
                onClick={() => setIsNotesModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Write a quick admin note or reminder here..."
                rows={3}
                className="w-full text-sm p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#ff5722]"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-[#ff5722] hover:bg-orange-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Save Note
                </button>
              </div>
            </form>

            <div className="space-y-2 max-h-60 overflow-y-auto pt-2 divide-y divide-gray-100 dark:divide-gray-700">
              {quickNotes.length === 0 ? (
                <p className="text-center text-xs text-gray-500 py-4">No notes saved yet.</p>
              ) : (
                quickNotes.map((note) => (
                  <div key={note.id} className="pt-2 flex items-start justify-between gap-3 text-xs">
                    <div>
                      <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{note.text}</p>
                      <span className="text-[10px] text-gray-400">
                        {new Date(note.createdAt).toLocaleDateString()} {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {note.author}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-red-400 hover:text-red-600 font-bold p-1 cursor-pointer"
                      title="Delete note"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: Partners & Integrations Modal */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {isPartnersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <Zap size={18} className="text-[#ff5722]" /> Partners & Integrations
              </h3>
              <button
                onClick={() => setIsPartnersModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="text-sky-500" size={20} />
                  <div>
                    <h5 className="font-semibold text-gray-900 dark:text-white">SMS & WhatsApp Gateway</h5>
                    <p className="text-xs text-gray-500">Automate booking & renewal alerts</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Active
                </span>
              </div>

              <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="text-emerald-500" size={20} />
                  <div>
                    <h5 className="font-semibold text-gray-900 dark:text-white">Biometric Attendance Sync</h5>
                    <p className="text-xs text-gray-500">ZKTeco & eSSL hardware integration</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsPartnersModalOpen(false);
                    navigate('/admin/biometric');
                  }}
                  className="text-xs text-[#ff5722] font-semibold hover:underline cursor-pointer"
                >
                  Configure
                </button>
              </div>

              <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="text-purple-500" size={20} />
                  <div>
                    <h5 className="font-semibold text-gray-900 dark:text-white">Online Payment Gateway</h5>
                    <p className="text-xs text-gray-500">Razorpay / Stripe UPI & Invoicing</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsPartnersModalOpen(false);
                    navigate('/admin/setup');
                  }}
                  className="text-xs text-[#ff5722] font-semibold hover:underline cursor-pointer"
                >
                  Configure
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsPartnersModalOpen(false)}
                className="bg-[#ff5722] hover:bg-orange-600 text-white text-xs font-semibold px-5 py-2 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;