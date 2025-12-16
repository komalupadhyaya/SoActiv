import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { AdminLayout } from './components/layout/AdminLayout';

// Public Pages
import { LandingPage } from './pages/LandingPage';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Staff Pages
import { StaffLoginPage } from './pages/staff/StaffLoginPage';
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { StaffLayout } from './components/layout/StaffLayout';
import { Attendance } from './pages/staff/Attendance';
import { Schedule } from './pages/staff/Schedule';
import { StaffAttendance } from './pages/staff/StaffAttendance';
import { MembersList } from './pages/staff/MembersList';
import { TrainerMembers } from './pages/staff/TrainerMembers';
import { SalesLeads } from './pages/staff/SalesLeads';
import { ProfileEdit } from './pages/staff/ProfileEdit';
import { StaffFollowUps } from './pages/staff/StaffFollowUps';

// Protected Route
import { ProtectedRoute } from './components/routing/ProtectedRoute';

// Admin Pages
import { DashboardPage } from './pages/admin/DashboardPage';
import { EnquiriesPage } from './pages/admin/EnquiriesPage';
import { EnquiryFormPage } from './pages/admin/EnquiryFormPage';
import { ClientListPage } from './pages/admin/ClientListPage';
import { ClientFormPage } from './pages/admin/ClientFormPage';
import { StaffManagerPage } from './pages/admin/StaffManagerPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { AttendanceSheet } from './pages/admin/staffAttendance';
import { UserProfilePage } from './pages/admin/SetupPage';
import { EnquiriesExpiringPage } from './pages/admin/EnquiriesExpiringPage';
import { PTExpiringPage } from './pages/admin/PTExpiringPage';
import { FollowUpsPage } from './pages/admin/FollowUpsPage';
import { FollowUpFormPage } from './pages/admin/FollowUpFormPage';
import { CalendarPage } from './pages/admin/CalendarPage';
import { PTPlansPage } from './pages/admin/PTPlansPage';
import { PTAssignmentsPage } from './pages/admin/PTAssignmentsPage';
import { TrainerPTClientsPage } from './pages/staff/TrainerPTClientsPage';
import { AdminAnnouncementsPage } from './pages/admin/AdminAnnouncementsPage';
import { StaffAnnouncementsPage } from './pages/staff/StaffAnnouncementsPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/staff/login" element={<StaffLoginPage />} />

                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
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
                  <Route path="staff" element={<StaffManagerPage />} />
                  <Route path="staff-page" element={<StaffManagerPage />} />
                  <Route path="follow-ups" element={<FollowUpsPage />} />
                  <Route path="follow-ups/new" element={<FollowUpFormPage />} />
                  <Route path="calendar" element={<CalendarPage />} />
                  <Route path="schedule" element={<Schedule />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="profile" element={<UserProfilePage />} />
                  <Route path="staff-attendance" element={<AttendanceSheet />} />
                  <Route path="attendance" element={<Attendance />} />
                  <Route path="pt-plans" element={<PTPlansPage />} />
                  <Route path="pt-assignments" element={<PTAssignmentsPage />} />
                  <Route path="announcements" element={<AdminAnnouncementsPage />} />
                  {/* <Route path="check-in" element={<QRCheckInPage />} /> */}
                </Route>

                {/* Staff Routes */}
                <Route
                  path="/staff"
                  element={
                    <ProtectedRoute allowedRoles={['staff']}>
                      <StaffLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/staff/dashboard" replace />} />
                  <Route path="dashboard" element={<StaffDashboard />} />
                  <Route path="follow-ups" element={<StaffFollowUps />} />
                  {/* <Route path="my-qr" element={<MyQRCodePage />} /> */}
                  <Route path="profile" element={<UserProfilePage />} />
                  <Route path="profile/edit" element={<Navigate to="/staff/profile" replace />} />
                  <Route path="profile/:id/edit" element={<ProfileEdit />} />
                  <Route path="announcements" element={<StaffAnnouncementsPage />} />

                  <Route
                    path="members"
                    element={
                      <ProtectedRoute allowedPositions={['manager', 'receptionist', 'trainer']}>
                        <MembersList />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="enquiries"
                    element={
                      <ProtectedRoute allowedPositions={['manager', 'sales']}>
                        <SalesLeads />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="schedule"
                    element={
                      <ProtectedRoute allowedPositions={['manager', 'receptionist', 'trainer', 'sales']}>
                        <Schedule />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="staff-list"
                    element={
                      <ProtectedRoute allowedPositions={['manager']}>
                        <StaffManagerPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="team-attendance"
                    element={
                      <ProtectedRoute allowedPositions={['manager']}>
                        <StaffAttendance />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="my-clients"
                    element={
                      <ProtectedRoute allowedPositions={['trainer']}>
                        <TrainerMembers />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="attendance"
                    // All staff can view their own attendance
                    element={<Attendance />}
                  />

                  {/* PT Routes for Staff */}
                  <Route
                    path="pt-clients"
                    element={
                      <ProtectedRoute allowedPositions={['trainer']}>
                        <TrainerPTClientsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="pt-assignments"
                    element={
                      <ProtectedRoute allowedPositions={['manager']}>
                        <PTAssignmentsPage />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* Catch-all for undefined routes */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;