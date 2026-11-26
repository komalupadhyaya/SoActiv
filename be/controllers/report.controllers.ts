import type { Request, Response } from 'express';
import { Client } from '../models/client.model';
import Enquiry from '../models/enquiry.model';
import { Schedule } from '../models/schedule.model';
import { User } from '../models/user.model';
import { Gym } from '../models/gym.model';
import { getOwnerId } from './client.controllers';

/**
 * Controller to generate DSR (Daily Sales Report) for a given Month and Year
 */
export const getDsrReport = async (req: Request, res: Response) => {
  try {
    const ownerId = await getOwnerId(req);
    const now = new Date();

    const year = req.query.year ? parseInt(req.query.year as string, 10) : now.getFullYear();
    const month = req.query.month ? parseInt(req.query.month as string, 10) : (now.getMonth() + 1);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ success: false, message: 'Invalid year or month' });
    }

    // Fetch all clients belonging to the owner
    const clients = await Client.find({ userId: ownerId }).lean();

    // Fetch all enquiries belonging to the owner
    const enquiries = await Enquiry.find({
      $or: [{ userId: ownerId }, { adminId: ownerId }]
    }).lean();

    // Fetch schedules belonging to owner
    const schedules = await Schedule.find({ adminId: ownerId }).lean();

    // Flatten all invoice transactions across clients
    const allInvoices: any[] = [];
    for (const c of clients) {
      const cCreatedAt = new Date(c.createdAt || c.startDate);
      if (c.invoices && Array.isArray(c.invoices) && c.invoices.length > 0) {
        c.invoices.forEach((inv: any, idx: number) => {
          allInvoices.push({
            clientId: c._id.toString(),
            clientName: c.fullName,
            clientPhone: c.contactNumber,
            clientCreatedAt: cCreatedAt,
            isFirstInvoice: idx === 0 && (!c.invoices || c.invoices.length === 1),
            ...inv
          });
        });
      } else if (c.invoice) {
        allInvoices.push({
          clientId: c._id.toString(),
          clientName: c.fullName,
          clientPhone: c.contactNumber,
          clientCreatedAt: cCreatedAt,
          isFirstInvoice: true,
          ...c.invoice
        });
      } else if (c.packagePrice) {
        // Fallback for client with no explicit invoice object
        allInvoices.push({
          clientId: c._id.toString(),
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
    const isCurrentMonth = now.getFullYear() === year && (now.getMonth() + 1) === month;
    // For current month, display from 1 to current date (matching image 2 which displays 01-10-2026 to 05-10-2026)
    // For past months, display all days (1 to daysInMonth)
    // If showFullMonth param is provided, show all days
    const showFullMonth = req.query.fullMonth === 'true';
    const maxDay = (isCurrentMonth && !showFullMonth) ? Math.min(now.getDate(), daysInMonth) : daysInMonth;

    const rows = [];
    const totals = {
      existingLeads: 0,
      addedToday: 0,
      referralGenerated: 0,
      leadConverted: { count: 0, value: 0 },
      spotConversion: { count: 0, value: 0 },
      totalClosures: { count: 0, value: 0 },
      trialAnalysis: { trialScheduled: 0, trialCompleted: 0 },
      todaysSale: { value: 0 },
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
      todaysCollection: { value: 0 },
      collection: {
        newSales: { revenue: 0 },
        dueRecovered: { revenue: 0 },
      }
    };

    for (let day = 1; day <= maxDay; day++) {
      const dayDate = new Date(year, month - 1, day);
      const dayStr = `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
      const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'long' });

      // 1. Existing leads: enquiries created prior to this day and not closed/lost
      const existingLeads = enquiries.filter(e => {
        const eDate = new Date(e.createdAt || e.enquiryDate || 0);
        return eDate < dayDate && e.status !== 'lost' && e.status !== 'converted';
      }).length;

      // 2. Added today: enquiries on this day
      const addedTodayEnqs = enquiries.filter(e => {
        const eDate = new Date(e.createdAt || e.enquiryDate || 0);
        return eDate.getFullYear() === year && (eDate.getMonth() + 1) === month && eDate.getDate() === day;
      });
      const addedToday = addedTodayEnqs.length;

      // 3. Referral generated on this day
      const referralGenerated = addedTodayEnqs.filter(e =>
        e.source && /referral/i.test(e.source)
      ).length;

      // 4. Invoices on this day
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

        // Check if personal training
        const isPt = inv.hasPersonalTraining ||
          (inv.items && inv.items.some((it: any) => /pt|personal train/i.test(it.serviceName || '')));

        // Check if renewal / upgrade / existing member
        const isExisting = inv.isRenewal || inv.isUpgrade || !inv.isFirstInvoice;

        // Check if store / admin fee
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

          // Check if spot conversion (enquired on the same day or walk-in) or prior lead converted
          const matchingEnq = enquiries.find(e => e.phone && inv.clientPhone && e.phone === inv.clientPhone);
          if (matchingEnq) {
            const enqD = new Date(matchingEnq.createdAt || matchingEnq.enquiryDate || 0);
            if (enqD.getFullYear() === year && (enqD.getMonth() + 1) === month && enqD.getDate() === day) {
              spotConversionCount++;
              spotConversionValue += totalAmount;
            } else {
              leadConvertedCount++;
              leadConvertedValue += totalAmount;
            }
          } else {
            // Direct walk-in signup -> spot conversion
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

      // Trials scheduled for this day
      const trialScheduled = enquiries.filter(e => {
        if (!e.trialType || e.trialType === 'no-trial') return false;
        const tDate = e.trialDateTime || e.trialClassDate || e.trialSessionDate;
        if (!tDate) return false;
        const td = new Date(tDate);
        return td.getFullYear() === year && (td.getMonth() + 1) === month && td.getDate() === day;
      }).length;

      // Trials completed on this day
      const trialCompleted = schedules.filter(s => {
        if (s.type !== 'member-session' && (s as any).type !== 'trial') return false;
        if (s.status !== 'completed') return false;
        const sd = new Date(s.scheduledDate);
        return sd.getFullYear() === year && (sd.getMonth() + 1) === month && sd.getDate() === day;
      }).length;

      const row = {
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
      };

      rows.push(row);

      // Accumulate totals
      totals.addedToday += addedToday;
      totals.referralGenerated += referralGenerated;
      totals.leadConverted.count += leadConvertedCount;
      totals.leadConverted.value += leadConvertedValue;
      totals.spotConversion.count += spotConversionCount;
      totals.spotConversion.value += spotConversionValue;
      totals.totalClosures.count += totalClosuresCount;
      totals.totalClosures.value += totalClosuresValue;
      totals.trialAnalysis.trialScheduled += trialScheduled;
      totals.trialAnalysis.trialCompleted += trialCompleted;
      totals.todaysSale.value += todaysSale;
      totals.newClients.servicesNonPt.count += newClientsNonPtCount;
      totals.newClients.servicesNonPt.revenue += newClientsNonPtRevenue;
      totals.newClients.pt.count += newClientsPtCount;
      totals.newClients.pt.revenue += newClientsPtRevenue;
      totals.existingClients.servicesNonPt.count += existingClientsNonPtCount;
      totals.existingClients.servicesNonPt.revenue += existingClientsNonPtRevenue;
      totals.existingClients.pt.count += existingClientsPtCount;
      totals.existingClients.pt.revenue += existingClientsPtRevenue;
      totals.incrementalRevenue.store.count += storeCount;
      totals.incrementalRevenue.store.revenue += storeRevenue;
      totals.incrementalRevenue.others.count += adminFeeCount;
      totals.incrementalRevenue.others.revenue += adminFeeRevenue;
      totals.todaysCollection.value += todaysCollection;
      totals.collection.newSales.revenue += newSalesCollection;
      totals.collection.dueRecovered.revenue += dueRecoveredCollection;
    }

    return res.status(200).json({
      success: true,
      data: {
        year,
        month,
        rows,
        totals
      }
    });
  } catch (error: any) {
    console.error('Error generating DSR report:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate DSR report',
      error: error.message
    });
  }
};

/**
 * Controller to generate Annual Revenue Report by Studio (12 months)
 */
export const getRevenueReport = async (req: Request, res: Response) => {
  try {
    const ownerId = await getOwnerId(req);
    const now = new Date();
    const year = req.query.year ? parseInt(req.query.year as string, 10) : now.getFullYear();

    if (isNaN(year)) {
      return res.status(400).json({ success: false, message: 'Invalid year' });
    }

    // Fetch user and gym
    const user = await User.findById(ownerId).lean();
    let gym = null;
    if (user && user.gym) {
      gym = await Gym.findById(user.gym).lean();
    }
    if (!gym) {
      gym = await Gym.findOne({ owner: ownerId }).lean();
    }

    const studioName = gym
      ? (gym.name.toLowerCase().includes('vip road') ? gym.name : `${gym.name} - ${gym.address || 'VIP Road'}`)
      : 'Pro Athletic Gym - VIP Road';

    // Fetch all clients belonging to the owner
    const clients = await Client.find({ userId: ownerId }).lean();

    // 12 months array (0 = Jan, 11 = Dec)
    const monthlyRevenue = Array(12).fill(0);

    for (const c of clients) {
      if (c.invoices && Array.isArray(c.invoices) && c.invoices.length > 0) {
        for (const inv of c.invoices) {
          const raw = inv.invoiceDate || inv.date || inv.createdAt;
          if (raw) {
            const d = new Date(raw);
            if (!isNaN(d.getTime()) && d.getFullYear() === year) {
              const m = d.getMonth();
              const amt = Number(inv.amount ?? inv.totalDue ?? inv.net ?? 0) || 0;
              monthlyRevenue[m] += amt;
            }
          }
        }
      } else if (c.invoice) {
        const raw = c.invoice.invoiceDate || c.invoice.date || c.invoice.createdAt;
        if (raw) {
          const d = new Date(raw);
          if (!isNaN(d.getTime()) && d.getFullYear() === year) {
            const m = d.getMonth();
            const amt = Number(c.invoice.amount ?? c.invoice.totalDue ?? c.invoice.net ?? 0) || 0;
            monthlyRevenue[m] += amt;
          }
        }
      } else if (c.packagePrice) {
        const raw = c.startDate || c.createdAt;
        if (raw) {
          const d = new Date(raw);
          if (!isNaN(d.getTime()) && d.getFullYear() === year) {
            const m = d.getMonth();
            const amt = Number(c.packagePrice) || 0;
            monthlyRevenue[m] += amt;
          }
        }
      }
    }

    const rowTotal = monthlyRevenue.reduce((sum, val) => sum + val, 0);

    const studios = [
      {
        sNo: 1,
        studioName: studioName,
        monthly: monthlyRevenue,
        total: rowTotal
      }
    ];

    const totals = {
      monthly: [...monthlyRevenue],
      grandTotal: rowTotal
    };

    return res.status(200).json({
      success: true,
      data: {
        year,
        studios,
        totals
      }
    });
  } catch (error: any) {
    console.error('Error generating Revenue report:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate Revenue report',
      error: error.message
    });
  }
};
