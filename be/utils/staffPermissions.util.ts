// utils/staffPermissions.util.ts

import { Types } from 'mongoose';
import { Staff, type IStaff } from '../models/staff.model';

/**
 * Get staff list based on user role and position
 * Admin: sees all staff they created (createdBy)
 * Manager: sees all staff created by same admin
 * Others: see only themselves
 */
export const getVisibleStaffIds = async (
    userId: Types.ObjectId,
    userRole: string,
    userPosition?: string
): Promise<Types.ObjectId[]> => {
    let staffList: IStaff[] = [];

    if (userRole === 'admin') {
        // Admin sees all staff they created
        staffList = await Staff.find({
            createdBy: userId,
            status: 'active',
        }).select('_id');
    } else if (userRole === 'staff' && userPosition === 'manager') {
        // Manager sees all staff created by the same admin
        const currentStaff = await Staff.findOne({ userId });
        if (currentStaff && currentStaff.createdBy) {
            staffList = await Staff.find({
                createdBy: currentStaff.createdBy,
                status: 'active',
            }).select('_id');
        } else {
            staffList = [];
        }
    } else {
        // Trainer/Sales/Cleaner only see themselves
        staffList = await Staff.find({
            userId,
            status: 'active',
        }).select('_id');
    }

    return staffList.map((s) => s._id);
};

/**
 * Get full staff list with details based on user role and position
 */
export const getVisibleStaff = async (
    userId: Types.ObjectId,
    userRole: string,
    userPosition?: string,
    selectFields: string = 'fullName position email contactNumber _id'
) => {
    if (userRole === 'admin') {
        return await Staff.find({
            createdBy: userId,
            status: 'active',
        }).select(selectFields);
    } else if (userRole === 'staff' && userPosition === 'manager') {
        const currentStaff = await Staff.findOne({ userId });
        if (currentStaff && currentStaff.createdBy) {
            return await Staff.find({
                createdBy: currentStaff.createdBy,
                status: 'active',
            }).select(selectFields);
        }
        return [];
    } else {
        return await Staff.find({
            userId,
            status: 'active',
        }).select(selectFields);
    }
};
