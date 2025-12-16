import type { Request, Response, NextFunction } from 'express';
import { PTPlan } from '../models/ptPlan.model';
import { PTAssignment } from '../models/ptAssignment.model';
import ApiError from '../lib/ApiError';
import { HttpStatusCode } from '../lib/const';

/**
 * ==============================================================================
 * PT PLAN CONTROLLERS (Admin Only)
 * ==============================================================================
 */

/**
 * Create a new PT Plan
 */
export const createPTPlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, totalSessions, validityDays, price, description } = req.body;
        const user = (req as any).user;

        // Ensure user is admin (Double check, though middleware should handle this)
        if (user.role !== 'admin' && user.role !== 'superadmin') {
            throw new ApiError(HttpStatusCode.FORBIDDEN, 'Only Admins can create PT Plans');
        }

        const plan = await PTPlan.create({
            name,
            totalSessions,
            validityDays,
            price,
            description,
            adminId: user.adminId || user.id || user._id, // Prioritize adminId (Owner) if set (for Staff), else use self (Admin)
            createdBy: user.id || user._id
        });

        res.status(201).json({ success: true, data: plan, message: 'PT Plan created successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all PT Plans for the logged-in admin
 * Managers/Sales can also view active plans to sell them
 */
export const getPTPlans = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user;
        const adminId = user.adminId || user.id || user._id; // Prioritize adminId (Owner) if set

        const query: any = { adminId };

        // Requirement: Admin creates -> Manager sees it.
        // Both share same adminId, so this query works.
        // Trainer sees plans? Currently yes if they have access.

        if (user.role === 'staff') {
            query.isActive = true;
        }

        const plans = await PTPlan.find(query).sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: plans });
    } catch (error) {
        next(error);
    }
};

/**
 * Update PT Plan
 * Admin only
 */
export const updatePTPlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Prevent changing adminId
        delete updates.adminId;
        delete updates.createdAt;

        const plan = await PTPlan.findByIdAndUpdate(id, updates, { new: true });

        if (!plan) {
            throw new ApiError(HttpStatusCode.NOT_FOUND, 'PT Plan not found');
        }

        res.status(200).json({ success: true, data: plan, message: 'PT Plan updated' });
    } catch (error) {
        next(error);
    }
};

/**
 * Toggle Deactivate/Activate Plan
 */
export const togglePTPlanStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const plan = await PTPlan.findById(id);

        if (!plan) {
            throw new ApiError(HttpStatusCode.NOT_FOUND, 'PT Plan not found');
        }

        plan.isActive = !plan.isActive;
        await plan.save();

        res.status(200).json({ success: true, data: plan, message: `Plan ${plan.isActive ? 'activated' : 'deactivated'}` });
    } catch (error) {
        next(error);
    }
};

/**
 * ==============================================================================
 * PT ASSIGNMENT CONTROLLERS
 * ==============================================================================
 */

/**
 * Assign PT to a Member (Sell/Create Assignment)
 * Admin, Manager, Sales can do this.
 */
export const assignPT = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { memberId, planId, trainerId, startDate } = req.body;
        const user = (req as any).user;
        const adminId = user.adminId || user.id || user._id;

        // 1. Get the plan details
        const plan = await PTPlan.findById(planId);
        if (!plan) {
            throw new ApiError(HttpStatusCode.NOT_FOUND, 'PT Plan not found');
        }

        // 2. Validate Trainer belongs to this admin? (Ideally yes)

        // 3. Calculate Expiry
        const start = new Date(startDate || Date.now());
        const expiry = new Date(start);
        expiry.setDate(expiry.getDate() + plan.validityDays);

        // 4. Create Assignment
        const assignment = await PTAssignment.create({
            memberId,
            planId: plan._id,
            trainerId,
            adminId,
            createdBy: user.id || user._id,
            startDate: start,
            expiryDate: expiry,
            totalSessions: plan.totalSessions,
            usedSessions: 0,
            status: 'active'
        });

        res.status(201).json({ success: true, data: assignment, message: 'PT Assign success' });
    } catch (error) {
        next(error);
    }
};

