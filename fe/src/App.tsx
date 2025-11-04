import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { AdminLayout } from './components/layout/AdminLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Admin Pages
import { DashboardPage } from './pages/admin/DashboardPage';
import { EnquiriesPage } from './pages/admin/EnquiriesPage';
import { EnquiryFormPage } from './pages/admin/EnquiryFormPage';
import { ClientListPage } from './pages/admin/ClientListPage';
import { ClientFormPage } from './pages/admin/ClientFormPage';
import { StaffListPage } from './pages/admin/StaffListPage';
import { StaffFormPage } from './pages/admin/StaffFormPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { AttendanceSheet } from './pages/admin/staffAttendance';
import { UserProfilePage } from './pages/admin/SetupPage';
import { EnquiriesExpiringPage } from './pages/admin/EnquiriesExpiringPage';
import { PTExpiringPage } from './pages/admin/PTExpiringPage';
import { FollowUpsPage } from './pages/admin/FollowUpsPage';
import { FollowUpFormPage } from './pages/admin/FollowUpFormPage';
import { CalendarPage } from './pages/admin/CalendarPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="enquiries" element={<EnquiriesPage />} />
                <Route path="enquiry-form" element={<EnquiryFormPage />} />
                <Route path="enquiries/edit/:id" element={<EnquiryFormPage />} />
                <Route path="enquiries-expiring" element={<EnquiriesExpiringPage />} />
                <Route path="clients" element={<ClientListPage />} />
                <Route path="client-form" element={<ClientFormPage />} />
                <Route path="client-form/:id" element={<ClientFormPage />} />
                <Route path="pt-expiring" element={<PTExpiringPage />} />
                <Route path="staff" element={<StaffListPage />} />
                <Route path="staff-form" element={<StaffFormPage />} />
                <Route path="staff-form/:id" element={<StaffFormPage />} />
                <Route path="follow-ups" element={<FollowUpsPage />} />
                <Route path="follow-ups/new" element={<FollowUpFormPage />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="profile" element={<UserProfilePage />} />
                <Route path="staff-attendance" element={<AttendanceSheet />} />
              </Route>

              {/* Default Routes */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              {/* Optional: Catch-all for undefined routes */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;