import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useClient } from '../../hooks/useClient';
import { useEnquiry } from '../../hooks/useEnquiry';
import { useToast } from '../../contexts/ToastContext';

interface DSRRow {
  date: string;
  day: string;
  leadAnalysis: {
    existingLeads: number;
    addedToday: number;
    referralGenerated: number;
    leadConverted: { count: number; value: number };
    spotConversion: { count: number; value: number };
    totalClosures: { count: number; value: number };
  };
  trialAnalysis: {
    trialScheduled: number;
    trialCompleted: number;
  };
  todaysSale: { value: number };
  newClients: {
    servicesNonPt: { count: number; revenue: number };
    pt: { count: number; revenue: number };
  };
  existingClients: {
    servicesNonPt: { count: number; revenue: number };
    pt: { count: number; revenue: number };
  };
  incrementalRevenue: {
    store: { count: number; revenue: number };
    others: { count: number; revenue: number };
  };
  todaysCollection: { value: number };
  collection: {
    newSales: { revenue: number };
    dueRecovered: { revenue: number };
  };
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const DSRReportPage: React.FC = () => {
  const { clients } = useClient();
  const { enquiries } = useEnquiry();
  const { showToast } = useToast();

  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1); // 1-12
  const [loading, setLoading] = useState<boolean>(false);
  const [rows, setRows] = useState<DSRRow[]>([]);

