import React, { useState, useMemo } from 'react';
import { Calendar, TrendingUp, Users, Activity } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { useClient } from '../../hooks/useClient';
import { useStaff } from '../../hooks/useStaff';

interface TrainerStats {
  [trainerId: string]: {
    name: string;
    ptClientCount: number;
  };
}

const timeSlotKeys = ['earlyMorning', 'morning', 'midday', 'evening', 'night'] as const;
type TimeSlotKey = (typeof timeSlotKeys)[number];

export const ReportsPage: React.FC = () => {
  const { clients, loading: clientsLoading } = useClient();
  const { staff, loading: staffLoading } = useStaff();

  const [periodFilter, setPeriodFilter] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  // === Filter clients by current period (for summary stats only) ===
  const filteredClients = useMemo(() => {
    if (!clients.length) return [];

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return clients.filter((c) => {
      const startDate = c.startDate ? new Date(c.startDate) : null;
      if (!startDate || isNaN(startDate.getTime())) return false;

      if (periodFilter === 'monthly') {
        return (
          startDate.getFullYear() === currentYear &&
          startDate.getMonth() === currentMonth
        );
      } else if (periodFilter === 'quarterly') {
        const quarter = Math.floor(startDate.getMonth() / 3);
        const currentQuarter = Math.floor(currentMonth / 3);
        return startDate.getFullYear() === currentYear && quarter === currentQuarter;
      } else if (periodFilter === 'yearly') {
        return startDate.getFullYear() === currentYear;
      }

      return false;
    });
  }, [clients, periodFilter]);

  // === Summary Stats (based on new joins in current period) ===
  const totalRevenue = useMemo(() => {
    return filteredClients.reduce((sum, c) => {
      const pkg = typeof c.packagePrice === 'number' ? c.packagePrice : 0;
      const pt = c.hasPersonalTraining && typeof c.personalTrainingPrice === 'number'
        ? c.personalTrainingPrice
        : 0;
      return sum + pkg + pt;
    }, 0);
  }, [filteredClients]);

  const totalExpenses = useMemo(() => {
    if (staffLoading || !staff.length) return 0;

    const now = new Date();
    return staff
      .filter((s) => {
        if (s.status !== 'active') return false;
        const joining = new Date(s.joiningDate);
        if (isNaN(joining.getTime())) return false;

        return (
          joining.getFullYear() < now.getFullYear() ||
          (joining.getFullYear() === now.getFullYear() && joining.getMonth() <= now.getMonth())
        );
      })
      .reduce((sum, s) => sum + s.salary, 0);
  }, [staff, staffLoading]);

  const netProfit = totalRevenue - totalExpenses;

  // === Report Data (other stats) ===
  const reportData = useMemo(() => {
    if (clientsLoading || staffLoading) return null;

    const totalClients = clients.length;
    const activeClients = clients.filter((c) => c.status === 'active').length;
    const newJoins = filteredClients.length;

    const renewals = filteredClients.filter((c) => {
      const startDate = c.startDate ? new Date(c.startDate) : null;
      const createdAt = c.createdAt ? new Date(c.createdAt) : null;
      if (!startDate || !createdAt || isNaN(startDate.getTime()) || isNaN(createdAt.getTime()))
        return false;
      return startDate > createdAt;
    }).length;

    const ptClientsPerTrainer: TrainerStats = {};
    filteredClients.forEach((c) => {
      if (c.hasPersonalTraining && c.trainer) {
        const trainerId = c.trainer;
        const trainerStaff = staff.find((s) => s._id === trainerId);
        if (trainerStaff) {
          if (!ptClientsPerTrainer[trainerId]) {
            ptClientsPerTrainer[trainerId] = { name: trainerStaff.fullName, ptClientCount: 0 };
          }
          ptClientsPerTrainer[trainerId].ptClientCount += 1;
        }
      }
    });

    const basic = filteredClients.filter((c) => c.plan === 'basic').length;
    const premium = filteredClients.filter((c) => c.plan === 'premium').length;
    const totalPlans = basic + premium || 1;
    const basicPercent = Math.round((basic / totalPlans) * 100);
    const premiumPercent = Math.round((premium / totalPlans) * 100);

    // Peak Hours (same as before)
    const timeSlots: Record<TimeSlotKey, { label: string; start: number; end: number }> = {
      earlyMorning: { label: '5:00 - 8:00 AM', start: 5, end: 8 },
      morning: { label: '8:00 - 11:00 AM', start: 8, end: 11 },
      midday: { label: '11:00 AM - 2:00 PM', start: 11, end: 14 },
      evening: { label: '5:00 - 8:00 PM', start: 17, end: 20 },
      night: { label: '8:00 - 10:00 PM', start: 20, end: 22 },
    };

    const slotCounts: Record<TimeSlotKey, number> = {
      earlyMorning: 0,
      morning: 0,
      midday: 0,
      evening: 0,
      night: 0,
    };

    const parseTime = (timeStr: string): number | null => {
      const normalized = timeStr.trim().replace(/\s+/g, ' ').replace(/\./g, '').toUpperCase();
      const match = normalized.match(/(\d{1,2})(?::(\d{2}))?\s*([AP]M)/);
      if (!match) return null;

      let hour = parseInt(match[1]);
      const period = match[3];

      if (period === 'PM' && hour < 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;

      return hour;
    };

    clients.forEach((client) => {
      if (!client.timing) return;

      const timing = client.timing.trim();
      const rangeMatch = timing.match(/(\d+[:\d]*)\s*-\s*(\d+[:\d]*)\s*([AP]M\.?\s*[AP]M\.?|[AP]M)/i);

      if (rangeMatch) {
        const startStr = rangeMatch[1].trim();
        const endStr = rangeMatch[2].trim();
        const suffix = rangeMatch[3];

        const amPmParts = suffix.replace(/\./g, '').match(/([AP]M)/g);
        const startPeriod = amPmParts?.[0] || 'AM';
        const endPeriod = amPmParts?.[1] || amPmParts?.[0] || 'AM';

        const startTimeStr = `${startStr} ${startPeriod}`;
        const endTimeStr = `${endStr} ${endPeriod}`;

        const startHour = parseTime(startTimeStr);
        const endHour = parseTime(endTimeStr);

        if (startHour !== null && endHour !== null) {
          const start = Math.floor(startHour);
          const end = Math.ceil(endHour);

          timeSlotKeys.forEach((key) => {
            const slot = timeSlots[key];
            if (end > slot.start && start < slot.end) {
              slotCounts[key]++;
            }
          });
        }
      } else {
        const hour = parseTime(timing);
        if (hour !== null) {
          timeSlotKeys.forEach((key) => {
            const slot = timeSlots[key];
            if (hour >= slot.start && hour < slot.end) {
              slotCounts[key]++;
            }
          });
        }
      }
    });

    const maxCount = Math.max(...Object.values(slotCounts));
    const getLevel = (count: number): string => {
      if (count === maxCount && count > 0) return 'Peak Hours';
      if (count > 0 && count >= maxCount * 0.6) return 'High Traffic';
      if (count > 0) return 'Moderate';
      return 'Low';
    };

    const peakHours = timeSlotKeys.map((key) => ({
      label: timeSlots[key].label,
      level: getLevel(slotCounts[key]),
      count: slotCounts[key],
    }));

    return {
      totalClients,
      activeClients,
      newJoins,
      renewals,
      ptClientsPerTrainer,
      totalRevenue,
      totalExpenses,
      netProfit,
      planDistribution: { basicPercent, premiumPercent },
      peakHours,
    };
  }, [clients, filteredClients, totalRevenue, totalExpenses, netProfit, clientsLoading, staffLoading]);

  // === PERFORMANCE CHART: Accurate Monthly Revenue & Expenses ===
  const chartData = useMemo(() => {
    if (clientsLoading || staffLoading || !clients.length || !staff.length) return [];

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (periodFilter === 'monthly') {
      return Array.from({ length: 6 }, (_, i) => {
        const date = new Date(currentYear, currentMonth - 5 + i);
        const year = date.getFullYear();
        const month = date.getMonth();
        const monthName = date.toLocaleString('default', { month: 'short' });

        // ✅ Revenue: sum of all clients active during this month
        const revenue = clients.reduce((sum, c) => {
          const startDate = c.startDate ? new Date(c.startDate) : null;
          const endDate = c.endDate ? new Date(c.endDate) : null;

          if (!startDate || isNaN(startDate.getTime())) return sum;

          // If no end date, assume still active
          const isEndDateValid = endDate && !isNaN(endDate.getTime());

          // Check if client was active during this month
          const clientStart = new Date(startDate);
          const clientEnd = isEndDateValid ? new Date(endDate) : new Date(); // "now" if ongoing

          const monthStart = new Date(year, month, 1);
          const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

          // Overlap: client active during any part of the month
          if (clientEnd >= monthStart && clientStart <= monthEnd) {
            const pkg = typeof c.packagePrice === 'number' ? c.packagePrice : 0;
            const pt = c.hasPersonalTraining && typeof c.personalTrainingPrice === 'number'
              ? c.personalTrainingPrice
              : 0;
            return sum + pkg + pt;
          }

          return sum;
        }, 0);

        // ✅ Expenses: sum of staff who joined on or before this month and are active
        const expenses = staff
          .filter((s) => {
            if (s.status !== 'active') return false;
            const joining = new Date(s.joiningDate);
            if (isNaN(joining.getTime())) return false;
            return (
              joining.getFullYear() < year ||
              (joining.getFullYear() === year && joining.getMonth() <= month)
            );
          })
          .reduce((sum, s) => sum + s.salary, 0);

        // ✅ New Members: clients who joined this month
        const newMembers = clients.filter((c) => {
          const startDate = c.startDate ? new Date(c.startDate) : null;
          if (!startDate || isNaN(startDate.getTime())) return false;
          return startDate.getFullYear() === year && startDate.getMonth() === month;
        }).length;

        return { period: monthName, revenue, expenses, newMembers };
      });
    }

    if (periodFilter === 'quarterly') {
      return Array.from({ length: 4 }, (_, i) => {
        let quarterNum = Math.floor(currentMonth / 3) + 1 - i;
        let year = currentYear;

        while (quarterNum < 1) {
          quarterNum += 4;
          year -= 1;
        }

        const quarterStartMonth = (quarterNum - 1) * 3;
        const label = `Q${quarterNum}`;

        const qStart = new Date(year, quarterStartMonth, 1);
        const qEnd = new Date(year, quarterStartMonth + 3, 0, 23, 59, 59);

        const revenue = clients.reduce((sum, c) => {
          const startDate = c.startDate ? new Date(c.startDate) : null;
          const endDate = c.endDate ? new Date(c.endDate) : null;

          if (!startDate || isNaN(startDate.getTime())) return sum;

          const clientStart = new Date(startDate);
          const clientEnd = endDate && !isNaN(endDate.getTime()) ? new Date(endDate) : new Date();

          if (clientEnd >= qStart && clientStart <= qEnd) {
            const pkg = typeof c.packagePrice === 'number' ? c.packagePrice : 0;
            const pt = c.hasPersonalTraining && typeof c.personalTrainingPrice === 'number'
              ? c.personalTrainingPrice
              : 0;
            return sum + pkg + pt;
          }

          return sum;
        }, 0);

        const expenses = staff
          .filter((s) => {
            if (s.status !== 'active') return false;
            const joining = new Date(s.joiningDate);
            if (isNaN(joining.getTime())) return false;
            const joiningQuarter = Math.floor(joining.getMonth() / 3) + 1;
            return (
              joining.getFullYear() < year ||
              (joining.getFullYear() === year && joiningQuarter <= quarterNum)
            );
          })
          .reduce((sum, s) => sum + s.salary, 0);

        const newMembers = clients.filter((c) => {
          const startDate = c.startDate ? new Date(c.startDate) : null;
          if (!startDate || isNaN(startDate.getTime())) return false;
          const q = Math.floor(startDate.getMonth() / 3) + 1;
          return startDate.getFullYear() === year && q === quarterNum;
        }).length;

        return { period: label, revenue, expenses, newMembers };
      });
    }

    if (periodFilter === 'yearly') {
      return Array.from({ length: 5 }, (_, i) => {
        const year = currentYear - 4 + i;

        const yStart = new Date(year, 0, 1);
        const yEnd = new Date(year, 11, 31, 23, 59, 59);

        const revenue = clients.reduce((sum, c) => {
          const startDate = c.startDate ? new Date(c.startDate) : null;
          const endDate = c.endDate ? new Date(c.endDate) : null;

          if (!startDate || isNaN(startDate.getTime())) return sum;

          const clientStart = new Date(startDate);
          const clientEnd = endDate && !isNaN(endDate.getTime()) ? new Date(endDate) : new Date();

          if (clientEnd >= yStart && clientStart <= yEnd) {
            const pkg = typeof c.packagePrice === 'number' ? c.packagePrice : 0;
            const pt = c.hasPersonalTraining && typeof c.personalTrainingPrice === 'number'
              ? c.personalTrainingPrice
              : 0;
            return sum + pkg + pt;
          }

          return sum;
        }, 0);

        const expenses = staff
          .filter((s) => {
            if (s.status !== 'active') return false;
            const joining = new Date(s.joiningDate);
            if (isNaN(joining.getTime())) return false;
            return joining.getFullYear() <= year;
          })
          .reduce((sum, s) => sum + s.salary, 0);

        const newMembers = clients.filter((c) => {
          const startDate = c.startDate ? new Date(c.startDate) : null;
          if (!startDate || isNaN(startDate.getTime())) return false;
          return startDate.getFullYear() === year;
        }).length;

        return { period: String(year), revenue, expenses, newMembers };
      });
    }

    return [];
  }, [clients, staff, periodFilter, clientsLoading, staffLoading]);

  if (clientsLoading || staffLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-600 dark:text-gray-400">Loading reports...</p>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-red-500">No data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Analyze your gym's performance and growth
          </p>
        </div>
        <Select
          options={[
            { value: 'monthly', label: 'Monthly' },
            { value: 'quarterly', label: 'Quarterly' },
            { value: 'yearly', label: 'Yearly' },
          ]}
          value={periodFilter}
          onChange={(value) => setPeriodFilter(value as any)}
        />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Clients"
          value={reportData.totalClients}
          icon={<Users size={24} />}
          color="blue"
        />
        <StatsCard
          title="Active Clients"
          value={reportData.activeClients}
          icon={<Activity size={24} />}
          color="green"
        />
        <StatsCard
          title={`New Joins (${periodFilter})`}
          value={reportData.newJoins}
          icon={<TrendingUp size={24} />}
          color="orange"
        />
        <StatsCard
          title={`Renewals (${periodFilter})`}
          value={reportData.renewals}
          icon={<Calendar size={24} />}
          color="teal"
        />
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Financial Summary
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</span>
                <span className="text-lg font-semibold text-green-600">
                  ₹{reportData.totalRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Staff Expenses</span>
                <span className="text-lg font-semibold text-red-600">
                  ₹{reportData.totalExpenses.toLocaleString()}
                </span>
              </div>
              <hr className="border-gray-200 dark:border-gray-700" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Net Profit</span>
                <span className="text-xl font-bold text-orange-600">
                  ₹{reportData.netProfit.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {periodFilter === 'monthly'
                ? 'Monthly Performance'
                : periodFilter === 'quarterly'
                ? 'Quarterly Performance'
                : 'Yearly Performance'}
            </h3>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                      {periodFilter === 'monthly'
                        ? 'Month'
                        : periodFilter === 'quarterly'
                        ? 'Quarter'
                        : 'Year'}
                    </th>
                    <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Revenue
                    </th>
                    <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Expenses
                    </th>
                    <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                      New Members
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((data, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 text-sm text-gray-900 dark:text-white">{data.period}</td>
                      <td className="py-2 text-sm text-right text-green-600">
                        ₹{data.revenue.toLocaleString()}
                      </td>
                      <td className="py-2 text-sm text-right text-red-600">
                        ₹{data.expenses.toLocaleString()}
                      </td>
                      <td className="py-2 text-sm text-right text-blue-600">{data.newMembers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trainer Performance */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            PT Clients per Trainer ({periodFilter})
          </h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(reportData.ptClientsPerTrainer).length > 0 ? (
              Object.entries(reportData.ptClientsPerTrainer).map(([id, data]) => (
                <div key={id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{data.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Trainer</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-600">{data.ptClientCount}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">clients</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="col-span-full text-gray-500 dark:text-gray-400 text-center py-4">
                No personal training clients in this period.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Membership & Peak Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Membership Distribution ({periodFilter})
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Basic Plan</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: `${reportData.planDistribution.basicPercent}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {reportData.planDistribution.basicPercent}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Premium Plan</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: `${reportData.planDistribution.premiumPercent}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {reportData.planDistribution.premiumPercent}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Peak Hours ({periodFilter})
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <p className="text-gray-600 dark:text-gray-400">Based on client schedules in this period.</p>
              <div className="space-y-2">
                {reportData.peakHours.map((slot) => (
                  <div key={slot.label} className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">
                      {slot.label}{' '}
                      <span className="text-xs text-gray-500 dark:text-gray-400">({slot.count})</span>
                    </span>
                    <span
                      className={`font-medium ${
                        slot.level === 'Peak Hours'
                          ? 'text-green-600 dark:text-green-400 font-bold'
                          : slot.level === 'High Traffic'
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {slot.level}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;