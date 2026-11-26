import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { ClientSegmentsSidebar } from './ClientSegmentsSidebar';
import { ReportsSidebar } from './ReportsSidebar';
import { ExtraSidebar } from './ExtraSidebar';
import { Header } from './Header';
import { useClient } from '../../hooks/useClient';
import { useStaff } from '../../hooks/useStaff';

interface Notification {
  id: string;
  message: string;
  timestamp: string;
}

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClientSegmentsOpen, setIsClientSegmentsOpen] = useState(false);
  const [isReportsSidebarOpen, setIsReportsSidebarOpen] = useState(false);
  const [isExtraSidebarOpen, setIsExtraSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dateFilter, setDateFilter] = useState<'monthly' | 'yearly'>('monthly');

  // Close flyout sidebars when location changes
  useEffect(() => {
    setIsClientSegmentsOpen(false);
    setIsReportsSidebarOpen(false);
    setIsExtraSidebarOpen(false);
  }, [location.pathname, location.search]);

  const { user, role, isLoading, logout } = useAuth();
  const { recentActivities: clientActions } = useClient();
  const { recentStaffActions } = useStaff();

  // Notifications aggregation
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

  // ===== HARD ROLE GUARD (PREVENT ROLE MUTATION) =====
  // ONLY run guard AFTER auth initialization completes
  useEffect(() => {
    if (!isLoading && role !== 'admin') {
      // Role mismatch detected - another role logged in
      // AuthContext handles storage clearing
      logout();
      window.location.href = '/login'; // Hard redirect to login
    }
  }, [isLoading, role, logout]);

  // ===== WAIT FOR AUTH INITIALIZATION =====
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // ===== BLOCK RENDER ON ROLE MISMATCH =====
  if (!user || role !== 'admin') {
    return null; // Prevent any rendering until role is correct
  }

  return (
    <div>
      {/* Primary Collapsed Sidebar */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isCollapsed={true}
        isClientSegmentsOpen={isClientSegmentsOpen}
        onToggleClientSegments={() => {
          setIsReportsSidebarOpen(false);
          setIsExtraSidebarOpen(false);
          setIsClientSegmentsOpen((prev) => !prev);
        }}
        isReportsSidebarOpen={isReportsSidebarOpen}
        onToggleReportsSidebar={() => {
          setIsClientSegmentsOpen(false);
          setIsExtraSidebarOpen(false);
          setIsReportsSidebarOpen((prev) => !prev);
        }}
        isExtraSidebarOpen={isExtraSidebarOpen}
        onToggleExtraSidebar={() => {
          setIsClientSegmentsOpen(false);
          setIsReportsSidebarOpen(false);
          setIsExtraSidebarOpen((prev) => !prev);
        }}
      />

      {/* Secondary Client Segments Flyout Sidebar */}
      <ClientSegmentsSidebar
        isOpen={isClientSegmentsOpen}
        onClose={() => setIsClientSegmentsOpen(false)}
      />

      {/* Reports Flyout Sidebar */}
      <ReportsSidebar
        isOpen={isReportsSidebarOpen}
        onClose={() => setIsReportsSidebarOpen(false)}
      />

      {/* Extra Modules Flyout Sidebar */}
      <ExtraSidebar
        isOpen={isExtraSidebarOpen}
        onClose={() => setIsExtraSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out xl:pl-24">
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

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 xl:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

