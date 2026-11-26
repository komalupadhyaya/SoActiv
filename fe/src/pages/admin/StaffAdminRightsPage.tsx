// pages/admin/StaffAdminRightsPage.tsx
import React, { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useStaff, Staff } from '../../hooks/useStaff';
import { useToast } from '../../contexts/ToastContext';
import axios from 'axios';

const baseApi = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const API_URL = baseApi.endsWith('/api/v1') ? baseApi : `${baseApi}/api/v1`;

const ADMIN_RIGHTS_OPTIONS = [
  'Master Admin',
  'Admin',
  'Finance',
  'Training',
  'Sales',
  'Client Management',
  'Customer Service',
  'Housekeeping',
];

const getEffectiveRoleFromStaff = (member: any): string => {
  if (member?.adminRights && typeof member.adminRights === 'string' && member.adminRights.trim()) {
    return member.adminRights;
  }
  const pos = (member?.position || member?.jobDesignation || '').toLowerCase();
  if (pos.includes('manager') || pos.includes('owner') || pos.includes('partner') || pos.includes('director')) return 'Admin';
  if (pos.includes('sales')) return 'Sales';
  if (pos.includes('clean') || pos.includes('house')) return 'Housekeeping';
  if (pos.includes('desk') || pos.includes('receptionist') || pos.includes('relationship')) return 'Customer Service';
  if (pos.includes('finance') || pos.includes('account')) return 'Finance';
  return 'Training';
};

