// controllers/staffAttendance.controllers.ts

import type { Request, Response } from 'express';
import moment from 'moment-timezone';
import { Types } from 'mongoose';
import { Staff, type IStaff } from '../models/staff.model';
import { Attendance, type IAttendance } from '../models/staffAttendance.model';
import { getVisibleStaff, getVisibleStaffIds } from '../utils/staffPermissions.util';

// Helper: Get start and end of day in UTC based on timezone
const getStartAndEndOfDay = (date: Date, timezone: string): { start: Date; end: Date } => {
  const start = moment.tz(date, timezone).startOf('day').toDate();
  const end = moment.tz(date, timezone).endOf('day').toDate();
  return { start, end };
};

/**
 * @route   POST /api/attendance
 * @desc    Mark attendance for a staff member (check-in, status)
 * @access  Private
 */
export const markAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { staffId, status = 'present', notes, checkInTime } = req.body;
    const user = (req as any).user;
    const userId = user?._id || user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized: User not authenticated' });
      return;
    }

    if (!staffId || !Types.ObjectId.isValid(staffId)) {
      res.status(400).json({ message: 'Valid staffId is required' });
      return;
    }

    const staffObjectId = new Types.ObjectId(staffId);

    // Check permissions: Is this staff member visible/accessible to the current user?
    // We can check if this staffId is in the allowed list for this user
    const visibleStaffIds = await getVisibleStaffIds(
      new Types.ObjectId(userId),
      user.role,
      user.position
    );

    const isAllowed = visibleStaffIds.some(id => id.equals(staffObjectId));

    if (!isAllowed) {
      // Fallback: If the user IS the staff member (self-check-in), allow it.
      // The visibleStaffIds logic for 'staff' role only returns themselves, so this should be covered.
      // But let's double check via direct DB query to be safe if util logic changes.
      const isSelf = await Staff.findOne({ _id: staffObjectId, userId: new Types.ObjectId(userId) });
      if (!isSelf) {
        res.status(404).json({ message: 'Staff not found or access denied' });
        return;
      }
    }

    const validStatuses = ['present', 'absent', 'late', 'on-leave', 'half-day'] as const;
    if (!validStatuses.includes(status)) {
      res.status(400).json({ message: 'Invalid status value' });
      return;
    }

    const timezone = typeof req.body.timezone === 'string' ? req.body.timezone : 'Asia/Kolkata';

    let targetDate = new Date();

    if (checkInTime) {
      const parsed = moment.tz(checkInTime, timezone);
      if (!parsed.isValid()) {
        res.status(400).json({ message: 'Invalid checkInTime format' });
        return;
      }
      targetDate = parsed.toDate();
    } else {
      targetDate = moment.tz(timezone).toDate();
    }

    const { start, end } = getStartAndEndOfDay(targetDate, timezone);

    // 🔎 Look for existing attendance
    const existingAttendance = await Attendance.findOne({
      staffId: staffObjectId,
      date: { $gte: start, $lte: end },
    });

    let attendance;

    if (existingAttendance) {
      existingAttendance.status = status;
      existingAttendance.checkInTime = ['present', 'late', 'half-day'].includes(status)
        ? (checkInTime ? new Date(checkInTime) : new Date())
        : undefined;
      existingAttendance.notes = notes ?? undefined;

      attendance = await existingAttendance.save();
    } else {
      attendance = new Attendance({
        staffId: staffObjectId,
        date: targetDate,
        status,
        checkInTime: ['present', 'late', 'half-day'].includes(status)
          ? (checkInTime ? new Date(checkInTime) : new Date())
          : undefined,
        notes: notes ?? undefined,
      });

      await attendance.save();
    }

    res.status(201).json({
      message: 'Attendance marked successfully',
      attendance,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Server error while marking attendance',
      error: error.message,
    });
  }
};

/**
 * @route   PUT /api/attendance/:id
 * @desc    Update attendance (e.g., check-out, edit status/notes)
 * @access  Private
 */
