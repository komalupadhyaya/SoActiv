// components/layout/AdminLayout.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useClient } from '../../hooks/useClient';
import { useStaff } from '../../hooks/useStaff'; // ← Import useStaff

// Shared types
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
  const { recentStaffActions } = useStaff(); // ← Get staff actions

  // Process client AND staff actions into notifications
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

    // 🟢 Client notifications
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

    // 🔵 Staff notifications
    const staffNotifications = recentStaffActions
      .filter((action) => isWithinFilter(action.timestamp))
      .map((action) => ({
        id: `notif-staff-${action.type}-${action.staffName}-${action.timestamp}`,
        message: `New staff added: ${action.staffName}`,
        timestamp: action.timestamp,
      }));

    // 🔗 Merge and sort by newest
    const allNotifications = [...clientNotifications, ...staffNotifications].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Update only if changed
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="lg:pl-64">
        <Header
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          activities={notifications}
          markAsSeen={markAsSeen}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
        />
        <main className="p-4 lg:p-6">
          <Outlet context={{ dateFilter, setDateFilter }} />
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 shadow-lg">
            <Sidebar />
          </div>
        </div>
      )}
    </div>
  );
};