// Preset defaults based on Admin Rights / Role
const getPresetPermissionsForRole = (roleName: string): Record<string, boolean> => {
  const role = (roleName || '').toLowerCase();
  const isMasterAdmin = role.includes('master');
  const isAdmin = role.includes('admin');
  const isTraining = role.includes('train');
  const isHousekeeping = role.includes('house') || role.includes('clean');

  // If Master Admin, enable everything
  if (isMasterAdmin) {
    return getAllPermissionsDefault(true);
  }

  // If Housekeeping role, disable everything by default
  if (isHousekeeping) {
    return getAllPermissionsDefault(false);
  }

  // If Training role (matches reference screenshot exactly)
  if (isTraining) {
    return {
      // Dashboard
      'Search': true,
      'Universal Search': false,
      'Summary': true,
      'Sales, Pending Payment and Payment Collected Display': false,
      'Payment mode summary': false,
      'Expense summary': false,
      'View only my follow-ups': true,
      'View all follow-ups': false,
      'Personal Training Leaderboard': false,
      'General Sales Leaderboard': false,

      // Sales
      'Add enquiry, manage enquiries, enquiry archive': true,
      'Convert Enquiry & Add member': true,
      'Import enquiries': false,
      'Print all enquiries': false,
      'Backdated enquiry': false,

      // Marketing & Communication
      'Send e-mail (Staff & Client)': false,
      'Send SMS(Staff & Client)': false,
      'Send Whatsapp(Staff & Client)': false,
      'Offers': false,
      'Reply to Customer review': false,
      'Receive trial notification SMS & WhatsApp': false,
      'Receive app feedback notification SMS & email': false,
      'Receive daily report SMS': false,
      'Receive daily, weekly & monthly report email': false,
      'New bill email': false,
      'New bill SMS & WhatsApp': false,
      'Support request email': false,

      // Clients
      'Manage all members list': false,
      'Manage my members list': true,
      'Manage my PT list': true,
      'Manage my general training list': true,
      'Manage groups': true,
      'Update client profile': true,
      'Change client mobile number': false,
      'Agreement signature editing': false,
      'Transfer memberships': false,
      'Upgrade memberships': false,
      'Freeze memberships': false,
      'Change start & end date': false,
      'Suspend memberships': false,
      'Add/reduce sessions': false,
      'Update Checkins': true,
      'Checkin Reversal': false,
      'Change staff name in PT check-ins': false,
      'Change sales rep and PT': false,
      'Add to transfer': false,
      'Interbranch Transfer': false,
      'Add support request': true,
      'Delete client support requests': false,
      'Delete fingerprint/face': true,
      'View/Manage Challenges': true,

      // Bookings
      'Manage Booking & Reservations': true,
      'Create classes': false,
      'Cancel classes': false,
      'Manage Staff Substitution': true,
      'Manage Class Settings': true,
      'Start Class': false,
      'Manage Bookings': false,
      'Create Events': false,
      'Activate/Deactivate Events': false,
      'Manage Turf Bookings': false,
      'Manage Turf Settings': false,

      // Staff
      'Manage Staff List': true,
      'Add/ Delete staff': false,
      'Change Status (Active/Inactive)': false,
      'Admin Rights': false,
      'Manage Staff Calendar': true,
      'Schedule & Reschedule Appointments': true,
      'Edit Appointments (Cancel, no show, completed)': true,
      'Update Staff Profile, Working Hour & Document Upload': false,
      'Change Password': false,
      'Forgot Password': true,
      'Bulk rep change': false,
      'Update Staff Target': false,
      'Multiple appointments': false,
      'Checkin SMS': false,
      'Checkout SMS': false,
      'Biometric Offline SMS': false,
      'Biometric Admin Lock/Unlock': false,
      'View Leave Entries': false,
      'Manage Leave Entries': false,

      // Bills
      'Generate Bills': true,
      'Cancel Bills': false,
      'Write Off': false,
      'Allow discounts': false,
      'Collect partial payment': true,
      'Raise invoice without payment': true,
      'Backdated billing': false,
      'Backdated freeze': false,
      'Membership Cancellation, Refund': false,
      'Deal override': false,
      'Generate Advance Payments': false,

      // Expenses
      'Add expenses': false,
      'Delete expenses': false,

      // Data
      'Export enquiries': false,
      'Export Member List': false,
      'Export trial details': false,
      'Export task details': false,
      'Export reports': false,
      'Export Bills': false,
      'Export attendance': false,
      'Delete enquiries, members and invoices': false,

      // Allow to be selected as staff
      'Enquiry': false,
      'Calls(enquiry,member)': false,
      'Appointment(enquiry,member)': true,
      'Sales rep': true,
      'Member manager': false,
      'General trainer': true,
      'Personal trainer': true,
      'Nutrition Counselling': true,
      'Group class': true,

      // Franchise
      'Add/Update Documents': false,
      'View Documents': false,

      // Report
      'Access control/Biometric': true,
      'Vaccination': false,
      'Report - Offers': false,
      'Lead source': false,
      'Referrals': false,
      'SMS delivery': false,
      'Daily sales (DSR)': false,
      'Revenue,Sales Accounting,Effectiv Sale': false,
      'Expected Revenue': false,
      'Revenue vs target': false,
      'Revenue month till date': false,
      'Service sale, service type': false,
      'Registration fee': false,
      'Upgrade and cross-sell (3 reports)': false,
      'Not interested': true,
      'PT Sales Report': false,
      'Corporate sales': false,
      'Turf/Venue Utilisation': false,
      'Trials (4 reports)': true,
      'Appointments': true,
      'Deleted Appointments': false,
      'View all Invoices': true,
      'Cancellation and refund (3 reports)': false,
      'Revenue realisation (4 reports)': false,
      'Revenue VS utilisation (2 reports)': false,
      'Collection,POS Payment, Payment Reconciliation': false,
      'Payment mode': false,
      'Advance Payment Received & Utilized': false,
      'Wallet': false,
      'Renewal vs attrition': false,
      'New clients': false,
      'Renewals': false,
      'Membership': false,
      'Memebship & PT expiry': true,
      'Members not called': true,
      'Irregular members': true,
      'Active/Inactive clients Summary(2 reports)': false,
      'Multiclub Clients & Multiclub Passport': true,
      'Archived Clients': false,
      'Freeze & Change Date': false,
      'Attendance heat map': false,
      'Service transfer': false,
      'Birthdays & Anniversaries': true,
      'Feedback (2 reports)': false,
      'Feedback mask personal details': false,
      'Client Attendance': true,
      'Data Hygiene/Additional Information': false,
      'Membership retention': false,
      'View Member checkins': true,
      'Attendance Register (Client)': true,
      'Support requests': false,
      'Referrers': false,
      'One-time purchasers': false,
      'Average lifetime value': false,
      'No Show and usage (2 reports)': false,
      'Class & Session utilisation': false,
      'Trial Utilisation': true,
      'Staff Substitution': false,
      'View & Update staff Checkins': false,
      'Staff Birthday & Anniversaries': true,
      'Attendance Register (Staff Report)': false,
      'Expenses (2 reports)': false,
      'Fitness Goal': true,
      'PT conversion': true,
      'PT retention': true,

      // Setup
      'View branch profile': false,
      'Edit branch profile': false,
      'Add, edit and delete services, offers and packages': false,
      'Form Customization': false,
      'Define Tax': false,
      'Bill Template and Report Format': false,
      'Club Agreement': false,
      'CRM App Access': true,
      'CRM App - Check-ins and Sessions management': true,
      'CRM App Dashboard View': false,
      'CRM App Promote': false,
      'Front Desk App Access': false,
      'Activate Payment Link': false,
      'Biometric management (staff & client)': true,
      'Buy insurance & report (staff & client)': false,
      'Manage lead sources': false,
      'Guest Pass/ Trial Pass': false,
      'Gallery': false,
      'SMS Templates': false,
      'E-Mail Templates': false,
      'Automated communication - Staff': false,
      'Automated communication - Clients': false,
      'Membership upgrade, cross-sell and transfer': false,
      'Appointment Type': false,
      'Feedback': false,
      'Check In Notification': false,
      'Support Request Type': false,
      'Bulk & Referral Extension': false,
      'IP Restriction': true,
      'Update attendance set-up': false,
      'Update Job Designation': false,
      'Expense template': false,
      'Expense budget': false,
      'Fitness Goal Type': false,
      'Integrations & Plugins': false,
      'Add listing': false,
    };
  }

  // Default for Admin or others
  return getAllPermissionsDefault(isAdmin);
};

const getInitialPermissionsForStaff = (staffMember: Staff | null): Record<string, boolean> => {
  if (!staffMember) return {};

  // If staff member already has saved custom permissions in DB, use them!
  if (staffMember.permissions && Object.keys(staffMember.permissions).length > 0) {
    return { ...staffMember.permissions };
  }

  const role = getEffectiveRoleFromStaff(staffMember);
  return getPresetPermissionsForRole(role);
};

const getAllPermissionsDefault = (defaultValue: boolean): Record<string, boolean> => {
  const defaults: Record<string, boolean> = {};
  ALL_PERMISSION_KEYS.forEach((k) => {
    defaults[k] = defaultValue;
  });
  return defaults;
};

