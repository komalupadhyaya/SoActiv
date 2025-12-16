
import { useAuth } from '../contexts/AuthContext';

export type StaffPosition = 'manager' | 'trainer' | 'sales' | 'receptionist' | 'cleaner' | 'admin' | 'superadmin' | 'unknown';

export const STAFF_PERMISSIONS = {
    // Can view the Staff Management page (list of staff)
    CAN_VIEW_STAFF: ['admin', 'manager'],
    // Can create/edit/delete staff
    CAN_MANAGE_STAFF: ['admin'],

    // Can view Members list
    CAN_VIEW_MEMBERS: ['admin', 'manager', 'receptionist', 'trainer'],
    // Note: Trainer usually sees only assigned, but might need list view filtered. 
    // We'll handle data filtering in backend/hooks, here is mostly page access.

    // Can create/edit/delete members
    CAN_MANAGE_MEMBERS: ['admin'], // Receptionist can check-in (attendance) but not CRUD members usually? Prompt says: "No CRUD members" for Rep due to "No CRUD members".

    // Can view Gym Schedule/Calendar
    CAN_VIEW_SCHEDULE: ['admin', 'manager', 'receptionist', 'trainer'],
    // Can edit Schedule
    CAN_MANAGE_SCHEDULE: ['admin', 'manager'], // Manager help admin manage tasks, maybe schedule too? Prompt says Manager: "View gym schedules". Logic implies Admin primarily.

    // Can view Sales/Enquiries/Leads
    CAN_VIEW_LEADS: ['admin', 'sales'],

    // Can view Finance/Reports
    CAN_VIEW_FINANCE: ['admin'],

    // Can view Tasks
    CAN_VIEW_TASKS: ['admin', 'manager', 'sales', 'cleaner'],

    // Can Mark Attendance (General - for others)
    CAN_MARK_ATTENDANCE: ['admin', 'manager', 'receptionist'],
} as const;

export const useStaffPermissions = () => {
    const { user } = useAuth();

    const position = (user?.position || user?.role || 'unknown') as StaffPosition;
    const isAdmin = position === 'admin' || position === 'superadmin';

    const checkPermission = (allowedPositions: readonly string[]) => {
        if (!user) return false;
        if (isAdmin) return true;
        return allowedPositions.includes(position);
    };

    return {
        position,
        isAdmin,
        // Permissions
        canViewStaff: checkPermission(STAFF_PERMISSIONS.CAN_VIEW_STAFF),
        canManageStaff: checkPermission(STAFF_PERMISSIONS.CAN_MANAGE_STAFF),

        canViewMembers: checkPermission(STAFF_PERMISSIONS.CAN_VIEW_MEMBERS),
        canManageMembers: checkPermission(STAFF_PERMISSIONS.CAN_MANAGE_MEMBERS),

        canViewSchedule: checkPermission(STAFF_PERMISSIONS.CAN_VIEW_SCHEDULE),
        canManageSchedule: checkPermission(STAFF_PERMISSIONS.CAN_MANAGE_SCHEDULE),

        canViewLeads: checkPermission(STAFF_PERMISSIONS.CAN_VIEW_LEADS),

        canViewFinance: checkPermission(STAFF_PERMISSIONS.CAN_VIEW_FINANCE),

        canViewTasks: checkPermission(STAFF_PERMISSIONS.CAN_VIEW_TASKS),

        canMarkAttendance: checkPermission(STAFF_PERMISSIONS.CAN_MARK_ATTENDANCE),

        // Specific Helpers
        isManager: position === 'manager',
        isTrainer: position === 'trainer',
        isSales: position === 'sales',
        isReceptionist: position === 'receptionist',
        isCleaner: position === 'cleaner',
    };
};
