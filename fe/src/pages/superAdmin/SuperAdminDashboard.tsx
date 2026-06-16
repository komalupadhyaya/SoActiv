import { useEffect, useState } from 'react';
import { Building2, Users, TrendingUp, DollarSign, Calendar, Activity, AlertCircle, Inbox } from 'lucide-react';
import axios from 'axios';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { useSupport } from '../../hooks/useSupport';
import { Link } from 'react-router-dom';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '').replace(/\/api\/v1$/, '');

// Add CSS to hide the gray hover background on bar charts
const chartStyles = `
    .recharts-bar-rectangle:hover {
        opacity: 1 !important;
    }
    .recharts-rectangle.recharts-tooltip-cursor {
        display: none !important;
    }
`;

interface DashboardData {
    metrics: {
        gyms: { total: number; active: number; trial: number; suspended: number; expired: number };
        members: { total: number };
        revenue: { monthly: number; annual: number; growth: number; currency: string };
        churnRate: string;
        growth: { newGyms7Days: number; newGyms30Days: number };
        alerts: { expiringTrials: number; failedPayments: number; dormantGyms: number };
    };
    charts: {
        gymGrowth: { _id: { year: number; month: number }; count: number }[];
        trialTrend: { _id: { year: number; month: number; day: number }; count: number }[];
        revenueOverTime: { _id: { year: number; month: number }; amount: number }[];
        conversionHistory: { _id: { year: number; month: number }; trials: number; paid: number }[];
        planDistribution: { _id: string; count: number }[];
        featureUsage: { payments: number; attendance: number; pt: number; classes: number; memberPortal: number };
        conversion: { rate: string; total: number; converted: number };
    };
}