export const updateAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const userId = user?._id || user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { status, checkInTime, checkOutTime, notes } = req.body;
    const updateData: Partial<IAttendance> = {};

    // Validate status
    if (status) {
      const validStatuses = ['present', 'absent', 'late', 'on-leave', 'half-day'] as const;
      if (!validStatuses.includes(status)) {
        res.status(400).json({ message: 'Invalid status value' });
        return;
      }
      updateData.status = status;
    }

    if (checkInTime) updateData.checkInTime = new Date(checkInTime);
    if (checkOutTime) updateData.checkOutTime = new Date(checkOutTime);
    if (notes !== undefined) updateData.notes = notes;

    // Verify ownership/permission
    const attendance = await Attendance.findById(id).populate<{
      staffId: IStaff & { userId: Types.ObjectId };
    }>('staffId', 'userId');

    if (!attendance) {
      res.status(404).json({ message: 'Attendance record not found' });
      return;
    }

    // Check if the user is allowed to edit this staff's attendance
    const visibleStaffIds = await getVisibleStaffIds(
      new Types.ObjectId(userId),
      user.role,
      user.position
    );

    const isAllowed = visibleStaffIds.some(sid => sid.equals(attendance.staffId._id));

    if (!isAllowed) {
      res.status(403).json({ message: 'Access denied: Cannot edit this attendance record' });
      return;
    }

    const updated = await Attendance.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('staffId', 'fullName position');

    res.status(200).json({
      message: 'Attendance updated successfully',
      attendance: updated,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Server error while updating attendance',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/attendance/date/:date
 * @desc    Get attendance records for a date — only for user's visible staff
 * @access  Private
 */
export const getAttendanceByDate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date } = req.params;
    const user = (req as any).user;
    const userId = user?._id || user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!date || typeof date !== 'string') {
      res.status(400).json({ message: 'Date is required in YYYY-MM-DD format' });
      return;
    }

    const timezone = typeof req.query.timezone === 'string' ? req.query.timezone : 'Asia/Kolkata';
    const parsedDate = moment.tz(date, 'YYYY-MM-DD', timezone);
    if (!parsedDate.isValid()) {
      res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
      return;
    }

    const { start, end } = getStartAndEndOfDay(parsedDate.toDate(), timezone);

    // Get all staff IDs visible to the user
    const staffIds = await getVisibleStaffIds(
      new Types.ObjectId(userId),
      user.role,
      user.position
    );

    const records = await Attendance.find({
      staffId: { $in: staffIds },
      date: { $gte: start, $lte: end },
    })
      .populate('staffId', 'fullName position email contactNumber')
      .sort({ 'staffId.position': 1, 'staffId.fullName': 1 });

    res.status(200).json({
      date: parsedDate.toDate(),
      count: records.length,
      records,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Server error fetching attendance by date',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/attendance/sheet/:date
 * @desc    Generate full attendance sheet for a day (includes all active staff visible to the user)
 * @access  Private
 */
export const getDailyAttendanceSheet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date } = req.params;
    const user = (req as any).user;
    const userId = user?._id || user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!date || typeof date !== 'string') {
      res.status(400).json({ message: 'Date is required in YYYY-MM-DD format' });
      return;
    }

    const timezone = typeof req.query.timezone === 'string' ? req.query.timezone : 'Asia/Kolkata';
    const parsedDate = moment.tz(date, 'YYYY-MM-DD', timezone);
    if (!parsedDate.isValid()) {
      res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
      return;
    }

    const { start, end } = getStartAndEndOfDay(parsedDate.toDate(), timezone);

    // Get all active staff visible to this user
    const staffList = await getVisibleStaff(
      new Types.ObjectId(userId),
      user.role,
      user.position,
      'fullName position email contactNumber _id'
    );

    if (staffList.length === 0) {
      res.status(200).json({
        date: parsedDate.toDate(),
        totalStaff: 0,
        present: 0,
        absent: 0,
        onLeave: 0,
        halfDay: 0,
        report: [],
      });
      return;
    }

    const staffIds = staffList.map(s => s._id);
    const attendanceRecords = await Attendance.find({
      staffId: { $in: staffIds },
      date: { $gte: start, $lte: end },
    }).select('-__v');

    const attendanceMap = new Map<string, IAttendance>();
    attendanceRecords.forEach((record) => {
      attendanceMap.set(record.staffId.toString(), record);
    });

    const report = staffList.map((staff) => {
      const record = attendanceMap.get(staff._id.toString());
      return {
        staffId: staff._id.toString(),
        fullName: staff.fullName,
        position: staff.position,
        email: staff.email,
        contactNumber: staff.contactNumber,
        status: (record?.status as 'present' | 'absent' | 'late' | 'on-leave' | 'half-day') || 'absent',
        checkInTime: record?.checkInTime || null,
        checkOutTime: record?.checkOutTime || null,
        notes: record?.notes || '',
        attendanceId: record?._id?.toString(),
      };
    });

    const present = report.filter(r => ['present', 'late'].includes(r.status)).length;
    const absent = report.filter(r => r.status === 'absent').length;
    const onLeave = report.filter(r => r.status === 'on-leave').length;
    const halfDay = report.filter(r => r.status === 'half-day').length;

    res.status(200).json({
      date: parsedDate.toDate(),
      totalStaff: staffList.length,
      present,
      absent,
      onLeave,
      halfDay,
      report,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Server error generating attendance sheet',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/attendance/staff/:staffId
 * @desc    Get attendance history for a specific staff member (user-owned/visible only)
 * @access  Private
 */
export const getAttendanceByStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const { staffId } = req.params;
    const user = (req as any).user;
    const userId = user?._id || user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!staffId || !Types.ObjectId.isValid(staffId)) {
      res.status(400).json({ message: 'Invalid staff ID' });
      return;
    }

    const id = new Types.ObjectId(staffId);

    // Check visibility
    const visibleStaffIds = await getVisibleStaffIds(
      new Types.ObjectId(userId),
      user.role,
      user.position
    );

    const isAllowed = visibleStaffIds.some(sid => sid.equals(id));

    if (!isAllowed) {
      res.status(404).json({ message: 'Staff not found or access denied' });
      return;
    }

    // We need to fetch the staff details too
    const staff = await Staff.findById(id);

    const query: any = { staffId: id };

    if (req.query.startDate) {
      query.date = { ...query.date, $gte: new Date(req.query.startDate as string) };
    }
    if (req.query.endDate) {
      query.date = { ...query.date, $lte: new Date(req.query.endDate as string) };
    }

    const records = await Attendance.find(query)
      .sort({ date: -1 })
      .select('-__v');

    res.status(200).json({
      staff: {
        id: staff?._id.toString(),
        fullName: staff?.fullName,
        position: staff?.position,
      },
      totalRecords: records.length,
      records,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Server error fetching staff attendance',
      error: error.message,
    });
  }
};

