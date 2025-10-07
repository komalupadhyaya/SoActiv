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
import { ClientsPage } from './pages/admin/ClientsPage';
import { StaffPage } from './pages/admin/StaffPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { AttendanceSheet } from './pages/admin/staffAttendance';
import { UserProfilePage } from './pages/admin/SetupPage';

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
  <Route path="clients" element={<ClientsPage />} />
  <Route path="staff" element={<StaffPage />} />
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