export function SuperAdminDashboard() {
    const { theme } = useTheme();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const { stats, fetchSupportStats } = useSupport();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [metricsRes, chartsRes] = await Promise.all([
                    axios.get(`${API_URL}/api/v1/super-admin/dashboard/metrics`, { withCredentials: true }),
                    axios.get(`${API_URL}/api/v1/super-admin/dashboard/charts`, { withCredentials: true })
                ]);
                setData({
                    metrics: metricsRes.data.data,
                    charts: chartsRes.data.data
                });
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        fetchSupportStats();
    }, [fetchSupportStats]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    // Prepare Chart Data
    const activeVsInactiveData = [
        { name: 'Active', value: data?.metrics.gyms.active || 0, color: '#10b981' },
        { name: 'Trial', value: data?.metrics.gyms.trial || 0, color: '#f59e0b' },
        { name: 'Suspended', value: data?.metrics.gyms.suspended || 0, color: '#ef4444' },
        { name: 'Expired', value: data?.metrics.gyms.expired || 0, color: '#6b7280' },
    ].filter(d => d.value > 0);


    const revenueData = data?.charts.revenueOverTime?.map(item => ({
        date: item._id ? `${item._id.month}/${item._id.year}` : 'Unknown',
        amount: item.amount
    })) || [];

    const planData = data?.charts.planDistribution?.map(item => ({
        name: item._id ? item._id.charAt(0).toUpperCase() + item._id.slice(1) : 'Unknown',
        count: item.count
    })) || [];

    const conversionHistoryData = data?.charts.conversionHistory?.map(item => ({
        date: item._id ? `${item._id.month}/${item._id.year}` : 'Unknown',
        trials: item.trials,
        paid: item.paid
    })) || [];

    const growthData = data?.charts.gymGrowth?.map(item => ({
        date: item._id ? `${item._id.month}/${item._id.year}` : 'Unknown',
        gyms: item.count
    })) || [];

    const featureStats = data?.charts.featureUsage ? [
        { name: 'Payments', count: data.charts.featureUsage.payments },
        { name: 'Attendance', count: data.charts.featureUsage.attendance },
        { name: 'PT Sessions', count: data.charts.featureUsage.pt },
        { name: 'Classes', count: data.charts.featureUsage.classes },
        { name: 'Member Portal', count: data.charts.featureUsage.memberPortal },
    ] : [];


    return (
        <div className="space-y-8 pb-10">
            {/* Force remove Recharts focus outline */}
            <style>{`
                .recharts-wrapper:focus,
                .recharts-wrapper *:focus,
                .recharts-surface:focus,
                .recharts-layer:focus,
                path:focus {
                    outline: none !important;
                    box-shadow: none !important;
                }
                .recharts-rectangle.recharts-tooltip-cursor {
                    display: none !important;
                }
            `}</style>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Platform Control Room</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Comprehensive SaaS Analytics & Systems Monitoring</p>
                </div>
                {/* <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Platform Active
                    </div>
                </div> */}
            </div>

            {/* KPI Rows */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 1. Total Gyms */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Gyms</p>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{data?.metrics.gyms.total}</h3>
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                {data?.metrics.growth.newGyms30Days} New (30d)
                            </p>
                        </div>
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>

                {/* 2. Active Gyms */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Gyms</p>
                            <h3 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">{data?.metrics.gyms.active}</h3>
                            <p className="text-xs text-gray-400 mt-1">Currently Paid</p>
                        </div>
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <Activity className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                    </div>
                </div>

                {/* 3. Trials */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Trials</p>
                            <h3 className="text-3xl font-bold text-amber-500 mt-2">{data?.metrics.gyms.trial}</h3>
                            <p className="text-xs text-gray-400 mt-1">14-day cycle</p>
                        </div>
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            <Calendar className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                    </div>
                </div>

                {/* 4. Churn Rate */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Churn Rate</p>
                            <h3 className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{data?.metrics.churnRate}%</h3>
                            <p className="text-xs text-gray-400 mt-1">Platform Exit Rate</p>
                        </div>
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                    </div>
                </div>

                {/* Financial KPIs */}
                {/* 5. MRR */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">MRR</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                                {data?.metrics.revenue.currency} {data?.metrics.revenue.monthly.toLocaleString()}
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">Monthly Recurring</p>
                        </div>
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </div>

                {/* 6. ARR */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">ARR</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                                {data?.metrics.revenue.currency} {data?.metrics.revenue.annual.toLocaleString()}
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">Annual Projected</p>
                        </div>
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                </div>

                {/* 7. Revenue Growth */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Revenue Growth</p>
                            <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                                +{data?.metrics.revenue.growth.toFixed(1)}%
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">MoM Growth Rate</p>
                        </div>
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </div>

                {/* 8. Total Members */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Members</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                                {data?.metrics.members.total.toLocaleString()}
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">Across all gyms</p>
                        </div>
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <Users className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                        </div>
                    </div>
                </div>

                {/* 9. Support Messages (New Widget) */}
                <Link to="/super-admin/contacts" className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-orange-200 dark:border-orange-900/30 hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-orange-600 dark:text-orange-400">New Support Messages</p>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.unreadCount}</h3>
                            <p className="text-xs text-orange-500 mt-1 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                View Inbox &rarr;
                            </p>
                        </div>
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg group-hover:scale-110 transition-transform">
                            <Inbox className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        </div>
                    </div>
                </Link>
            </div>

            {/* Alerts & Critical Action Center */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        Platform Alerts
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/50">
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-400">Expiring Trials</p>
                            <p className="text-2xl font-bold text-amber-900 dark:text-amber-200 mt-1">{data?.metrics.alerts.expiringTrials}</p>
                            <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">Ending in &lt; 3 days</p>
                        </div>
                        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50">
                            <p className="text-sm font-medium text-red-800 dark:text-red-400">Failed Payments</p>
                            <p className="text-2xl font-bold text-red-900 dark:text-red-200 mt-1">{data?.metrics.alerts.failedPayments}</p>
                            <p className="text-xs text-red-600 dark:text-red-500 mt-1">Past due invoices</p>
                        </div>
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-400">Dormant Gyms</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{data?.metrics.alerts.dormantGyms}</p>
                            <p className="text-xs text-gray-500 mt-1">No activity in 7 days</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Feature Usage Snapshot</h3>
                    <div className="space-y-4">
                        {featureStats.map((stat) => (
                            <div key={stat.name} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">{stat.name}</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{Math.round((stat.count / (data?.metrics.gyms.total || 1)) * 100)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${(stat.count / (data?.metrics.gyms.total || 1)) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Charts Section - Row 1 (40% - 40% - 20%) */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">

                {/* 1. Revenue Stream */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 lg:col-span-2 outline-none focus:outline-none focus:ring-0 min-w-0" tabIndex={-1}>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Revenue Trend (Monthly)</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                                <XAxis dataKey="date" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                                <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}
                                />
                                <Area type="monotone" dataKey="amount" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Trial → Paid Conversion (Stacked Bar) */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 lg:col-span-2 outline-none focus:outline-none focus:ring-0 min-w-0" tabIndex={-1}>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Trial → Paid Conversion</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={conversionHistoryData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                                <XAxis dataKey="date" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                                <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                                <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff' }} />
                                <Legend />
                                <Bar dataKey="trials" stackId="a" fill="#f59e0b" name="Free Trials" />
                                <Bar dataKey="paid" stackId="a" fill="#10b981" name="Converted (Paid)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. Active vs Inactive Gyms (Donut) */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 lg:col-span-1 outline-none focus:outline-none focus:ring-0 min-w-0" tabIndex={-1}>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Active vs Inactive Gyms</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={activeVsInactiveData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="60%"
                                    outerRadius="80%"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {activeVsInactiveData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            {/* Charts Section - Row 2 (50% - 50%) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 4. Plan Usage (Horizontal Bar) */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 outline-none focus:outline-none focus:ring-0 min-w-0" tabIndex={-1}>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Most Used Plans</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={planData} margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                                <XAxis type="number" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                                <YAxis dataKey="name" type="category" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff' }} />
                                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 5. Gym Growth (Bar) */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 outline-none focus:outline-none focus:ring-0 min-w-0" tabIndex={-1}>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Total Gym Growth (12 Months)</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={growthData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                                <XAxis dataKey="date" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                                <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                                <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff' }} />
                                <Bar dataKey="gyms" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Add these custom tooltips if needed later, basic ones used for now to meet deadlines.