  // List of selectable years in incrementing order
  const availableYears = useMemo(() => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 4; y <= currentYear + 2; y++) {
      years.push(y);
    }
    return years;
  }, []);

  // Fetch DSR report from API with fallback to client-side computation from valid database records
  const fetchDSRData = async () => {
    setLoading(true);
    const baseApi = (import.meta.env.VITE_API_URL || 'http://localhost:8000')
      .replace(/\/$/, '')
      .replace(/\/api\/v1$/, '');
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      // Attempt backend API first
      const res = await axios.get(`${baseApi}/api/v1/reports/dsr`, {
        params: { year: selectedYear, month: selectedMonth },
        headers,
        withCredentials: true,
      });

      if (res.data && res.data.success && res.data.data?.rows) {
        setRows(res.data.data.rows);
        setLoading(false);
        return;
      }
    } catch {
      // Backend route might have failed or not loaded yet, fallback to client-side calculation with valid records
    }

    // Client-side computation from real loaded clients & enquiries
    computeFromValidData();
    setLoading(false);
  };

  const computeFromValidData = () => {
    const year = selectedYear;
    const month = selectedMonth;

    // Flatten all invoice transactions across loaded clients
    const allInvoices: any[] = [];
    for (const c of clients || []) {
      const cCreatedAt = new Date(c.createdAt || c.startDate);
      const invoicesList = (c as any).invoices;
      if (invoicesList && Array.isArray(invoicesList) && invoicesList.length > 0) {
        invoicesList.forEach((inv: any, idx: number) => {
          allInvoices.push({
            clientId: c._id,
            clientName: c.fullName,
            clientPhone: c.contactNumber,
            clientCreatedAt: cCreatedAt,
            isFirstInvoice: idx === 0 && invoicesList.length === 1,
            ...inv
          });
        });
      } else if (c.invoice) {
        allInvoices.push({
          clientId: c._id,
          clientName: c.fullName,
          clientPhone: c.contactNumber,
          clientCreatedAt: cCreatedAt,
          isFirstInvoice: true,
          ...c.invoice
        });
      } else if (c.packagePrice) {
        allInvoices.push({
          clientId: c._id,
          clientName: c.fullName,
          clientPhone: c.contactNumber,
          clientCreatedAt: cCreatedAt,
          isFirstInvoice: true,
          invoiceDate: c.startDate || c.createdAt,
          date: c.startDate || c.createdAt,
          amount: Number(c.packagePrice) || 0,
          paid: Number(c.packagePrice) || 0,
          pending: 0,
          hasPersonalTraining: c.hasPersonalTraining,
          personalTrainingPrice: Number(c.personalTrainingPrice) || 0,
          items: [
            {
              serviceName: c.plan === 'premium' ? 'Premium Membership' : 'Gym Workout',
              fee: Number(c.packagePrice) || 0
            }
          ]
        });
      }
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === year && (now.getMonth() + 1) === month;
    const maxDay = isCurrentMonth ? Math.min(now.getDate(), daysInMonth) : daysInMonth;

    const generatedRows: DSRRow[] = [];

    for (let day = 1; day <= maxDay; day++) {
      const dayDate = new Date(year, month - 1, day);
      const dayStr = `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
      const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'long' });

      // Existing leads: enquiries created prior to this day and not lost/converted
      const existingLeads = (enquiries || []).filter(e => {
        const eDate = new Date(e.createdAt || (e as any).enquiryDate || 0);
        return eDate < dayDate && e.status !== 'lost' && e.status !== 'converted';
      }).length;

      // Added today: enquiries on this day
      const addedTodayEnqs = (enquiries || []).filter(e => {
        const eDate = new Date(e.createdAt || (e as any).enquiryDate || 0);
        return eDate.getFullYear() === year && (eDate.getMonth() + 1) === month && eDate.getDate() === day;
      });
      const addedToday = addedTodayEnqs.length;

      // Referral generated
      const referralGenerated = addedTodayEnqs.filter(e =>
        e.source && /referral/i.test(e.source)
      ).length;

      // Invoices on this day
      const dayInvoices = allInvoices.filter(inv => {
        const raw = inv.invoiceDate || inv.date || inv.createdAt;
        if (!raw) return false;
        const iDate = new Date(raw);
        return iDate.getFullYear() === year && (iDate.getMonth() + 1) === month && iDate.getDate() === day;
      });

      let leadConvertedCount = 0;
      let leadConvertedValue = 0;
      let spotConversionCount = 0;
      let spotConversionValue = 0;

      let newClientsNonPtCount = 0;
      let newClientsNonPtRevenue = 0;
      let newClientsPtCount = 0;
      let newClientsPtRevenue = 0;

      let existingClientsNonPtCount = 0;
      let existingClientsNonPtRevenue = 0;
      let existingClientsPtCount = 0;
      let existingClientsPtRevenue = 0;

      let storeCount = 0;
      let storeRevenue = 0;
      let adminFeeCount = 0;
      let adminFeeRevenue = 0;

      let newSalesCollection = 0;
      let dueRecoveredCollection = 0;

      for (const inv of dayInvoices) {
        const totalAmount = Number(inv.amount ?? inv.totalDue ?? inv.net ?? 0) || 0;
        const paidAmount = Number(inv.paid ?? inv.totalPaid ?? totalAmount) || 0;
        const pendingAmount = Number(inv.pending ?? inv.pendingAmount ?? 0) || 0;

        const isPt = inv.hasPersonalTraining ||
          (inv.items && inv.items.some((it: any) => /pt|personal train/i.test(it.serviceName || '')));

        const isExisting = inv.isRenewal || inv.isUpgrade || !inv.isFirstInvoice;
        const isStore = inv.items && inv.items.some((it: any) => /store|cafe|supplement|merchandise/i.test(it.serviceName || ''));
        const isAdminFee = inv.items && inv.items.some((it: any) => /admin|registration|card|locker/i.test(it.serviceName || ''));

        if (isStore) {
          storeCount++;
          storeRevenue += totalAmount;
        } else if (isAdminFee) {
          adminFeeCount++;
          adminFeeRevenue += totalAmount;
        } else if (isExisting) {
          if (isPt) {
            existingClientsPtCount++;
            existingClientsPtRevenue += totalAmount;
          } else {
            existingClientsNonPtCount++;
            existingClientsNonPtRevenue += totalAmount;
          }
        } else {
          if (isPt) {
            newClientsPtCount++;
            newClientsPtRevenue += totalAmount;
          } else {
            newClientsNonPtCount++;
            newClientsNonPtRevenue += totalAmount;
          }

          const matchingEnq = (enquiries || []).find(e => e.phone && inv.clientPhone && e.phone === inv.clientPhone);
          if (matchingEnq) {
            const enqD = new Date(matchingEnq.createdAt || (matchingEnq as any).enquiryDate || 0);
            if (enqD.getFullYear() === year && (enqD.getMonth() + 1) === month && enqD.getDate() === day) {
              spotConversionCount++;
              spotConversionValue += totalAmount;
            } else {
              leadConvertedCount++;
              leadConvertedValue += totalAmount;
            }
          } else {
            spotConversionCount++;
            spotConversionValue += totalAmount;
          }
        }

        newSalesCollection += paidAmount;
        if (pendingAmount > 0 && inv.pendingRecovered) {
          dueRecoveredCollection += Number(inv.pendingRecovered);
        }
      }

      const totalClosuresCount = leadConvertedCount + spotConversionCount;
      const totalClosuresValue = leadConvertedValue + spotConversionValue;

      const todaysSale = newClientsNonPtRevenue + newClientsPtRevenue +
        existingClientsNonPtRevenue + existingClientsPtRevenue +
        storeRevenue + adminFeeRevenue;

      const todaysCollection = newSalesCollection + dueRecoveredCollection;

      const trialScheduled = (enquiries || []).filter(e => {
        if (!e.trialType || e.trialType === 'no-trial') return false;
        const tDate = e.trialDateTime || (e as any).trialClassDate || (e as any).trialSessionDate;
        if (!tDate) return false;
        const td = new Date(tDate);
        return td.getFullYear() === year && (td.getMonth() + 1) === month && td.getDate() === day;
      }).length;

      const trialCompleted = 0;

      generatedRows.push({
        date: dayStr,
        day: dayName,
        leadAnalysis: {
          existingLeads,
          addedToday,
          referralGenerated,
          leadConverted: { count: leadConvertedCount, value: leadConvertedValue },
          spotConversion: { count: spotConversionCount, value: spotConversionValue },
          totalClosures: { count: totalClosuresCount, value: totalClosuresValue },
        },
        trialAnalysis: {
          trialScheduled,
          trialCompleted,
        },
        todaysSale: { value: todaysSale },
        newClients: {
          servicesNonPt: { count: newClientsNonPtCount, revenue: newClientsNonPtRevenue },
          pt: { count: newClientsPtCount, revenue: newClientsPtRevenue },
        },
        existingClients: {
          servicesNonPt: { count: existingClientsNonPtCount, revenue: existingClientsNonPtRevenue },
          pt: { count: existingClientsPtCount, revenue: existingClientsPtRevenue },
        },
        incrementalRevenue: {
          store: { count: storeCount, revenue: storeRevenue },
          others: { count: adminFeeCount, revenue: adminFeeRevenue },
        },
        todaysCollection: { value: todaysCollection },
        collection: {
          newSales: { revenue: newSalesCollection },
          dueRecovered: { revenue: dueRecoveredCollection },
        }
      });
    }

    setRows(generatedRows);
  };

  useEffect(() => {
    fetchDSRData();
  }, [selectedYear, selectedMonth]);

  // Compute column totals from current valid rows
  const totals = useMemo(() => {
    const t = {
      addedToday: 0,
      referralGenerated: 0,
      leadConverted: { count: 0, value: 0 },
      spotConversion: { count: 0, value: 0 },
      totalClosures: { count: 0, value: 0 },
      trialScheduled: 0,
      trialCompleted: 0,
      todaysSale: 0,
      newClients: {
        servicesNonPt: { count: 0, revenue: 0 },
        pt: { count: 0, revenue: 0 },
      },
      existingClients: {
        servicesNonPt: { count: 0, revenue: 0 },
        pt: { count: 0, revenue: 0 },
      },
      incrementalRevenue: {
        store: { count: 0, revenue: 0 },
        others: { count: 0, revenue: 0 },
      },
      todaysCollection: 0,
      collection: {
        newSales: 0,
        dueRecovered: 0,
      }
    };

    for (const r of rows) {
      t.addedToday += r.leadAnalysis.addedToday;
      t.referralGenerated += r.leadAnalysis.referralGenerated;
      t.leadConverted.count += r.leadAnalysis.leadConverted.count;
      t.leadConverted.value += r.leadAnalysis.leadConverted.value;
      t.spotConversion.count += r.leadAnalysis.spotConversion.count;
      t.spotConversion.value += r.leadAnalysis.spotConversion.value;
      t.totalClosures.count += r.leadAnalysis.totalClosures.count;
      t.totalClosures.value += r.leadAnalysis.totalClosures.value;
      t.trialScheduled += r.trialAnalysis.trialScheduled;
      t.trialCompleted += r.trialAnalysis.trialCompleted;
      t.todaysSale += r.todaysSale.value;
      t.newClients.servicesNonPt.count += r.newClients.servicesNonPt.count;
      t.newClients.servicesNonPt.revenue += r.newClients.servicesNonPt.revenue;
      t.newClients.pt.count += r.newClients.pt.count;
      t.newClients.pt.revenue += r.newClients.pt.revenue;
      t.existingClients.servicesNonPt.count += r.existingClients.servicesNonPt.count;
      t.existingClients.servicesNonPt.revenue += r.existingClients.servicesNonPt.revenue;
      t.existingClients.pt.count += r.existingClients.pt.count;
      t.existingClients.pt.revenue += r.existingClients.pt.revenue;
      t.incrementalRevenue.store.count += r.incrementalRevenue.store.count;
      t.incrementalRevenue.store.revenue += r.incrementalRevenue.store.revenue;
      t.incrementalRevenue.others.count += r.incrementalRevenue.others.count;
      t.incrementalRevenue.others.revenue += r.incrementalRevenue.others.revenue;
      t.todaysCollection += r.todaysCollection.value;
      t.collection.newSales += r.collection.newSales.revenue;
      t.collection.dueRecovered += r.collection.dueRecovered.revenue;
    }

    return t;
  }, [rows]);

  const formatAmount = (num: number) => {
    return num.toFixed(2);
  };

  // Export to Excel / CSV
  const handleExportExcel = () => {
    if (!rows.length) {
      showToast('No data to export', 'error');
      return;
    }

    const headers1 = [
      'Date', 'Day',
      'Lead Analysis', '', '', '', '', '', '', '', '',
      'Trial Analysis', '',
      "Today's SALE",
      'New Clients', '', '', '',
      'Existing Clients', '', '', '',
      'Incremental Revenue', '', '', '',
      "Today's COLLECTION",
      'Collection', ''
    ];

    const headers2 = [
      '', '',
      'Existing Leads', 'Added Today', 'Referral Generated',
      'Lead Converted', '', 'Spot Conversion', '', 'Total Closures', '',
      'Trial Scheduled', 'Trial Completed',
      'Value',
      'Services Non-PT', '', 'PT', '',
      'Services Non-PT', '', 'PT', '',
      'Store', '', 'Others (Admin Fee)', '',
      'Value',
      'New Sales', 'Due Recovered'
    ];

    const headers3 = [
      '', '',
      'Count', 'Count', 'Count',
      'Count', 'Value', 'Count', 'Value', 'Count', 'Value',
      'Count', 'Count',
      '',
      'Count', 'Revenue', 'Count', 'Revenue',
      'Count', 'Revenue', 'Count', 'Revenue',
      'Count', 'Revenue', 'Count', 'Revenue',
      '',
      'Revenue', 'Revenue'
    ];

    const csvRows = [
      headers1.join(','),
      headers2.join(','),
      headers3.join(',')
    ];

    rows.forEach(r => {
      const line = [
        r.date,
        r.day,
        r.leadAnalysis.existingLeads,
        r.leadAnalysis.addedToday,
        r.leadAnalysis.referralGenerated,
        r.leadAnalysis.leadConverted.count,
        formatAmount(r.leadAnalysis.leadConverted.value),
        r.leadAnalysis.spotConversion.count,
        formatAmount(r.leadAnalysis.spotConversion.value),
        r.leadAnalysis.totalClosures.count,
        formatAmount(r.leadAnalysis.totalClosures.value),
        r.trialAnalysis.trialScheduled,
        r.trialAnalysis.trialCompleted,
        formatAmount(r.todaysSale.value),
        r.newClients.servicesNonPt.count,
        formatAmount(r.newClients.servicesNonPt.revenue),
        r.newClients.pt.count,
        formatAmount(r.newClients.pt.revenue),
        r.existingClients.servicesNonPt.count,
        formatAmount(r.existingClients.servicesNonPt.revenue),
        r.existingClients.pt.count,
        formatAmount(r.existingClients.pt.revenue),
        r.incrementalRevenue.store.count,
        formatAmount(r.incrementalRevenue.store.revenue),
        r.incrementalRevenue.others.count,
        formatAmount(r.incrementalRevenue.others.revenue),
        formatAmount(r.todaysCollection.value),
        formatAmount(r.collection.newSales.revenue),
        formatAmount(r.collection.dueRecovered.revenue),
      ];
      csvRows.push(line.join(','));
    });

    // Total row
    const totalLine = [
      '',
      'Total',
      '',
      totals.addedToday,
      totals.referralGenerated,
      totals.leadConverted.count,
      formatAmount(totals.leadConverted.value),
      totals.spotConversion.count,
      formatAmount(totals.spotConversion.value),
      totals.totalClosures.count,
      formatAmount(totals.totalClosures.value),
      totals.trialScheduled,
      totals.trialCompleted,
      formatAmount(totals.todaysSale),
      totals.newClients.servicesNonPt.count,
      formatAmount(totals.newClients.servicesNonPt.revenue),
      totals.newClients.pt.count,
      formatAmount(totals.newClients.pt.revenue),
      totals.existingClients.servicesNonPt.count,
      formatAmount(totals.existingClients.servicesNonPt.revenue),
      totals.existingClients.pt.count,
      formatAmount(totals.existingClients.pt.revenue),
      totals.incrementalRevenue.store.count,
      formatAmount(totals.incrementalRevenue.store.revenue),
      totals.incrementalRevenue.others.count,
      formatAmount(totals.incrementalRevenue.others.revenue),
      formatAmount(totals.todaysCollection),
      formatAmount(totals.collection.newSales),
      formatAmount(totals.collection.dueRecovered),
    ];
    csvRows.push(totalLine.join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `DSR_Report_${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('DSR Report exported successfully', 'success');
  };

  return (
    <div className="min-h-full bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 flex flex-col font-sans">
      {/* Breadcrumb Navigation - matching image 2 & 3 */}
      <div className="px-6 pt-4 pb-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Link to="/admin/dashboard" className="hover:text-gray-900 dark:hover:text-gray-200">
          Home
        </Link>
        <span>/</span>
        <Link to="/admin/reports" className="hover:text-gray-900 dark:hover:text-gray-200">
          Reports
        </Link>
        <span>/</span>
        <span className="text-gray-600 dark:text-gray-400">Sales</span>
        <span>/</span>
        <span className="text-[#f05a28] font-medium">DSR Report</span>
      </div>

      {/* Page Title - Centered bold heading */}
      <div className="text-center py-2">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-wide">
          DSR Report
        </h1>
      </div>

      {/* Filter Toolbar: Year, Month, Go, Export Excel */}
      <div className="px-6 py-3 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <label htmlFor="year-select" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Year
          </label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#f05a28]"
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="month-select" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Month
          </label>
          <select
            id="month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
            className="border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#f05a28]"
          >
            {MONTH_NAMES.map((mName, idx) => (
              <option key={mName} value={idx + 1}>
                {mName}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={fetchDSRData}
          disabled={loading}
          className="bg-[#f05a28] hover:bg-[#d84e1f] text-white px-5 py-1 rounded text-sm font-medium transition-colors shadow-sm cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Go'}
        </button>

        <button
          type="button"
          onClick={handleExportExcel}
          className="bg-[#f05a28] hover:bg-[#d84e1f] text-white px-4 py-1 rounded text-sm font-medium transition-colors shadow-sm cursor-pointer"
        >
          Export Excel
        </button>
      </div>

      {/* Main Table Container with full horizontal scroll */}
      <div className="px-6 py-2 pb-12 flex-1">
        <div className="border border-gray-200 dark:border-gray-700 rounded overflow-x-auto shadow-sm bg-white dark:bg-gray-900">
          <table className="w-full text-xs text-gray-800 dark:text-gray-200 border-collapse whitespace-nowrap">
            {/* 3-Tier Multi-Level Header matching Image 2 & 3 */}
            <thead className="bg-[#f8f9fa] dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-center border-b border-gray-300 dark:border-gray-700">
              {/* Row 1 - High Level Groups */}
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th rowSpan={3} className="px-3 py-2 border-r border-gray-200 dark:border-gray-700 font-bold bg-[#f8f9fa] dark:bg-gray-800 sticky left-0 z-20">
                  Date
                </th>
                <th rowSpan={3} className="px-3 py-2 border-r border-gray-200 dark:border-gray-700 font-bold bg-[#f8f9fa] dark:bg-gray-800">
                  Day
                </th>
                <th colSpan={9} className="px-3 py-1.5 border-r border-gray-200 dark:border-gray-700 font-bold bg-[#f8f9fa] dark:bg-gray-800">
                  Lead Analysis
                </th>
                <th colSpan={2} className="px-3 py-1.5 border-r border-gray-200 dark:border-gray-700 font-bold bg-[#f8f9fa] dark:bg-gray-800">
                  Trial Analysis
                </th>
                <th colSpan={1} rowSpan={2} className="px-3 py-1.5 border-r border-gray-200 dark:border-gray-700 font-bold bg-[#f8f9fa] dark:bg-gray-800 align-middle">
                  Today's<br />SALE
                </th>
                <th colSpan={4} className="px-3 py-1.5 border-r border-gray-200 dark:border-gray-700 font-bold bg-[#f8f9fa] dark:bg-gray-800">
                  New Clients
                </th>
                <th colSpan={4} className="px-3 py-1.5 border-r border-gray-200 dark:border-gray-700 font-bold bg-[#f8f9fa] dark:bg-gray-800">
                  Existing Clients
                </th>
                <th colSpan={4} className="px-3 py-1.5 border-r border-gray-200 dark:border-gray-700 font-bold bg-[#f8f9fa] dark:bg-gray-800">
                  Incremental Revenue
                </th>
                <th colSpan={1} rowSpan={2} className="px-3 py-1.5 border-r border-gray-200 dark:border-gray-700 font-bold bg-[#f8f9fa] dark:bg-gray-800 align-middle">
                  Today's<br />COLLECTION
                </th>
                <th colSpan={2} className="px-3 py-1.5 border-r border-gray-200 dark:border-gray-700 font-bold bg-[#f8f9fa] dark:bg-gray-800">
                  Collection
                </th>
              </tr>

              {/* Row 2 - Sub Categories */}
              <tr className="border-b border-gray-200 dark:border-gray-700 text-[11px]">
                <th className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Existing Leads</th>
                <th className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Added Today</th>
                <th className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Referral Generated</th>
                <th colSpan={2} className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Lead Converted</th>
                <th colSpan={2} className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Spot Conversion</th>
                <th colSpan={2} className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Total Closures</th>
                <th className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Trial Scheduled</th>
                <th className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Trial Completed</th>
                {/* Today's Sale is spanned from above */}
                <th colSpan={2} className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Services Non-PT</th>
                <th colSpan={2} className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">PT</th>
                <th colSpan={2} className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Services Non-PT</th>
                <th colSpan={2} className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">PT</th>
                <th colSpan={2} className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Store</th>
                <th colSpan={2} className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Others (Admin Fee)</th>
                {/* Today's Collection is spanned from above */}
                <th className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">New Sales</th>
                <th className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Due Recovered</th>
              </tr>

              {/* Row 3 - Metric Units: Count / Value / Revenue */}
              <tr className="border-b border-gray-300 dark:border-gray-600 text-[11px] text-gray-600 dark:text-gray-400">
                <th className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Count</th>
                <th className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Count</th>
                <th className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Count</th>
                <th className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Count</th>
                <th className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Value</th>
                <th className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Count</th>
                <th className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Value</th>
                <th className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Count</th>
                <th className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Value</th>
                <th className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Count</th>
                <th className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Count</th>
                {/* Today's Sale unit */}
                <th className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Value</th>
                {/* New Clients */}
                <th className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Count</th>
                <th className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Revenue</th>
                <th className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Count</th>
                <th className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Revenue</th>
                {/* Existing Clients */}
                <th className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Count</th>
                <th className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Revenue</th>
                <th className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Count</th>
                <th className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Revenue</th>
                {/* Incremental */}
                <th className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Count</th>
                <th className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Revenue</th>
                <th className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Count</th>
                <th className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Revenue</th>
                {/* Today's Collection unit */}
                <th className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Value</th>
                {/* Collection sub-columns */}
                <th className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Revenue</th>
                <th className="px-2 py-1 border-r border-gray-200 dark:border-gray-700">Revenue</th>
              </tr>
            </thead>

            {/* Table Body - Valid Data rows */}
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={29} className="text-center py-6 text-gray-500">
                    {loading ? 'Loading valid DSR report data...' : 'No data found for the selected period.'}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.date}
                    className="hover:bg-orange-50/40 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    {/* Date */}
                    <td className="px-2.5 py-1.5 text-center font-medium border-r border-gray-200 dark:border-gray-700 sticky left-0 bg-white dark:bg-gray-900">
                      {row.date}
                    </td>
                    {/* Day */}
                    <td className="px-2.5 py-1.5 text-left border-r border-gray-200 dark:border-gray-700">
                      {row.day}
                    </td>

                    {/* Lead Analysis */}
                    <td className="px-2 py-1.5 text-right border-r border-gray-200 dark:border-gray-700">
                      {row.leadAnalysis.existingLeads}
                    </td>
                    <td className="px-2 py-1.5 text-right border-r border-gray-200 dark:border-gray-700">
                      {row.leadAnalysis.addedToday}
                    </td>
                    <td className="px-2 py-1.5 text-right border-r border-gray-200 dark:border-gray-700">
                      {row.leadAnalysis.referralGenerated}
                    </td>
                    <td className="px-2 py-1.5 text-right border-r border-gray-200 dark:border-gray-700">
                      {row.leadAnalysis.leadConverted.count}
                    </td>
                    <td className="px-2 py-1.5 text-right border-r border-gray-200 dark:border-gray-700">
                      {formatAmount(row.leadAnalysis.leadConverted.value)}
                    </td>
                    <td className="px-2 py-1.5 text-right border-r border-gray-200 dark:border-gray-700">
                      {row.leadAnalysis.spotConversion.count}
                    </td>
                    <td className="px-2 py-1.5 text-right border-r border-gray-200 dark:border-gray-700">
                      {formatAmount(row.leadAnalysis.spotConversion.value)}
                    </td>
                    <td className="px-2 py-1.5 text-right border-r border-gray-200 dark:border-gray-700">
                      {row.leadAnalysis.totalClosures.count}
                    </td>
                    <td className="px-2 py-1.5 text-right border-r border-gray-200 dark:border-gray-700">
                      {formatAmount(row.leadAnalysis.totalClosures.value)}
                    </td>

                    {/* Trial Analysis */}
                    <td className="px-2 py-1.5 text-right border-r border-gray-200 dark:border-gray-700">
                      {row.trialAnalysis.trialScheduled}
                    </td>
                    <td className="px-2 py-1.5 text-right border-r border-gray-200 dark:border-gray-700">
                      {row.trialAnalysis.trialCompleted}
                    </td>

                    {/* Today's SALE */}
                    <td className="px-2 py-1.5 text-right font-medium border-r border-gray-200 dark:border-gray-700">
                      {formatAmount(row.todaysSale.value)}
                    </td>

                    {/* New Clients */}
                    <td className="px-2 py-1.5 text-right border-r border-gray-200 dark:border-gray-700">
                      {row.newClients.servicesNonPt.count}
                    </td>
                    <td className="px-2 py-1.5 text-right border-r border-gray-200 dark:border-gray-700">
                      {formatAmount(row.newClients.servicesNonPt.revenue)}
                    </td>
                    <td className="px-2 py-1.5 text-right border-r border-gray-200 dark:border-gray-700">
                      {row.newClients.pt.count}
                    </td>
                    <td className="px-2 py-1.5 text-right border-r border-gray-200 dark:border-gray-700">
                      {formatAmount(row.newClients.pt.revenue)}
                    </td>

                    {/* Existing Clients */}
                    <td className="px-2 py-1.5 text-right border-r border-gray-200 dark:border-gray-700">
                      {row.existingClients.servicesNonPt.count}
                    </td>
                    <td className="px-2 py-1.5 text-right border-r border-gray-200 dark:border-gray-700">
                      {formatAmount(row.existingClients.servicesNonPt.revenue)}
                    </td>
                    <td className="px-2 py-1.5 text-right border-r border-gray-200 dark:border-gray-700">
                      {row.existingClients.pt.count}
                    </td>
                    <td className="px-2 py-1.5 text-right border-r border-gray-200 dark:border-gray-700">
                      {formatAmount(row.existingClients.pt.revenue)}
                    </td>

                    {/* Incremental Revenue */}
                    <td className="px-2 py-1.5 text-right border-r border-gray-200 dark:border-gray-700">
                      {row.incrementalRevenue.store.count}
                    </td>
                    <td className="px-2 py-1.5 text-right border-r border-gray-200 dark:border-gray-700">
                      {formatAmount(row.incrementalRevenue.store.revenue)}
                    </td>
                    <td className="px-2 py-1.5 text-right border-r border-gray-200 dark:border-gray-700">
                      {row.incrementalRevenue.others.count}
                    </td>
                    <td className="px-2 py-1.5 text-right border-r border-gray-200 dark:border-gray-700">
                      {formatAmount(row.incrementalRevenue.others.revenue)}
                    </td>

                    {/* Today's COLLECTION */}
                    <td className="px-2 py-1.5 text-right font-medium border-r border-gray-200 dark:border-gray-700">
                      {formatAmount(row.todaysCollection.value)}
                    </td>

                    {/* Collection Breakdown */}
                    <td className="px-2 py-1.5 text-right border-r border-gray-200 dark:border-gray-700">
                      {formatAmount(row.collection.newSales.revenue)}
                    </td>
                    <td className="px-2 py-1.5 text-right border-r border-gray-200 dark:border-gray-700">
                      {formatAmount(row.collection.dueRecovered.revenue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Totals Row matching Image 2 & 3 */}
            {rows.length > 0 && (
              <tfoot className="bg-[#f8f9fa] dark:bg-gray-800 font-bold border-t-2 border-gray-300 dark:border-gray-600">
                <tr>
                  <td className="px-2.5 py-2 text-center border-r border-gray-200 dark:border-gray-700 sticky left-0 bg-[#f8f9fa] dark:bg-gray-800"></td>
                  <td className="px-2.5 py-2 text-left border-r border-gray-200 dark:border-gray-700">
                    Total
                  </td>

                  {/* Leads Totals */}
                  <td className="px-2 py-2 text-right border-r border-gray-200 dark:border-gray-700"></td>
                  <td className="px-2 py-2 text-right border-r border-gray-200 dark:border-gray-700">
                    {totals.addedToday}
                  </td>
                  <td className="px-2 py-2 text-right border-r border-gray-200 dark:border-gray-700">
                    {totals.referralGenerated}
                  </td>
                  <td className="px-2 py-2 text-right border-r border-gray-200 dark:border-gray-700">
                    {totals.leadConverted.count}
                  </td>
                  <td className="px-2 py-2 text-right border-r border-gray-200 dark:border-gray-700">
                    {formatAmount(totals.leadConverted.value)}
                  </td>
                  <td className="px-2 py-2 text-right border-r border-gray-200 dark:border-gray-700">
                    {totals.spotConversion.count}
                  </td>
                  <td className="px-2 py-2 text-right border-r border-gray-200 dark:border-gray-700">
                    {formatAmount(totals.spotConversion.value)}
                  </td>
                  <td className="px-2 py-2 text-right border-r border-gray-200 dark:border-gray-700">
                    {totals.totalClosures.count}
                  </td>
                  <td className="px-2 py-2 text-right border-r border-gray-200 dark:border-gray-700">
                    {formatAmount(totals.totalClosures.value)}
                  </td>

                  {/* Trial Totals */}
                  <td className="px-2 py-2 text-right border-r border-gray-200 dark:border-gray-700">
                    {totals.trialScheduled}
                  </td>
                  <td className="px-2 py-2 text-right border-r border-gray-200 dark:border-gray-700">
                    {totals.trialCompleted}
                  </td>

                  {/* Today's Sale Total */}
                  <td className="px-2 py-2 text-right font-bold border-r border-gray-200 dark:border-gray-700">
                    {formatAmount(totals.todaysSale)}
                  </td>

                  {/* New Clients Totals */}
                  <td className="px-2 py-2 text-right border-r border-gray-200 dark:border-gray-700">
                    {totals.newClients.servicesNonPt.count}
                  </td>
                  <td className="px-2 py-2 text-right border-r border-gray-200 dark:border-gray-700">
                    {formatAmount(totals.newClients.servicesNonPt.revenue)}
                  </td>
                  <td className="px-2 py-2 text-right border-r border-gray-200 dark:border-gray-700">
                    {totals.newClients.pt.count}
                  </td>
                  <td className="px-2 py-2 text-right border-r border-gray-200 dark:border-gray-700">
                    {formatAmount(totals.newClients.pt.revenue)}
                  </td>

                  {/* Existing Clients Totals */}
                  <td className="px-2 py-2 text-right border-r border-gray-200 dark:border-gray-700">
                    {totals.existingClients.servicesNonPt.count}
                  </td>
                  <td className="px-2 py-2 text-right border-r border-gray-200 dark:border-gray-700">
                    {formatAmount(totals.existingClients.servicesNonPt.revenue)}
                  </td>
                  <td className="px-2 py-2 text-right border-r border-gray-200 dark:border-gray-700">
                    {totals.existingClients.pt.count}
                  </td>
                  <td className="px-2 py-2 text-right border-r border-gray-200 dark:border-gray-700">
                    {formatAmount(totals.existingClients.pt.revenue)}
                  </td>

                  {/* Incremental Revenue Totals */}
                  <td className="px-2 py-2 text-right border-r border-gray-200 dark:border-gray-700">
                    {totals.incrementalRevenue.store.count}
                  </td>
                  <td className="px-2 py-2 text-right border-r border-gray-200 dark:border-gray-700">
                    {formatAmount(totals.incrementalRevenue.store.revenue)}
                  </td>
                  <td className="px-2 py-2 text-right border-r border-gray-200 dark:border-gray-700">
                    {totals.incrementalRevenue.others.count}
                  </td>
                  <td className="px-2 py-2 text-right border-r border-gray-200 dark:border-gray-700">
                    {formatAmount(totals.incrementalRevenue.others.revenue)}
                  </td>

                  {/* Today's COLLECTION Total */}
                  <td className="px-2 py-2 text-right font-bold border-r border-gray-200 dark:border-gray-700">
                    {formatAmount(totals.todaysCollection)}
                  </td>

                  {/* Collection Totals */}
                  <td className="px-2 py-2 text-right border-r border-gray-200 dark:border-gray-700">
                    {formatAmount(totals.collection.newSales)}
                  </td>
                  <td className="px-2 py-2 text-right border-r border-gray-200 dark:border-gray-700">
                    {formatAmount(totals.collection.dueRecovered)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default DSRReportPage;
