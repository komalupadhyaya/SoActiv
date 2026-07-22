import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { AdminLayout } from './components/layout/AdminLayout';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { PricingPage } from './pages/PricingPage';
import ContactPage from './pages/ContactPage';

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
import { TrainerNutrition } from './pages/staff/TrainerNutrition';

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
import { UserProfilePage } from './pages/common/UserProfilePage'; // For Admin (gym owner)
import { SuperAdminProfilePage } from './pages/superAdmin/SuperAdminProfilePage'; // For SuperAdmin
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
import { AdminCleaningPage } from './pages/admin/AdminCleaningPage';
import { CleaningChecklistPage } from './pages/staff/CleaningChecklistPage';
import { ClientFormPage as StaffClientFormPage } from './pages/staff/ClientFormPage';
import CheckInPage from './pages/staff/receptionist/CheckInPage';
import BookClassPage from './pages/staff/receptionist/BookClassPage';
import BookAppointmentPage from './pages/staff/receptionist/BookAppointmentPage';
import RegisterComplaintPage from './pages/staff/receptionist/RegisterComplaintPage';
import { StaffEnquiryFormPage } from './pages/staff/StaffEnquiryFormPage';

// Super Admin Pages
import { SuperAdminLoginPage } from './pages/superAdmin/SuperAdminLoginPage';
import { SuperAdminLayout } from './components/layout/SuperAdminLayout';
import { SuperAdminDashboard } from './pages/superAdmin/SuperAdminDashboard';
import { GymsListPage } from './pages/superAdmin/GymsListPage';
import { GymDetailsPage } from './pages/superAdmin/GymDetailsPage';
import AdminsListPage from './pages/superAdmin/AdminsListPage';
import PlansPage from './pages/superAdmin/PlansPage';
import ContactsInboxPage from './pages/superAdmin/ContactsInboxPage';
import ContactSupportPage from './pages/admin/ContactSupportPage';
import { AdminSupportInboxPage } from './pages/admin/AdminSupportInboxPage';
import { SuperAdminAnnouncementsPage } from './pages/superAdmin/SuperAdminAnnouncementsPage';

