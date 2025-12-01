// DashboardPage.tsx

import React, {useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  CreditCard,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Client, useClient } from '../../hooks/useClient';
import { useEnquiry } from '../../hooks/useEnquiry';
import { useStaff} from '../../hooks/useStaff'; // ← Import StaffAction
import { useOutletContext } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { ExpiringEnquiriesCard } from '../../components/dashboard/ExpiringEnquiriesCard';
import { ExpiringPTCard } from '../../components/dashboard/ExpiringPTCard';
import { UpcomingFollowUpsCard } from '../../components/dashboard/UpcomingFollowUpsCard';

// Define outlet context type
type DashboardContext = {
  dateFilter: 'monthly' | 'yearly';
  setDateFilter: React.Dispatch<React.SetStateAction<'monthly' | 'yearly'>>;
};

type ActivityColor = 'blue' | 'green' | 'red' | 'teal' | 'orange' | 'purple' | 'yellow';

interface Activity {
  id: string;
  type: 'create';
  message: string;
  timestamp: string;
  icon: { name: string; size: number };
  color: ActivityColor;
}

const colorMap: Record<ActivityColor, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
  teal: 'bg-teal-500',
  orange: 'bg-orange-500',
  purple: 'bg-purple-500',
  yellow: 'bg-yellow-500',
};

const renderIcon = (icon: { name: string; size: number }) => {
  const props = { size: icon.size };
  const icons: Record<string, React.ReactNode> = {
    Users: <Users {...props} />,
    CreditCard: <CreditCard {...props} />,
    DollarSign: <DollarSign {...props} />,
    ChevronLeft: <ChevronLeft {...props} />,
    ChevronRight: <ChevronRight {...props} />,
  };
  return icons[icon.name] || <Users {...props} />;
};

const getFilteredClients = (clients: Client[], filter: 'monthly' | 'yearly'): Client[] => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  return clients.filter((client) => {
    if (!client.startDate) return false;
    const startDate = new Date(client.startDate);
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();

    return filter === 'monthly'
      ? startYear === currentYear && startMonth === currentMonth
      : startYear === currentYear;
  });
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const timeAgo = (timestamp: string): string => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffInMs = now.getTime() - date.getTime();
  const diffInSec = Math.floor(diffInMs / 1000);
  const diffInMin = Math.floor(diffInSec / 60);
  const diffInHrs = Math.floor(diffInMin / 60);
  const diffInDays = Math.floor(diffInHrs / 24);

  if (diffInSec < 60) return 'Just now';
  if (diffInMin < 60) return `${diffInMin} minute${diffInMin > 1 ? 's' : ''} ago`;
  if (diffInHrs < 24) return `${diffInHrs} hour${diffInHrs > 1 ? 's' : ''} ago`;
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
};

