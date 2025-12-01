import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useClient } from '../../hooks/useClient';
import { useStaff } from '../../hooks/useStaff';

interface Notification {
  id: string;
  message: string;
  timestamp: string;
}

export const AdminLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dateFilter, setDateFilter] = useState<'monthly' | 'yearly'>('monthly');

  const { user, isLoading } = useAuth();
  const { recentActivities: clientActions } = useClient();
  const { recentStaffActions } = useStaff();

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

    const clientNotifications = clientActions
      .filter((action) => isWithinFilter(action.timestamp))
      .map((action) => ({
        id: `notif-client-${action.type}-${action.clientName}-${action.timestamp}`,
        message:
          action.type === 'create'
            ? `New client added: ${action.clientName}`
            : `Client deleted: ${action.clientName}`,
        timestamp: action.timestamp,
      }));

    const staffNotifications = recentStaffActions
      .filter((action) => isWithinFilter(action.timestamp))
      .map((action) => ({
        id: `notif-staff-${action.type}-${action.staffName}-${action.timestamp}`,
        message: `New staff added: ${action.staffName}`,
        timestamp: action.timestamp,
      }));

    const allNotifications = [...clientNotifications, ...staffNotifications].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    setNotifications((prev) => {
      if (
        prev.length === allNotifications.length &&
        prev[0]?.id === allNotifications[0]?.id
      ) {
        return prev;
      }
      return allNotifications;
    });
  }, [clientActions, recentStaffActions, dateFilter]);

  const markAsSeen = () => {
    console.log('Notifications marked as seen');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar: shown always for xl, toggled for smaller screens */}
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />


      <div className="flex-1 xl:pl-64 flex flex-col">
        <Header
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
          activities={notifications}
          markAsSeen={markAsSeen}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
        />
        <main className="p-4 xl:p-6 flex-1 overflow-auto">
          <Outlet context={{ dateFilter, setDateFilter }} />
        </main>
      </div>

      {/* Optional: close sidebar if overlay clicked outside sidebar */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 xl:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};
