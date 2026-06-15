// controllers/clientAttendance.controllers.ts

import type { Request, Response } from 'express';
import moment from 'moment-timezone';
import { Types } from 'mongoose';
import { ClientAttendance } from '../models/clientAttendance.model';
import { Client } from '../models/client.model';

const TIMEZONE = 'Asia/Kolkata';

/**
 * Helper: returns start and end of today in IST
 */
const getTodayRange = () => {
  const start = moment.tz(TIMEZONE).startOf('day').toDate();
  const end = moment.tz(TIMEZONE).endOf('day').toDate();
  return { start, end };
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/client-attendance/check-in
// Member self-check-in — creates today's attendance record
// ─────────────────────────────────────────────────────────────────────────────
export const memberCheckIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;

    // Find the member's Client record (contains adminId / userId)
    const clientRecord = await Client.findOne({
      email: user.email?.toLowerCase(),
    }).select('_id userId');

    if (!clientRecord) {
      res.status(404).json({ success: false, message: 'No client profile found for this member.' });
      return;
    }

    const { start, end } = getTodayRange();

    // Prevent duplicate check-in for today
    const existing = await ClientAttendance.findOne({
      clientId: clientRecord._id,
      date: { $gte: start, $lte: end },
    });

    if (existing) {
      res.status(409).json({
        success: false,
        message: 'You have already checked in today.',
        record: existing,
      });
      return;
    }

    const now = new Date();
    const todayNormalized = moment.tz(TIMEZONE).startOf('day').toDate();

    const record = await ClientAttendance.create({
      clientId: clientRecord._id,
      adminId: clientRecord.userId,
      date: todayNormalized,
      checkInTime: now,
      status: 'present',
    });

    res.status(201).json({
      success: true,
      message: 'Checked in successfully!',
      record,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error during check-in.', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/client-attendance/check-out
// Member self-check-out — sets checkOutTime and computes duration
// ─────────────────────────────────────────────────────────────────────────────
export const memberCheckOut = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;

    const clientRecord = await Client.findOne({
      email: user.email?.toLowerCase(),
    }).select('_id');

    if (!clientRecord) {
      res.status(404).json({ success: false, message: 'No client profile found.' });
      return;
    }

    const { start, end } = getTodayRange();

    const record = await ClientAttendance.findOne({
      clientId: clientRecord._id,
      date: { $gte: start, $lte: end },
    });

    if (!record) {
      res.status(404).json({ success: false, message: 'No check-in found for today. Please check in first.' });
      return;
    }

    if (record.checkOutTime) {
      res.status(409).json({ success: false, message: 'You have already checked out today.', record });
      return;
    }

    record.checkOutTime = new Date();
    // duration is auto-computed in the pre-save hook
    await record.save();

    res.status(200).json({
      success: true,
      message: 'Checked out successfully!',
      record,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error during check-out.', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/client-attendance/my
// Member fetches their full attendance history
// ─────────────────────────────────────────────────────────────────────────────
export const getMyAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;

    const clientRecord = await Client.findOne({
      email: user.email?.toLowerCase(),
    }).select('_id');

    if (!clientRecord) {
      res.status(200).json({ success: true, records: [] });
      return;
    }

    const records = await ClientAttendance.find({ clientId: clientRecord._id })
      .sort({ date: -1 })
      .select('-__v');

    res.status(200).json({ success: true, total: records.length, records });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error fetching attendance.', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/client-attendance/my/month?month=5&year=2026
// Member fetches current (or specified) month's attendance summary
// ─────────────────────────────────────────────────────────────────────────────
export const getMyMonthlyAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;

    const targetMonth = parseInt(req.query.month as string, 10) || moment.tz(TIMEZONE).month() + 1;
    const targetYear = parseInt(req.query.year as string, 10) || moment.tz(TIMEZONE).year();

    const start = moment.tz([targetYear, targetMonth - 1], TIMEZONE).startOf('month').toDate();
    const end = moment.tz([targetYear, targetMonth - 1], TIMEZONE).endOf('month').toDate();

    const clientRecord = await Client.findOne({
      email: user.email?.toLowerCase(),
    }).select('_id');

    if (!clientRecord) {
      res.status(200).json({ success: true, month: targetMonth, year: targetYear, present: 0, records: [] });
      return;
    }

    const records = await ClientAttendance.find({
      clientId: clientRecord._id,
      date: { $gte: start, $lte: end },
    }).sort({ date: 1 }).select('-__v');

    const presentCount = records.filter(r => r.status === 'present').length;

    res.status(200).json({
      success: true,
      month: targetMonth,
      year: targetYear,
      present: presentCount,
      total: records.length,
      records,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error fetching monthly attendance.', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/client-attendance/client/:clientId
// Admin or staff views a specific member's attendance history
// ─────────────────────────────────────────────────────────────────────────────
export const getClientAttendanceByAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId } = req.params;

    if (!clientId || !Types.ObjectId.isValid(clientId)) {
      res.status(400).json({ success: false, message: 'Invalid client ID.' });
      return;
    }

    const query: any = { clientId: new Types.ObjectId(clientId) };

    // Optional date range filter
    if (req.query.startDate) {
      query.date = { ...query.date, $gte: new Date(req.query.startDate as string) };
    }
    if (req.query.endDate) {
      query.date = { ...query.date, $lte: new Date(req.query.endDate as string) };
    }

    const records = await ClientAttendance.find(query)
      .sort({ date: -1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      clientId,
      total: records.length,
      records,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error fetching client attendance.', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/client-attendance/mark
// Staff (Admin, Manager, Receptionist) marks check-in/out for a client manually
// ─────────────────────────────────────────────────────────────────────────────
export const markClientAttendanceByStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId, action, notes } = req.body;

    if (!clientId || !Types.ObjectId.isValid(clientId)) {
      res.status(400).json({ success: false, message: 'Invalid client ID.' });
      return;
    }

    if (action !== 'check-in' && action !== 'check-out') {
      res.status(400).json({ success: false, message: 'Action must be check-in or check-out.' });
      return;
    }

    const clientRecord = await Client.findById(clientId).select('_id userId fullName');
    if (!clientRecord) {
      res.status(404).json({ success: false, message: 'Client profile not found.' });
      return;
    }

    const { start, end } = getTodayRange();
    const todayNormalized = moment.tz(TIMEZONE).startOf('day').toDate();
    const now = new Date();

    if (action === 'check-in') {
      // Prevent duplicate check-in for today
      const existing = await ClientAttendance.findOne({
        clientId: clientRecord._id,
        date: { $gte: start, $lte: end },
      });

      if (existing) {
        res.status(409).json({
          success: false,
          message: `${clientRecord.fullName} has already checked in today.`,
          record: existing,
        });
        return;
      }

      const record = await ClientAttendance.create({
        clientId: clientRecord._id,
        adminId: clientRecord.userId,
        date: todayNormalized,
        checkInTime: now,
        status: 'present',
        notes: notes || null,
      });

      res.status(201).json({
        success: true,
        message: `${clientRecord.fullName} checked in successfully!`,
        record,
      });
    } else {
      // Action is check-out
      const record = await ClientAttendance.findOne({
        clientId: clientRecord._id,
        date: { $gte: start, $lte: end },
      });

      if (!record) {
        res.status(404).json({
          success: false,
          message: `No check-in found for today. Please check in ${clientRecord.fullName} first.`,
        });
        return;
      }

      if (record.checkOutTime) {
        res.status(409).json({
          success: false,
          message: `${clientRecord.fullName} has already checked out today.`,
          record,
        });
        return;
      }

      record.checkOutTime = now;
      if (notes) {
        record.notes = notes;
      }
      await record.save();

      res.status(200).json({
        success: true,
        message: `${clientRecord.fullName} checked out successfully!`,
        record,
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error during attendance marking.', error: error.message });
  }
};

// GET /api/v1/client-attendance/today-logs
export const getTodayAttendanceLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { start, end } = getTodayRange();
    const records = await ClientAttendance.find({
      date: { $gte: start, $lte: end }
    }).populate('clientId', 'fullName email contactNumber plan').select('-__v');

    const formattedRecords = records.map(r => {
      const client = r.clientId as any;
      return {
        _id: r._id,
        clientId: client?._id,
        clientName: client?.fullName || 'Member',
        checkInTime: r.checkInTime,
        checkOutTime: r.checkOutTime,
        duration: r.duration,
        status: r.status,
      };
    });

    res.status(200).json({
      success: true,
      records: formattedRecords
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error fetching today logs.', error: error.message });
  }
};

