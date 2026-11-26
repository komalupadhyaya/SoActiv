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
import { EnquiryCallsPage } from './pages/admin/EnquiryCallsPage';
import { EnquiryFormPage } from './pages/admin/EnquiryFormPage';
import { ClientListPage } from './pages/admin/ClientListPage';
import { ClientFormPage } from './pages/admin/ClientFormPage';
import { StaffManagerPage } from './pages/admin/StaffManagerPage';
import { StaffTargetPage } from './pages/admin/StaffTargetPage';
import { StaffTargetFormPage } from './pages/admin/StaffTargetFormPage';
import { StaffAdminRightsPage } from './pages/admin/StaffAdminRightsPage';
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
import BiometricManagementPage from './pages/admin/BiometricManagementPage';

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
import { ServiceManagementPage } from './pages/admin/ServiceManagementPage';
import { AddServicePage } from './pages/admin/AddServicePage';
import { MailInvoicePage } from './pages/admin/MailInvoicePage';
import { DailyCollectionReportPage } from './pages/admin/DailyCollectionReportPage';
import { ClientPaymentsPage } from './pages/admin/ClientPaymentsPage';
import { ClientServiceCardPage } from './pages/admin/ClientServiceCardPage';
import { ClientAppointmentsPage } from './pages/admin/ClientAppointmentsPage';
import { ClientTrainingPage } from './pages/admin/ClientTrainingPage';
import { ClientFreezePage } from './pages/admin/ClientFreezePage';
import { ClientChangeDatePage } from './pages/admin/ClientChangeDatePage';
import { ClientRefundCancellationPage } from './pages/admin/ClientRefundCancellationPage';
import { ProFormaInvoiceDetailsPage } from './pages/admin/ProFormaInvoiceDetailsPage';
import { MembershipExpiryReportPage } from './pages/admin/MembershipExpiryReportPage';
import { PTExpiryReportPage } from './pages/admin/PTExpiryReportPage';
import { ClientTransfersPage } from './pages/admin/ClientTransfersPage';
import { DSRReportPage } from './pages/admin/DSRReportPage';
import { RevenueReportPage } from './pages/admin/RevenueReportPage';


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
                  <Route path="enquiries/archive" element={<EnquiriesPage isArchivePage={true} />} />
                  <Route path="enquiries-archive" element={<EnquiriesPage isArchivePage={true} />} />
                  <Route path="memshipequ.aspx" element={<EnquiriesPage />} />
                  <Route path="enquiry-calls" element={<EnquiryCallsPage />} />
                  <Route path="enquiry-calls/:id" element={<EnquiryCallsPage />} />
                  <Route path="memeqcallog.aspx" element={<EnquiryCallsPage />} />
                  <Route path="enquiry-form" element={<EnquiryFormPage />} />
                  <Route path="enquiry-form/:id" element={<EnquiryFormPage />} />
                  <Route path="memadenq.aspx" element={<EnquiryFormPage />} />
                  <Route path="enquiries/edit/:id" element={<EnquiryFormPage />} />
                  <Route path="enquiries-expiring" element={<EnquiriesExpiringPage />} />
                  <Route path="clients" element={<ClientListPage />} />
                  <Route path="memshiplist.aspx" element={<ClientListPage />} />
                  <Route path="memgroup.aspx" element={<ClientListPage />} />
                  <Route path="clients/payments/:id" element={<ClientPaymentsPage />} />
                  <Route path="clients/payments" element={<ClientPaymentsPage />} />
                  <Route path="mempaydt.aspx" element={<ClientPaymentsPage />} />
                  <Route path="clients/service-card/:id" element={<ClientServiceCardPage />} />
                  <Route path="clients/service-card" element={<ClientServiceCardPage />} />
                  <Route path="memsvcard.aspx" element={<ClientServiceCardPage />} />
                  <Route path="clients/appointments/:id" element={<ClientAppointmentsPage />} />
                  <Route path="clients/appointments" element={<ClientAppointmentsPage />} />
                  <Route path="memappnt.aspx" element={<ClientAppointmentsPage />} />
                  <Route path="memappts.aspx" element={<ClientAppointmentsPage />} />
                  <Route path="clients/training/:id" element={<ClientTrainingPage />} />
                  <Route path="clients/training" element={<ClientTrainingPage />} />
                  <Route path="viewmemwkday.aspx" element={<ClientTrainingPage />} />
                  <Route path="clients/freeze/:id" element={<ClientFreezePage />} />
                  <Route path="clients/freeze" element={<ClientFreezePage />} />
                  <Route path="memfreeze.aspx" element={<ClientFreezePage />} />
                  <Route path="clients/change-date/:id" element={<ClientChangeDatePage />} />
                  <Route path="clients/change-date" element={<ClientChangeDatePage />} />
                  <Route path="memsvmsg.aspx" element={<ClientChangeDatePage />} />
                  <Route path="clients/refund-cancellation/:id" element={<ClientRefundCancellationPage />} />
                  <Route path="clients/refund-cancellation" element={<ClientRefundCancellationPage />} />
                  <Route path="clients/cancel-refund/:id" element={<ClientRefundCancellationPage />} />
                  <Route path="clients/cancel-refund" element={<ClientRefundCancellationPage />} />
                  <Route path="memcnclsv.aspx" element={<ClientRefundCancellationPage />} />
                  <Route path="memcancel.aspx" element={<ClientRefundCancellationPage />} />
                  <Route path="clients/transfers-sent/:id" element={<ClientTransfersPage />} />
                  <Route path="clients/transfers-sent" element={<ClientTransfersPage />} />
                  <Route path="clients/transfers-received/:id" element={<ClientTransfersPage />} />
                  <Route path="clients/transfers-received" element={<ClientTransfersPage />} />
                  <Route path="memtransfers.aspx" element={<ClientTransfersPage />} />
                  <Route path="reports/proforma-invoice-details/:clientId/:invoiceId" element={<ProFormaInvoiceDetailsPage />} />
                  <Route path="reports/proforma-invoice-details/:clientId" element={<ProFormaInvoiceDetailsPage />} />
                  <Route path="reports/proforma-invoice-details" element={<ProFormaInvoiceDetailsPage />} />
                  <Route path="proforma-invoice-details/:clientId/:invoiceId" element={<ProFormaInvoiceDetailsPage />} />
                  <Route path="proforma-invoice-details/:clientId" element={<ProFormaInvoiceDetailsPage />} />
                  <Route path="proforma-invoice-details" element={<ProFormaInvoiceDetailsPage />} />
                  <Route path="memproformadt.aspx" element={<ProFormaInvoiceDetailsPage />} />
                  <Route path="client-form" element={<ClientFormPage />} />
                  <Route path="client-form/:id" element={<ClientFormPage />} />
                  <Route path="pt-expiring" element={<PTExpiringPage />} />
                  <Route path="staff" element={<StaffManagerPage />} />
                  <Route path="staff-page" element={<StaffManagerPage />} />
                  <Route path="staff-form" element={<Navigate to="/admin/staff?action=add" replace />} />
                  <Route path="staff-target" element={<StaffTargetPage />} />
                  <Route path="staff-target/new" element={<StaffTargetFormPage />} />
                  <Route path="staff-target/edit/:id" element={<StaffTargetFormPage />} />
                  <Route path="staff-target/form" element={<StaffTargetFormPage />} />
                  <Route path="staff/target" element={<StaffTargetPage />} />
                  <Route path="staff/add-target" element={<StaffTargetFormPage />} />
                  <Route path="stftarget.aspx" element={<StaffTargetPage />} />
                  <Route path="staff/rights/:id" element={<StaffAdminRightsPage />} />
                  <Route path="staff-rights/:id" element={<StaffAdminRightsPage />} />
                  <Route path="staff-rights" element={<StaffAdminRightsPage />} />
                  <Route path="memstfrights.aspx" element={<StaffAdminRightsPage />} />
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
                  <Route path="cleaning-log" element={<AdminCleaningPage />} />
                  <Route path="exercises" element={<AdminExerciseLibrary />} />
                  <Route path="exercise-library" element={<AdminExerciseLibrary />} />
                  <Route path="contact-support" element={<ContactSupportPage />} />
                  <Route path="member-support" element={<AdminSupportInboxPage />} />
                  <Route path="support-inbox" element={<AdminSupportInboxPage />} />
                  <Route path="services" element={<ServiceManagementPage />} />
                   <Route path="biometric" element={<BiometricManagementPage />} />
                   <Route path="biometric-management" element={<BiometricManagementPage />} />
                  <Route path="services/new" element={<AddServicePage />} />
                  <Route path="services/edit/:id" element={<AddServicePage />} />
                  <Route path="setup/services" element={<ServiceManagementPage />} />
                  <Route path="setup/services/new" element={<AddServicePage />} />
                  <Route path="setup/services/edit/:id" element={<AddServicePage />} />
                  <Route path="mail-invoice" element={<MailInvoicePage />} />
                  <Route path="reports/finance/mail-invoice" element={<MailInvoicePage />} />
                  <Route path="billmail.aspx" element={<MailInvoicePage />} />
                  <Route path="reports/daily-collection" element={<DailyCollectionReportPage />} />
                  <Route path="reports/finance/daily-collection" element={<DailyCollectionReportPage />} />
                  <Route path="daily-collection" element={<DailyCollectionReportPage />} />
                  <Route path="reports/sales/dsr-report" element={<DSRReportPage />} />
                  <Route path="reports/dsr-report" element={<DSRReportPage />} />
                  <Route path="reports/dsr" element={<DSRReportPage />} />
                  <Route path="dsr-report" element={<DSRReportPage />} />
                  <Route path="memdsrreport.aspx" element={<DSRReportPage />} />
                  <Route path="reports/sales/revenue" element={<RevenueReportPage />} />
                  <Route path="reports/revenue" element={<RevenueReportPage />} />
                  <Route path="revenue" element={<RevenueReportPage />} />
                  <Route path="cntrlrevgrwth.aspx" element={<RevenueReportPage />} />
                  <Route path="reports/membership-expiry" element={<MembershipExpiryReportPage />} />
                  <Route path="reports/client-management/membership-expiry" element={<MembershipExpiryReportPage />} />
                  <Route path="memshipandptrenewrpt.aspx" element={<MembershipExpiryReportPage />} />
                  <Route path="reports/pt-expiry" element={<PTExpiryReportPage />} />
                  <Route path="reports/client-management/pt-expiry" element={<PTExpiryReportPage />} />
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
                      <ProtectedRoute allowedPositions={['manager', 'receptionist']}>
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