// Member Pages
import { MemberLayout } from './components/layout/MemberLayout';
import { MemberDashboard } from './pages/member/MemberDashboard';
import { MemberPayments } from './pages/member/MemberPayments';
import { MemberAttendance } from './pages/member/MemberAttendance';
import { MemberProgressPhotos } from './pages/member/MemberProgressPhotos';
import { MemberGoals } from './pages/member/MemberGoals';
import { MemberNutrition } from './pages/member/MemberNutrition';
import { MemberExerciseLibrary } from './pages/member/MemberExerciseLibrary';
import { AdminExerciseLibrary } from './pages/admin/AdminExerciseLibrary';
import { MemberSupportPage } from './pages/member/MemberSupportPage';
import { ClassManagementPage } from './pages/admin/ClassManagementPage';
import { TrainerClassesPage } from './pages/staff/TrainerClassesPage';
import { MemberClassesPage } from './pages/member/MemberClassesPage';


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
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/contact" element={<ContactPage />} />
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
                  <Route path="follow-ups/edit/:id" element={<FollowUpFormPage />} />
                  <Route path="calendar" element={<CalendarPage />} />
                  <Route path="schedule" element={<Schedule />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="profile" element={<UserProfilePage />} />
                  <Route path="staff-attendance" element={<AttendanceSheet />} />
                  <Route path="attendance" element={<Attendance />} />
                  <Route path="pt-plans" element={<PTPlansPage />} />
                  <Route path="pt-assignments" element={<PTAssignmentsPage />} />
                  <Route path="announcements" element={<AdminAnnouncementsPage />} />
                  <Route path="cleaning" element={<AdminCleaningPage />} />
                  <Route path="exercises" element={<AdminExerciseLibrary />} />
                  <Route path="contact-support" element={<ContactSupportPage />} />
                  <Route path="member-support" element={<AdminSupportInboxPage />} />
                  <Route
                    path="classes"
                    element={
                      <ProtectedRoute requiredFeature="classes">
                        <ClassManagementPage />
                      </ProtectedRoute>
                    }
                  />
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
                    path="members/new"
                    element={
                      <ProtectedRoute allowedPositions={['manager']}>
                        <StaffClientFormPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="members/edit/:id"
                    element={
                      <ProtectedRoute allowedPositions={['manager']}>
                        <StaffClientFormPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="enquiries"
                    element={
                      <ProtectedRoute allowedPositions={['manager', 'sales', 'receptionist']}>
                        <SalesLeads />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="enquiries/new"
                    element={
                      <ProtectedRoute allowedPositions={['manager', 'receptionist']}>
                        <StaffEnquiryFormPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="enquiries/edit/:id"
                    element={
                      <ProtectedRoute allowedPositions={['manager', 'receptionist']}>
                        <StaffEnquiryFormPage />
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
                  <Route
                    path="member-support"
                    element={
                      <ProtectedRoute allowedPositions={['manager']}>
                        <AdminSupportInboxPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="client-nutrition"
                    element={
                      <ProtectedRoute allowedPositions={['trainer']}>
                        <TrainerNutrition />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="cleaning"
                    element={
                      <ProtectedRoute allowedPositions={['manager', 'cleaner']}>
                        <CleaningChecklistPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="exercises"
                    element={
                      <ProtectedRoute allowedPositions={['manager']}>
                        <AdminExerciseLibrary />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="classes"
                    element={
                      <ProtectedRoute allowedPositions={['manager']} requiredFeature="classes">
                        <ClassManagementPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="my-classes"
                    element={
                      <ProtectedRoute allowedPositions={['trainer']} requiredFeature="classes">
                        <TrainerClassesPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Receptionist-only pages */}
                  <Route
                    path="check-in"
                    element={
                      <ProtectedRoute allowedPositions={['receptionist']}>
                        <CheckInPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="book-class"
                    element={
                      <ProtectedRoute allowedPositions={['receptionist']} requiredFeature="classes">
                        <BookClassPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="book-appointment"
                    element={
                      <ProtectedRoute allowedPositions={['receptionist']}>
                        <BookAppointmentPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="complaints"
                    element={
                      <ProtectedRoute allowedPositions={['receptionist']}>
                        <RegisterComplaintPage />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* Member Routes */}
                <Route
                  path="/member"
                  element={
                    <ProtectedRoute allowedRoles={['member']}>
                      <MemberLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/member/dashboard" replace />} />
                  <Route path="dashboard" element={<MemberDashboard />} />
                  <Route path="announcements" element={<StaffAnnouncementsPage />} />
                  <Route
                    path="payments"
                    element={
                      <ProtectedRoute requiredFeature="payments">
                        <MemberPayments />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="attendance"
                    element={
                      <ProtectedRoute requiredFeature="attendance">
                        <MemberAttendance />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="progress-photos"
                    element={
                      <ProtectedRoute requiredFeature="memberPortal">
                        <MemberProgressPhotos />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="fitness-goals"
                    element={
                      <ProtectedRoute requiredFeature="memberPortal">
                        <MemberGoals />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="nutrition"
                    element={
                      <ProtectedRoute requiredFeature="memberPortal">
                        <MemberNutrition />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="exercises"
                    element={
                      <ProtectedRoute requiredFeature="memberPortal">
                        <MemberExerciseLibrary />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="profile" element={<UserProfilePage />} />
                  <Route path="contact-support" element={<MemberSupportPage />} />
                  <Route
                    path="classes"
                    element={
                      <ProtectedRoute requiredFeature="classes">
                        <MemberClassesPage />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* Super Admin Routes */}
                <Route path="/super-admin/login" element={<SuperAdminLoginPage />} />
                <Route path="/super-admin" element={<SuperAdminLayout />}>
                  <Route index element={<Navigate to="/super-admin/dashboard" replace />} />
                  <Route path="dashboard" element={<SuperAdminDashboard />} />
                  <Route path="gyms" element={<GymsListPage />} />
                  <Route path="gyms/:id" element={<GymDetailsPage />} />
                  <Route path="admins" element={<AdminsListPage />} />
                  <Route path="plans" element={<PlansPage />} />
                  <Route path="contacts" element={<ContactsInboxPage />} />
                  <Route path="announcements" element={<SuperAdminAnnouncementsPage />} />
                  <Route path="profile" element={<SuperAdminProfilePage />} />
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