export const DashboardPage: React.FC = () => {
  const { dateFilter, setDateFilter } = useOutletContext<DashboardContext>();
  const navigate = useNavigate();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [newClientsCount, setNewClientsCount] = useState<number>(0);
  const [paymentsCollected, setPaymentsCollected] = useState<number>(0);

  const { clients, recentActivities: clientActions } = useClient();
  const { enquiries, loading: enquiryLoading } = useEnquiry();
  const { staff, loading: staffLoading, recentStaffActions: staffActions } = useStaff(); // ← Get staff actions

  const filteredClients = useMemo(
    () => getFilteredClients(clients, dateFilter),
    [clients, dateFilter]
  );

  // Update stats when filtered clients change
  useEffect(() => {
    setNewClientsCount(filteredClients.length);

    const total = filteredClients.reduce((sum, client) => {
      const ptPrice = client.hasPersonalTraining && typeof client.personalTrainingPrice === 'number'
        ? client.personalTrainingPrice
        : 0;
      return sum + client.packagePrice + ptPrice;
    }, 0);

    setPaymentsCollected(total);
  }, [filteredClients]);

  // 🔄 Sync recent client AND staff creations to dashboard activity feed
  useEffect(() => {
    const now = new Date();
    const currentYear = now.getFullYear();

    const isWithinFilter = (timestamp: string) => {
      const actionDate = new Date(timestamp);
      const actionYear = actionDate.getFullYear();
      const actionMonth = actionDate.getMonth();
      return dateFilter === 'monthly'
        ? actionYear === currentYear && actionMonth === now.getMonth()
        : actionYear === currentYear;
    };

    // 🟢 Client activities
    const clientActivities: Activity[] = clientActions
      .filter((action) => isWithinFilter(action.timestamp))
      .map((action) => ({
        id: `client-${action.type}-${action.timestamp}`,
        type: action.type,
        message: `New client added: ${action.clientName}`,
        timestamp: action.timestamp,
        icon: { name: 'Users', size: 16 },
        color: 'green',
      }));

    // 🔵 Staff activities
    const staffActivities: Activity[] = staffActions
      .filter((action) => isWithinFilter(action.timestamp))
      .map((action) => ({
        id: `staff-${action.type}-${action.timestamp}`,
        type: action.type,
        message: `New staff added: ${action.staffName}`,
        timestamp: action.timestamp,
        icon: { name: 'Users', size: 16 },
        color: 'blue',
      }));

    // 🔗 Merge and sort by newest first
    const allActivities = [...clientActivities, ...staffActivities].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    setActivities(allActivities);
  }, [clientActions, staffActions, dateFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const totalStaffSalary = useMemo(() => {
    if (staffLoading) return 0;
    return staff
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => sum + s.salary, 0);
  }, [staff, staffLoading]);

  // ✅ Stats with navigation
  const statsData = [
    {
      title: 'Total Sales',
      value: formatCurrency(paymentsCollected - totalStaffSalary),
      icon: <DollarSign size={24} />,
      color: 'orange' as const,
      onViewMore: () => navigate('/admin/reports'),
    },
    {
      title: 'Payments Collected',
      value: formatCurrency(paymentsCollected),
      icon: <CreditCard size={24} />,
      color: 'green' as const,
      onViewMore: () => navigate('/admin/clients'),
    },
    {
      title: 'New Clients Added',
      value: newClientsCount,
      icon: <Users size={24} />,
      color: 'blue' as const,
      onViewMore: () => navigate('/admin/clients'),
    },
  ];

  // Follow-ups logic
  const [followUpPage, setFollowUpPage] = useState(1);
  const FOLLOWUPS_PER_PAGE = 3;

  const followUps = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return enquiries
      .filter((enq) => {
        if (!enq.followUpDate) return false;
        const followUp = new Date(enq.followUpDate);
        followUp.setHours(0, 0, 0, 0);
        return followUp >= now && !['converted', 'lost'].includes(enq.status);
      })
      .sort((a, b) => new Date(a.followUpDate!).getTime() - new Date(b.followUpDate!).getTime());
  }, [enquiries]);

  const totalFollowUpPages = Math.max(1, Math.ceil(followUps.length / FOLLOWUPS_PER_PAGE));
  const paginatedFollowUps = followUps.slice(
    (followUpPage - 1) * FOLLOWUPS_PER_PAGE,
    followUpPage * FOLLOWUPS_PER_PAGE
  );

  const goToNextFollowUpPage = () => setFollowUpPage((p) => Math.min(p + 1, totalFollowUpPages));
  const goToPrevFollowUpPage = () => setFollowUpPage((p) => Math.max(p - 1, 1));

  useEffect(() => {
    setFollowUpPage((prev) => Math.min(prev, totalFollowUpPages));
  }, [totalFollowUpPages]);

  // Pagination for activities
  const [activityPage, setActivityPage] = useState(1);
  const ACTIVITIES_PER_PAGE = 6;

  const totalActivityPages = Math.max(1, Math.ceil(activities.length / ACTIVITIES_PER_PAGE));
  const startIndex = (activityPage - 1) * ACTIVITIES_PER_PAGE;
  const paginatedActivities = activities.slice(startIndex, startIndex + ACTIVITIES_PER_PAGE);

  const goToNextActivityPage = () => setActivityPage((p) => Math.min(p + 1, totalActivityPages));
  const goToPrevActivityPage = () => setActivityPage((p) => Math.max(p - 1, 1));

  useEffect(() => {
    setActivityPage(1);
  }, [activities]);

  return (
    <div className="space-y-6 px-4 py-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Welcome back! Here's what's happening at your gym today.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-end w-[25rem]">
            <Select
              label="Date Filter"
              options={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'yearly', label: 'Yearly' },
              ]}
              value={dateFilter}
              onChange={(value) => setDateFilter(value as 'monthly' | 'yearly')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsData.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            onViewMore={stat.onViewMore}
          />
        ))}
      </div>

      {/* New Feature Cards: Expiring Enquiries, PT, and Follow-Ups */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ExpiringEnquiriesCard />
        <ExpiringPTCard />
        <UpcomingFollowUpsCard />
      </div>

      {/* Recent Activity + Follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={goToPrevActivityPage}
                  disabled={activityPage === 1}
                  className={`p-1 rounded-full transition ${
                    activityPage === 1
                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {renderIcon({ name: 'ChevronLeft', size: 18 })}
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[50px] text-center">
                  {activityPage} / {totalActivityPages}
                </span>
                <button
                  onClick={goToNextActivityPage}
                  disabled={activityPage === totalActivityPages}
                  className={`p-1 rounded-full transition ${
                    activityPage === totalActivityPages
                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {renderIcon({ name: 'ChevronRight', size: 18 })}
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paginatedActivities.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No recent activity in this period
                  </p>
                ) : (
                  paginatedActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        activity.color === 'green'
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 ${colorMap[activity.color]} rounded-full flex items-center justify-center text-white`}>
                          {renderIcon(activity.icon)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {activity.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {timeAgo(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Follow-ups */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Follow-ups</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={goToPrevFollowUpPage}
                  disabled={followUpPage === 1}
                  className={`p-1 rounded-full transition ${
                    followUpPage === 1
                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {renderIcon({ name: 'ChevronLeft', size: 18 })}
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[30px] text-center">
                  {followUpPage}
                </span>
                <button
                  onClick={goToNextFollowUpPage}
                  disabled={followUpPage === totalFollowUpPages}
                  className={`p-1 rounded-full transition ${
                    followUpPage === totalFollowUpPages
                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {renderIcon({ name: 'ChevronRight', size: 18 })}
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {enquiryLoading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
              ) : paginatedFollowUps.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                  No upcoming follow-ups
                </p>
              ) : (
                <div className="space-y-3">
                  {paginatedFollowUps.map((enq) => (
                    <div
                      key={enq._id}
                      className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                    >
                      <div className="flex justify-between">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {enq.name}
                        </h4>
                        <span
                          className={`text-xs px-2 py-1 rounded-full capitalize ${
                            enq.status === 'new'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : enq.status === 'contacted'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                          }`}
                        >
                          {enq.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {enq.phone} | {enq.source}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        Due: {formatDate(enq.followUpDate!)}
                      </p>
                      {enq.assignedStaff && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                          Staff:{' '}
                          {typeof enq.assignedStaff === 'string' ? 'Staff' : enq.assignedStaff.name}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;