const ALL_PERMISSION_KEYS = [
  // Dashboard
  'Search',
  'Universal Search',
  'Summary',
  'Sales, Pending Payment and Payment Collected Display',
  'Payment mode summary',
  'Expense summary',
  'View only my follow-ups',
  'View all follow-ups',
  'Personal Training Leaderboard',
  'General Sales Leaderboard',
  // Sales
  'Add enquiry, manage enquiries, enquiry archive',
  'Convert Enquiry & Add member',
  'Import enquiries',
  'Print all enquiries',
  'Backdated enquiry',
  // Marketing & Communication
  'Send e-mail (Staff & Client)',
  'Send SMS(Staff & Client)',
  'Send Whatsapp(Staff & Client)',
  'Offers',
  'Reply to Customer review',
  'Receive trial notification SMS & WhatsApp',
  'Receive app feedback notification SMS & email',
  'Receive daily report SMS',
  'Receive daily, weekly & monthly report email',
  'New bill email',
  'New bill SMS & WhatsApp',
  'Support request email',
  // Clients
  'Manage all members list',
  'Manage my members list',
  'Manage my PT list',
  'Manage my general training list',
  'Manage groups',
  'Update client profile',
  'Change client mobile number',
  'Agreement signature editing',
  'Transfer memberships',
  'Upgrade memberships',
  'Freeze memberships',
  'Change start & end date',
  'Suspend memberships',
  'Add/reduce sessions',
  'Update Checkins',
  'Checkin Reversal',
  'Change staff name in PT check-ins',
  'Change sales rep and PT',
  'Add to transfer',
  'Interbranch Transfer',
  'Add support request',
  'Delete client support requests',
  'Delete fingerprint/face',
  'View/Manage Challenges',
  // Bookings
  'Manage Booking & Reservations',
  'Create classes',
  'Cancel classes',
  'Manage Staff Substitution',
  'Manage Class Settings',
  'Start Class',
  'Manage Bookings',
  'Create Events',
  'Activate/Deactivate Events',
  'Manage Turf Bookings',
  'Manage Turf Settings',
  // Staff
  'Manage Staff List',
  'Add/ Delete staff',
  'Change Status (Active/Inactive)',
  'Admin Rights',
  'Manage Staff Calendar',
  'Schedule & Reschedule Appointments',
  'Edit Appointments (Cancel, no show, completed)',
  'Update Staff Profile, Working Hour & Document Upload',
  'Change Password',
  'Forgot Password',
  'Bulk rep change',
  'Update Staff Target',
  'Multiple appointments',
  'Checkin SMS',
  'Checkout SMS',
  'Biometric Offline SMS',
  'Biometric Admin Lock/Unlock',
  'View Leave Entries',
  'Manage Leave Entries',
  // Bills
  'Generate Bills',
  'Cancel Bills',
  'Write Off',
  'Allow discounts',
  'Collect partial payment',
  'Raise invoice without payment',
  'Backdated billing',
  'Backdated freeze',
  'Membership Cancellation, Refund',
  'Deal override',
  'Generate Advance Payments',
  // Expenses
  'Add expenses',
  'Delete expenses',
  // Data
  'Export enquiries',
  'Export Member List',
  'Export trial details',
  'Export task details',
  'Export reports',
  'Export Bills',
  'Export attendance',
  'Delete enquiries, members and invoices',
  // Allow to be selected as staff
  'Enquiry',
  'Calls(enquiry,member)',
  'Appointment(enquiry,member)',
  'Sales rep',
  'Member manager',
  'General trainer',
  'Personal trainer',
  'Nutrition Counselling',
  'Group class',
  // Franchise
  'Add/Update Documents',
  'View Documents',
  // Report
  'Access control/Biometric',
  'Vaccination',
  'Report - Offers',
  'Lead source',
  'Referrals',
  'SMS delivery',
  'Daily sales (DSR)',
  'Revenue,Sales Accounting,Effectiv Sale',
  'Expected Revenue',
  'Revenue vs target',
  'Revenue month till date',
  'Service sale, service type',
  'Registration fee',
  'Upgrade and cross-sell (3 reports)',
  'Not interested',
  'PT Sales Report',
  'Corporate sales',
  'Turf/Venue Utilisation',
  'Trials (4 reports)',
  'Appointments',
  'Deleted Appointments',
  'View all Invoices',
  'Cancellation and refund (3 reports)',
  'Revenue realisation (4 reports)',
  'Revenue VS utilisation (2 reports)',
  'Collection,POS Payment, Payment Reconciliation',
  'Payment mode',
  'Advance Payment Received & Utilized',
  'Wallet',
  'Renewal vs attrition',
  'New clients',
  'Renewals',
  'Membership',
  'Memebship & PT expiry',
  'Members not called',
  'Irregular members',
  'Active/Inactive clients Summary(2 reports)',
  'Multiclub Clients & Multiclub Passport',
  'Archived Clients',
  'Freeze & Change Date',
  'Attendance heat map',
  'Service transfer',
  'Birthdays & Anniversaries',
  'Feedback (2 reports)',
  'Feedback mask personal details',
  'Client Attendance',
  'Data Hygiene/Additional Information',
  'Membership retention',
  'View Member checkins',
  'Attendance Register (Client)',
  'Support requests',
  'Referrers',
  'One-time purchasers',
  'Average lifetime value',
  'No Show and usage (2 reports)',
  'Class & Session utilisation',
  'Trial Utilisation',
  'Staff Substitution',
  'View & Update staff Checkins',
  'Staff Birthday & Anniversaries',
  'Attendance Register (Staff Report)',
  'Expenses (2 reports)',
  'Fitness Goal',
  'PT conversion',
  'PT retention',
  // Setup
  'View branch profile',
  'Edit branch profile',
  'Add, edit and delete services, offers and packages',
  'Form Customization',
  'Define Tax',
  'Bill Template and Report Format',
  'Club Agreement',
  'CRM App Access',
  'CRM App - Check-ins and Sessions management',
  'CRM App Dashboard View',
  'CRM App Promote',
  'Front Desk App Access',
  'Activate Payment Link',
  'Biometric management (staff & client)',
  'Buy insurance & report (staff & client)',
  'Manage lead sources',
  'Guest Pass/ Trial Pass',
  'Gallery',
  'SMS Templates',
  'E-Mail Templates',
  'Automated communication - Staff',
  'Automated communication - Clients',
  'Membership upgrade, cross-sell and transfer',
  'Appointment Type',
  'Feedback',
  'Check In Notification',
  'Support Request Type',
  'Bulk & Referral Extension',
  'IP Restriction',
  'Update attendance set-up',
  'Update Job Designation',
  'Expense template',
  'Expense budget',
  'Fitness Goal Type',
  'Integrations & Plugins',
  'Add listing',
];