/**
 * Get Assignments
 * Admin: All
 * Manager: All
 * Trainer: Only their assigned clients
 * Member: Only their own
 */
export const getPTAssignments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user;
        const adminId = user.adminId || user.id || user._id;

        let query: any = { adminId };

        if (user.role === 'staff' && user.position === 'trainer') {
            // Trainer sees ONLY their assignments
            query.trainerId = user.staffId;
            // Note: req.user.staffId MUST be populated by auth middleware for staff
        }

        // Optional status filter
        if (req.query.status) {
            query.status = req.query.status;
        }

        // Optional member filter
        if (req.query.memberId) {
            query.memberId = req.query.memberId;
        }

        // Optional trainer filter
        if (req.query.trainerId) {
            query.trainerId = req.query.trainerId;
        }

        const assignments = await PTAssignment.find(query)
            .populate('memberId', 'fullName email contactNumber')
            .populate('planId', 'name totalSessions')
            .populate('trainerId', 'fullName')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: assignments });
    } catch (error) {
        next(error);
    }
};

/**
 * Log a PT Session usage
 * Trainer Only (usually), or Admin/Manager manually.
 */
export const logPTSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params; // Assignment ID
        const { date, notes } = req.body;
        const user = (req as any).user;

        const assignment = await PTAssignment.findById(id);

        if (!assignment) {
            throw new ApiError(HttpStatusCode.NOT_FOUND, 'Assignment not found');
        }

        // Authorization Warning
        // If staff is trainer, they must match assignment.trainerId
        if (user.role === 'staff' && user.position === 'trainer') {
            // Need to compare string values of ObjectIds
            if (assignment.trainerId.toString() !== user.staffId.toString()) {
                throw new ApiError(HttpStatusCode.FORBIDDEN, 'You can only log sessions for your own clients');
            }
        }

        // Validation: Is Active?
        if (assignment.status !== 'active') {
            throw new ApiError(HttpStatusCode.BAD_REQUEST, `Cannot log session. Status is ${assignment.status}`);
        }

        // Validation: Has remaining sessions?
        if (assignment.usedSessions >= assignment.totalSessions) {
            assignment.status = 'completed'; // Auto close if missed
            await assignment.save();
            throw new ApiError(HttpStatusCode.BAD_REQUEST, 'All sessions used!');
        }

        // Validation: Is Expired? (Date check)
        if (new Date() > new Date(assignment.expiryDate)) {
            assignment.status = 'expired';
            await assignment.save();
            throw new ApiError(HttpStatusCode.BAD_REQUEST, 'PT expired!');
        }

        // Log it
        assignment.usedSessions += 1;
        assignment.sessionLogs.push({
            date: new Date(date || Date.now()),
            notes,
            loggedBy: user.staffId || user._id // Staff ID or Admin ID
        });

        // Check completion after increment
        if (assignment.usedSessions >= assignment.totalSessions) {
            assignment.status = 'completed';
        }

        await assignment.save();

        res.status(200).json({ success: true, data: assignment, message: 'Session logged' });
    } catch (error) {
        next(error);
    }
};

/**
 * Check Expiry (Cron or Manual trigger)
 * Updates status of expired assignments
 */
export const checkPTExpiry = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user;
        const adminId = user.adminId || user.id || user._id;

        const now = new Date();

        // Find active assignments that have passed expiry date
        const result = await PTAssignment.updateMany(
            {
                adminId,
                status: 'active',
                expiryDate: { $lt: now }
            },
            {
                $set: { status: 'expired' }
            }
        );

        res.status(200).json({ success: true, updatedCount: result.modifiedCount, message: 'Expiry check complete' });
    } catch (error) {
        next(error);
    }
}