/**
 * @route   DELETE /api/attendance/:id
 * @desc    Delete an attendance record (admin/user-owned)
 * @access  Private
 */
export const deleteAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const userId = user?._id || user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Verify ownership via staff
    const attendance = await Attendance.findById(id).populate<{
      staffId: IStaff & { userId: Types.ObjectId };
    }>('staffId', 'userId');

    if (!attendance) {
      res.status(404).json({ message: 'Attendance record not found' });
      return;
    }

    // Check permission
    const visibleStaffIds = await getVisibleStaffIds(
      new Types.ObjectId(userId),
      user.role,
      user.position
    );

    const isAllowed = visibleStaffIds.some(sid => sid.equals(attendance.staffId._id));

    if (!isAllowed) {
      res.status(403).json({ message: 'Access denied: Cannot delete this record' });
      return;
    }

    await Attendance.findByIdAndDelete(id);

    res.status(200).json({
      message: 'Attendance record deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Server error deleting attendance',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/attendance/monthly
 * @desc    Get monthly attendance report (summary per staff, user-specific)
 * @access  Private
 */
export const getMonthlyAttendanceReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { month, year } = req.query;
    const user = (req as any).user;
    const userId = user?._id || user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const timezone = typeof req.query.timezone === 'string' ? req.query.timezone : 'Asia/Kolkata';

    const targetMonth = parseInt(month as string, 10) || moment().month() + 1;
    const targetYear = parseInt(year as string, 10) || moment().year();

    if (targetMonth < 1 || targetMonth > 12) {
      res.status(400).json({ message: 'Month must be between 1 and 12' });
      return;
    }

    const start = moment.tz([targetYear, targetMonth - 1], timezone).startOf('month').toDate();
    const end = moment(start).endOf('month').toDate();

    // Get active staff visible to this user
    const activeStaff = await getVisibleStaff(
      new Types.ObjectId(userId),
      user.role,
      user.position,
      'fullName position _id'
    );

    if (activeStaff.length === 0) {
      res.status(200).json({
        month: targetMonth,
        year: targetYear,
        totalStaff: 0,
        report: [],
      });
      return;
    }

    const report = await Promise.all(
      activeStaff.map(async (staff: IStaff) => {
        const records = await Attendance.find({
          staffId: staff._id,
          date: { $gte: start, $lte: end },
        });

        return {
          staffId: staff._id.toString(),
          fullName: staff.fullName,
          position: staff.position,
          totalDays: records.length,
          present: records.filter((r) => r.status === 'present').length,
          late: records.filter((r) => r.status === 'late').length,
          onLeave: records.filter((r) => r.status === 'on-leave').length,
          absent: records.filter((r) => r.status === 'absent').length,
          halfDay: records.filter((r) => r.status === 'half-day').length,
        };
      })
    );

    res.status(200).json({
      month: targetMonth,
      year: targetYear,
      totalStaff: report.length,
      report,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Server error generating monthly report',
      error: error.message,
    });
  }
};