export const StaffAdminRightsPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const staffId = id || searchParams.get('stfid') || searchParams.get('staffId');

  const { fetchAllStaff, staff, updateStaff } = useStaff();
  const { addToast } = useToast();

  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
  const [adminRightsRole, setAdminRightsRole] = useState<string>('Training');
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    fetchAllStaff();
  }, [fetchAllStaff]);

  useEffect(() => {
    if (staffId && staff.length > 0) {
      const found = staff.find((s) => s._id === staffId || (s as any).staffId === staffId);
      if (found) {
        setCurrentStaff(found);
        setAdminRightsRole(getEffectiveRoleFromStaff(found));
        setPermissions(getInitialPermissionsForStaff(found));
        setLoading(false);
      } else {
        axios
          .get(`${API_URL}/staff/${staffId}`, { withCredentials: true })
          .then((res) => {
            if (res.data.success && res.data.data) {
              setCurrentStaff(res.data.data);
              setAdminRightsRole(getEffectiveRoleFromStaff(res.data.data));
              setPermissions(getInitialPermissionsForStaff(res.data.data));
            }
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      }
    }
  }, [staffId, staff]);

  const handleRoleChange = async (newRole: string) => {
    setAdminRightsRole(newRole);
    const preset = getPresetPermissionsForRole(newRole);
    setPermissions(preset);

    if (currentStaff?._id) {
      try {
        await updateStaff(currentStaff._id, {
          adminRights: newRole,
          permissions: preset,
        } as any);
        addToast(`Admin Rights updated to ${newRole}`, 'success');
      } catch (err: any) {
        addToast(err?.message || 'Failed to update admin rights', 'error');
      }
    }
  };

  const handleToggle = async (key: string) => {
    const nextVal = !permissions[key];
    const updatedPermissions = {
      ...permissions,
      [key]: nextVal,
    };
    setPermissions(updatedPermissions);

    // Persist optimistically to backend
    if (currentStaff?._id) {
      try {
        await updateStaff(currentStaff._id, {
          permissions: updatedPermissions,
        } as any);
      } catch (err) {
        console.error('Failed to update permission in background:', err);
      }
    }
  };

  const handleSaveAll = async () => {
    if (!currentStaff?._id) return;
    setIsSaving(true);
    try {
      await updateStaff(currentStaff._id, {
        adminRights: adminRightsRole,
        permissions,
      } as any);
      addToast('Permissions updated successfully', 'success');
    } catch (err: any) {
      addToast(err?.message || 'Failed to save permissions', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const defaults = getPresetPermissionsForRole(adminRightsRole);
    setPermissions(defaults);
    addToast(`Reset to default permissions for ${adminRightsRole}`, 'info');
  };

  const renderToggle = (key: string, label?: string) => {
    const isChecked = !!permissions[key];
    return (
      <div key={key} className="flex items-center justify-between py-1 px-1">
        <span className="text-xs text-gray-800 dark:text-gray-200 font-normal pr-2 leading-snug">
          {label || key}
        </span>
        <button
          type="button"
          onClick={() => handleToggle(key)}
          className={`w-9 h-5 rounded-full p-[2px] flex items-center transition-colors cursor-pointer shrink-0 ${
            isChecked ? 'bg-[#00c853]' : 'bg-[#fbc02d]'
          }`}
          title={isChecked ? 'Enabled (Click to disable)' : 'Disabled (Click to enable)'}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-150 ${
              isChecked ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-gray-900 p-6 flex justify-center items-center">
        <p className="text-xs text-gray-500">Loading staff admin rights...</p>
      </div>
    );
  }

  const staffDisplayName = currentStaff?.fullName || 'Staff Member';

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4 sm:p-6 space-y-6 font-sans text-xs">
      {/* 1. Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-2">
          <Link to="/admin/dashboard" className="hover:text-gray-700 dark:hover:text-gray-200">
            Home
          </Link>
          <span>/</span>
          <Link to="/admin/staff" className="hover:text-gray-700 dark:hover:text-gray-200">
            Staff
          </Link>
          <span>/</span>
          <span className="text-[#ff5e28] font-semibold">
            Admin Rights - {staffDisplayName}
          </span>
        </div>
      </div>

      {/* 2. Admin Rights Role Selector & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 dark:bg-gray-850 p-3.5 rounded-md border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2.5">
          <label className="font-semibold text-xs text-gray-800 dark:text-gray-200">
            Admin Rights Role:
          </label>
          <select
            value={adminRightsRole}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer min-w-[170px]"
          >
            {ADMIN_RIGHTS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-gray-500 dark:text-gray-400 hidden sm:inline">
            (Changing role automatically applies default permission presets)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-5 py-1.5 bg-[#ff5e28] hover:bg-[#e04f1d] text-white font-semibold text-xs rounded shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="px-4 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold text-xs rounded transition-colors cursor-pointer disabled:opacity-50"
          >
            Reset
          </button>
        </div>
      </div>

      {/* 2. 3-Column Permission Grid with Equal Box Height per Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* ============================================================ */}
        {/* ROW 1: Dashboard, Sales, Marketing & Communication           */}
        {/* ============================================================ */}

        {/* 1. Dashboard (Col 1, Row 1) */}
        <fieldset className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 pt-1 h-full flex flex-col justify-start">
          <legend className="font-bold text-sm text-gray-900 dark:text-white px-2 ml-2">
            Dashboard
          </legend>

          <div className="space-y-1">
            <div className="text-center font-bold text-gray-900 dark:text-white text-xs py-1.5">
              Search
            </div>
            {renderToggle('Search')}
            {renderToggle('Universal Search')}

            <div className="text-center font-bold text-gray-900 dark:text-white text-xs py-1.5 pt-2">
              Snapshot
            </div>
            {renderToggle('Summary')}
            {renderToggle('Sales, Pending Payment and Payment Collected Display')}
            {renderToggle('Payment mode summary')}
            {renderToggle('Expense summary')}

            <div className="text-center font-bold text-gray-900 dark:text-white text-xs py-1.5 pt-2">
              Follow-ups
            </div>
            {renderToggle('View only my follow-ups')}
            {renderToggle('View all follow-ups')}

            <div className="text-center font-bold text-gray-900 dark:text-white text-xs py-1.5 pt-2">
              Leaderboards
            </div>
            {renderToggle('Personal Training Leaderboard')}
            {renderToggle('General Sales Leaderboard')}
          </div>
        </fieldset>

        {/* 2. Sales (Col 2, Row 1) */}
        <fieldset className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 pt-1 h-full flex flex-col justify-start">
          <legend className="font-bold text-sm text-gray-900 dark:text-white px-2 ml-2">
            Sales
          </legend>
          <div className="space-y-1 pt-1">
            {renderToggle('Add enquiry, manage enquiries, enquiry archive')}
            {renderToggle('Convert Enquiry & Add member')}
            {renderToggle('Import enquiries')}
            {renderToggle('Print all enquiries')}
            {renderToggle('Backdated enquiry')}
          </div>
        </fieldset>

        {/* 3. Marketing & Communication (Col 3, Row 1) */}
        <fieldset className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 pt-1 h-full flex flex-col justify-start">
          <legend className="font-bold text-sm text-gray-900 dark:text-white px-2 ml-2">
            Marketing & Communication
          </legend>
          <div className="space-y-1 pt-1">
            {renderToggle('Send e-mail (Staff & Client)')}
            {renderToggle('Send SMS(Staff & Client)')}
            {renderToggle('Send Whatsapp(Staff & Client)')}
            {renderToggle('Offers')}
            {renderToggle('Reply to Customer review')}
            {renderToggle('Receive trial notification SMS & WhatsApp')}
            {renderToggle('Receive app feedback notification SMS & email')}
            {renderToggle('Receive daily report SMS')}
            {renderToggle('Receive daily, weekly & monthly report email')}
            {renderToggle('New bill email')}
            {renderToggle('New bill SMS & WhatsApp')}
            {renderToggle('Support request email')}
          </div>
        </fieldset>

        {/* ============================================================ */}
        {/* ROW 2: Clients, Bookings, Staff                              */}
        {/* ============================================================ */}

        {/* 4. Clients (Col 1, Row 2) */}
        <fieldset className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 pt-1 h-full flex flex-col justify-start">
          <legend className="font-bold text-sm text-gray-900 dark:text-white px-2 ml-2">
            Clients
          </legend>

          <div className="space-y-1">
            <div className="text-center font-bold text-gray-900 dark:text-white text-xs py-1.5">
              Manage Lists
            </div>
            {renderToggle('Manage all members list')}
            {renderToggle('Manage my members list')}
            {renderToggle('Manage my PT list')}
            {renderToggle('Manage my general training list')}
            {renderToggle('Manage groups')}

            <div className="text-center font-bold text-gray-900 dark:text-white text-xs py-1.5 pt-2">
              Member Profile
            </div>
            {renderToggle('Update client profile')}
            {renderToggle('Change client mobile number')}
            {renderToggle('Agreement signature editing')}

            <div className="text-center font-bold text-gray-900 dark:text-white text-xs py-1.5 pt-2">
              Update Memberships
            </div>
            {renderToggle('Transfer memberships')}
            {renderToggle('Upgrade memberships')}
            {renderToggle('Freeze memberships')}
            {renderToggle('Change start & end date')}
            {renderToggle('Suspend memberships')}
            {renderToggle('Add/reduce sessions')}

            <div className="text-center font-bold text-gray-900 dark:text-white text-xs py-1.5 pt-2">
              Operations
            </div>
            {renderToggle('Update Checkins')}
            {renderToggle('Checkin Reversal')}
            {renderToggle('Change staff name in PT check-ins')}
            {renderToggle('Change sales rep and PT')}
            {renderToggle('Add to transfer')}
            {renderToggle('Interbranch Transfer')}
            {renderToggle('Add support request')}
            {renderToggle('Delete client support requests')}
            {renderToggle('Delete fingerprint/face')}

            <div className="text-center font-bold text-gray-900 dark:text-white text-xs py-1.5 pt-2">
              Challenge
            </div>
            {renderToggle('View/Manage Challenges')}
          </div>
        </fieldset>

        {/* 5. Bookings (Col 2, Row 2) */}
        <fieldset className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 pt-1 h-full flex flex-col justify-start">
          <legend className="font-bold text-sm text-gray-900 dark:text-white px-2 ml-2">
            Bookings
          </legend>

          <div className="space-y-1">
            <div className="text-center font-bold text-gray-900 dark:text-white text-xs py-1.5">
              Classes & Sessions
            </div>
            {renderToggle('Manage Booking & Reservations')}
            {renderToggle('Create classes')}
            {renderToggle('Cancel classes')}
            {renderToggle('Manage Staff Substitution')}
            {renderToggle('Manage Class Settings')}
            {renderToggle('Start Class')}

            <div className="text-center font-bold text-gray-900 dark:text-white text-xs py-1.5 pt-2">
              Events
            </div>
            {renderToggle('Manage Bookings')}
            {renderToggle('Create Events')}
            {renderToggle('Activate/Deactivate Events')}

            <div className="text-center font-bold text-gray-900 dark:text-white text-xs py-1.5 pt-2">
              Turfs & Venues
            </div>
            {renderToggle('Manage Turf Bookings')}
            {renderToggle('Manage Turf Settings')}
          </div>
        </fieldset>

        {/* 6. Staff (Col 3, Row 2) */}
        <fieldset className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 pt-1 h-full flex flex-col justify-start">
          <legend className="font-bold text-sm text-gray-900 dark:text-white px-2 ml-2">
            Staff
          </legend>
          <div className="space-y-1 pt-1">
            {renderToggle('Manage Staff List')}
            {renderToggle('Add/ Delete staff')}
            {renderToggle('Change Status (Active/Inactive)')}
            {renderToggle('Admin Rights')}
            {renderToggle('Manage Staff Calendar')}
            {renderToggle('Schedule & Reschedule Appointments')}
            {renderToggle('Edit Appointments (Cancel, no show, completed)')}
            {renderToggle('Update Staff Profile, Working Hour & Document Upload')}
            {renderToggle('Change Password')}
            {renderToggle('Forgot Password')}
            {renderToggle('Bulk rep change')}
            {renderToggle('Update Staff Target')}
            {renderToggle('Multiple appointments')}
            {renderToggle('Checkin SMS')}
            {renderToggle('Checkout SMS')}
            {renderToggle('Biometric Offline SMS')}
            {renderToggle('Biometric Admin Lock/Unlock')}
            {renderToggle('View Leave Entries')}
            {renderToggle('Manage Leave Entries')}
          </div>
        </fieldset>

        {/* ============================================================ */}
        {/* ROW 3: Bills, Expenses, Data                                 */}
        {/* ============================================================ */}

        {/* 7. Bills (Col 1, Row 3) */}
        <fieldset className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 pt-1 h-full flex flex-col justify-start">
          <legend className="font-bold text-sm text-gray-900 dark:text-white px-2 ml-2">
            Bills
          </legend>
          <div className="space-y-1 pt-1">
            {renderToggle('Generate Bills')}
            {renderToggle('Cancel Bills')}
            {renderToggle('Write Off')}
            {renderToggle('Allow discounts')}
            {renderToggle('Collect partial payment')}
            {renderToggle('Raise invoice without payment')}
            {renderToggle('Backdated billing')}
            {renderToggle('Backdated freeze')}
            {renderToggle('Membership Cancellation, Refund')}
            {renderToggle('Deal override')}
            {renderToggle('Generate Advance Payments')}
          </div>
        </fieldset>

        {/* 8. Expenses (Col 2, Row 3) */}
        <fieldset className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 pt-1 h-full flex flex-col justify-start">
          <legend className="font-bold text-sm text-gray-900 dark:text-white px-2 ml-2">
            Expenses
          </legend>
          <div className="space-y-1 pt-1">
            {renderToggle('Add expenses')}
            {renderToggle('Delete expenses')}
          </div>
        </fieldset>

        {/* 9. Data (Col 3, Row 3) */}
        <fieldset className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 pt-1 h-full flex flex-col justify-start">
          <legend className="font-bold text-sm text-gray-900 dark:text-white px-2 ml-2">
            Data
          </legend>

          <div className="space-y-1">
            <div className="text-center font-bold text-gray-900 dark:text-white text-xs py-1.5">
              Export
            </div>
            {renderToggle('Export enquiries')}
            {renderToggle('Export Member List')}
            {renderToggle('Export trial details')}
            {renderToggle('Export task details')}
            {renderToggle('Export reports')}
            {renderToggle('Export Bills')}
            {renderToggle('Export attendance')}

            <div className="text-center font-bold text-gray-900 dark:text-white text-xs py-1.5 pt-2">
              Delete
            </div>
            {renderToggle('Delete enquiries, members and invoices')}
          </div>
        </fieldset>

        {/* ============================================================ */}
        {/* ROW 4: Allow to be selected as staff, Report, Setup          */}
        {/* ============================================================ */}

        {/* 10. Allow to be selected as staff (Col 1, Row 4) */}
        <fieldset className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 pt-1 h-full flex flex-col justify-start">
          <legend className="font-bold text-sm text-gray-900 dark:text-white px-2 ml-2">
            Allow to be selected as staff
          </legend>
          <div className="space-y-1 pt-1">
            {renderToggle('Enquiry')}
            {renderToggle('Calls(enquiry,member)')}
            {renderToggle('Appointment(enquiry,member)')}
            {renderToggle('Sales rep')}
            {renderToggle('Member manager')}
            {renderToggle('General trainer')}
            {renderToggle('Personal trainer')}
            {renderToggle('Nutrition Counselling')}
            {renderToggle('Group class')}
          </div>
        </fieldset>

        {/* 11. Report (Col 2, Row 4) */}
        <fieldset className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 pt-1 h-full flex flex-col justify-start">
          <legend className="font-bold text-sm text-gray-900 dark:text-white px-2 ml-2">
            Report
          </legend>

          <div className="space-y-1">
            {/* General */}
            <div className="text-center font-bold text-gray-900 dark:text-white text-xs py-1.5">
              General
            </div>
            {renderToggle('Access control/Biometric')}
            {renderToggle('Vaccination')}

            {/* Marketing */}
            <div className="text-center font-bold text-gray-900 dark:text-white text-xs py-1.5 pt-2">
              Marketing
            </div>
            {renderToggle('Report - Offers', 'Offers')}
            {renderToggle('Lead source')}
            {renderToggle('Referrals')}
            {renderToggle('SMS delivery')}

            {/* Sales */}
            <div className="text-center font-bold text-gray-900 dark:text-white text-xs py-1.5 pt-2">
              Sales
            </div>
            {renderToggle('Daily sales (DSR)')}
            {renderToggle('Revenue,Sales Accounting,Effectiv Sale')}
            {renderToggle('Expected Revenue')}
            {renderToggle('Revenue vs target')}
            {renderToggle('Revenue month till date')}
            {renderToggle('Service sale, service type')}
            {renderToggle('Registration fee')}
            {renderToggle('Upgrade and cross-sell (3 reports)')}
            {renderToggle('Not interested')}
            {renderToggle('PT Sales Report')}
            {renderToggle('Corporate sales')}
            {renderToggle('Turf/Venue Utilisation')}

            {/* Appointments & Trials */}
            <div className="text-center font-bold text-gray-900 dark:text-white text-xs py-1.5 pt-2">
              Appointments & Trials
            </div>
            {renderToggle('Trials (4 reports)')}
            {renderToggle('Appointments')}
            {renderToggle('Deleted Appointments')}

            {/* Finance */}
            <div className="text-center font-bold text-gray-900 dark:text-white text-xs py-1.5 pt-2">
              Finance
            </div>
            {renderToggle('View all Invoices')}
            {renderToggle('Cancellation and refund (3 reports)')}
            {renderToggle('Revenue realisation (4 reports)')}
            {renderToggle('Revenue VS utilisation (2 reports)')}
            {renderToggle('Collection,POS Payment, Payment Reconciliation')}
            {renderToggle('Payment mode')}
            {renderToggle('Advance Payment Received & Utilized')}
            {renderToggle('Wallet')}

            {/* Client Management */}
            <div className="text-center font-bold text-gray-900 dark:text-white text-xs py-1.5 pt-2">
              Client Management
            </div>
            {renderToggle('Renewal vs attrition')}
            {renderToggle('New clients')}
            {renderToggle('Renewals')}
            {renderToggle('Membership')}
            {renderToggle('Memebship & PT expiry')}
            {renderToggle('Members not called')}
            {renderToggle('Irregular members')}
            {renderToggle('Active/Inactive clients Summary(2 reports)')}
            {renderToggle('Multiclub Clients & Multiclub Passport')}
            {renderToggle('Archived Clients')}
            {renderToggle('Freeze & Change Date')}
            {renderToggle('Attendance heat map')}
            {renderToggle('Service transfer')}
            {renderToggle('Birthdays & Anniversaries')}
            {renderToggle('Feedback (2 reports)')}
            {renderToggle('Feedback mask personal details')}
            {renderToggle('Client Attendance')}
            {renderToggle('Data Hygiene/Additional Information')}
            {renderToggle('Membership retention')}
            {renderToggle('View Member checkins')}
            {renderToggle('Attendance Register (Client)', 'Attendance Register')}
            {renderToggle('Support requests')}
            {renderToggle('Referrers')}
            {renderToggle('One-time purchasers')}
            {renderToggle('Average lifetime value')}

            {/* Staff */}
            <div className="text-center font-bold text-gray-900 dark:text-white text-xs py-1.5 pt-2">
              Staff
            </div>
            {renderToggle('No Show and usage (2 reports)')}
            {renderToggle('Class & Session utilisation')}
            {renderToggle('Trial Utilisation')}
            {renderToggle('Staff Substitution')}
            {renderToggle('View & Update staff Checkins')}
            {renderToggle('Staff Birthday & Anniversaries')}
            {renderToggle('Attendance Register (Staff Report)', 'Attendance Register')}

            {/* Expenses */}
            <div className="text-center font-bold text-gray-900 dark:text-white text-xs py-1.5 pt-2">
              Expenses
            </div>
            {renderToggle('Expenses (2 reports)')}

            {/* Training */}
            <div className="text-center font-bold text-gray-900 dark:text-white text-xs py-1.5 pt-2">
              Training
            </div>
            {renderToggle('Fitness Goal')}
            {renderToggle('PT conversion')}
            {renderToggle('PT retention')}
          </div>
        </fieldset>

        {/* 12. Setup (Col 3, Row 4) */}
        <fieldset className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 pt-1 h-full flex flex-col justify-start">
          <legend className="font-bold text-sm text-gray-900 dark:text-white px-2 ml-2">
            Setup
          </legend>

          <div className="space-y-1">
            {/* General */}
            <div className="text-center font-bold text-gray-900 dark:text-white text-xs py-1.5">
              General
            </div>
            {renderToggle('View branch profile')}
            {renderToggle('Edit branch profile')}
            {renderToggle('Add, edit and delete services, offers and packages')}
            {renderToggle('Form Customization')}
            {renderToggle('Define Tax')}
            {renderToggle('Bill Template and Report Format')}
            {renderToggle('Club Agreement')}
            {renderToggle('CRM App Access')}
            {renderToggle('CRM App - Check-ins and Sessions management')}
            {renderToggle('CRM App Dashboard View')}
            {renderToggle('CRM App Promote')}
            {renderToggle('Front Desk App Access')}
            {renderToggle('Activate Payment Link')}
            {renderToggle('Biometric management (staff & client)')}
            {renderToggle('Buy insurance & report (staff & client)')}

            {/* Marketing */}
            <div className="text-center font-bold text-gray-900 dark:text-white text-xs py-1.5 pt-2">
              Marketing
            </div>
            {renderToggle('Manage lead sources')}
            {renderToggle('Guest Pass/ Trial Pass')}
            {renderToggle('Gallery')}
            {renderToggle('SMS Templates')}
            {renderToggle('E-Mail Templates')}
            {renderToggle('Automated communication - Staff')}
            {renderToggle('Automated communication - Clients')}

            {/* Client Management */}
            <div className="text-center font-bold text-gray-900 dark:text-white text-xs py-1.5 pt-2">
              Client Management
            </div>
            {renderToggle('Membership upgrade, cross-sell and transfer')}
            {renderToggle('Appointment Type')}
            {renderToggle('Feedback')}
            {renderToggle('Check In Notification')}
            {renderToggle('Support Request Type')}
            {renderToggle('Bulk & Referral Extension')}

            {/* Staff Management */}
            <div className="text-center font-bold text-gray-900 dark:text-white text-xs py-1.5 pt-2">
              Staff Management
            </div>
            {renderToggle('IP Restriction')}
            {renderToggle('Update attendance set-up')}
            {renderToggle('Update Job Designation')}

            {/* Expenses */}
            <div className="text-center font-bold text-gray-900 dark:text-white text-xs py-1.5 pt-2">
              Expenses
            </div>
            {renderToggle('Expense template')}
            {renderToggle('Expense budget')}

            {/* Training */}
            <div className="text-center font-bold text-gray-900 dark:text-white text-xs py-1.5 pt-2">
              Training
            </div>
            {renderToggle('Fitness Goal Type')}

            {/* Integration & Plugins */}
            <div className="text-center font-bold text-gray-900 dark:text-white text-xs py-1.5 pt-2">
              Integration & Plugins
            </div>
            {renderToggle('Integrations & Plugins')}

            {/* Connect */}
            <div className="text-center font-bold text-gray-900 dark:text-white text-xs py-1.5 pt-2">
              Connect
            </div>
            {renderToggle('Add listing')}
          </div>
        </fieldset>

        {/* ============================================================ */}
        {/* ROW 5: Franchise + Action Buttons                            */}
        {/* ============================================================ */}

        {/* 13. Franchise (Col 1, Row 5) */}
        <div className="space-y-4 h-full flex flex-col justify-start">
          <fieldset className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 pt-1">
            <legend className="font-bold text-sm text-gray-900 dark:text-white px-2 ml-2">
              Franchise
            </legend>
            <div className="space-y-1 pt-1">
              {renderToggle('Add/Update Documents')}
              {renderToggle('View Documents')}
            </div>
          </fieldset>

          {/* Bottom Action Buttons (Save & Reset) */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-8 py-2 bg-[#ff5e28] hover:bg-[#e04f1d] text-white font-semibold text-xs rounded-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving}
              className="px-8 py-2 bg-[#ff5e28] hover:bg-[#e04f1d] text-white font-semibold text-xs rounded-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Empty cells for row 5 alignment on 3-column grid */}
        <div className="hidden lg:block"></div>
        <div className="hidden lg:block"></div>
      </div>
    </div>
  );
};

export default StaffAdminRightsPage;
