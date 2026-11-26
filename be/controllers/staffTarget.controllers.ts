// controllers/staffTarget.controllers.ts
import type { Request, Response } from 'express';
import { StaffTarget } from '../models/staffTarget.model';
import { Staff } from '../models/staff.model';
import { Types } from 'mongoose';

/**
 * Get all staff targets for the logged in gym
 */
export const getStaffTargets = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const gymId = user?.gym;

    if (!gymId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: Gym ID not found',
      });
      return;
    }

    const { staffId, targetType, salesType, year } = req.query;

    const filter: any = {
      gym: new Types.ObjectId(gymId.toString()),
    };

    if (staffId && staffId !== 'All' && Types.ObjectId.isValid(staffId as string)) {
      filter.staffId = new Types.ObjectId(staffId as string);
    }

    if (targetType && targetType !== 'All') {
      filter.targetType = { $regex: new RegExp(`^${targetType}$`, 'i') };
    }

    if (salesType && salesType !== 'All') {
      filter.salesType = { $regex: new RegExp(`^${salesType}$`, 'i') };
    }

    if (year && year !== 'All') {
      filter.year = Number(year);
    }

    const targets = await StaffTarget.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: targets,
    });
  } catch (error: any) {
    console.error('Error fetching staff targets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff targets',
      error: error.message,
    });
  }
};

/**
 * Create a new staff target
 */
export const createStaffTarget = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const gymId = user?.gym;
    const userId = user?.id || user?._id;

    if (!gymId || !userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const { staffId, targetType, salesType, year, monthlyTargets } = req.body;

    if (!staffId) {
      res.status(400).json({
        success: false,
        message: 'Staff is required',
      });
      return;
    }

    const staffMember = await Staff.findById(staffId);
    if (!staffMember) {
      res.status(404).json({
        success: false,
        message: 'Staff member not found',
      });
      return;
    }

    const cleanMonthlyTargets = {
      jan: Number(monthlyTargets?.jan) || 0,
      feb: Number(monthlyTargets?.feb) || 0,
      mar: Number(monthlyTargets?.mar) || 0,
      apr: Number(monthlyTargets?.apr) || 0,
      may: Number(monthlyTargets?.may) || 0,
      jun: Number(monthlyTargets?.jun) || 0,
      jul: Number(monthlyTargets?.jul) || 0,
      aug: Number(monthlyTargets?.aug) || 0,
      sep: Number(monthlyTargets?.sep) || 0,
      oct: Number(monthlyTargets?.oct) || 0,
      nov: Number(monthlyTargets?.nov) || 0,
      dec: Number(monthlyTargets?.dec) || 0,
    };

    const newTarget = new StaffTarget({
      gym: new Types.ObjectId(gymId.toString()),
      createdBy: new Types.ObjectId(userId.toString()),
      staffId: new Types.ObjectId(staffId.toString()),
      staffName: staffMember.fullName || 'Staff',
      targetType: targetType || 'Sales',
      salesType: salesType || 'Revenue Target',
      year: Number(year) || new Date().getFullYear(),
      monthlyTargets: cleanMonthlyTargets,
    });

    const savedTarget = await newTarget.save();

    res.status(201).json({
      success: true,
      message: 'Staff target created successfully',
      data: savedTarget,
    });
  } catch (error: any) {
    console.error('Error creating staff target:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create staff target',
      error: error.message,
    });
  }
};

/**
 * Update an existing staff target
 */
export const updateStaffTarget = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const gymId = user?.gym;
    const { id } = req.params;

    if (!gymId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const { staffId, targetType, salesType, year, monthlyTargets } = req.body;

    const existingTarget = await StaffTarget.findOne({
      _id: new Types.ObjectId(id),
      gym: new Types.ObjectId(gymId.toString()),
    });

    if (!existingTarget) {
      res.status(404).json({
        success: false,
        message: 'Staff target not found',
      });
      return;
    }

    if (staffId && staffId !== existingTarget.staffId.toString()) {
      const staffMember = await Staff.findById(staffId);
      if (staffMember) {
        existingTarget.staffId = new Types.ObjectId(staffId.toString());
        existingTarget.staffName = staffMember.fullName;
      }
    }

    if (targetType) existingTarget.targetType = targetType;
    if (salesType) existingTarget.salesType = salesType;
    if (year) existingTarget.year = Number(year);

    if (monthlyTargets) {
      existingTarget.monthlyTargets = {
        jan: monthlyTargets.jan !== undefined ? Number(monthlyTargets.jan) || 0 : existingTarget.monthlyTargets.jan,
        feb: monthlyTargets.feb !== undefined ? Number(monthlyTargets.feb) || 0 : existingTarget.monthlyTargets.feb,
        mar: monthlyTargets.mar !== undefined ? Number(monthlyTargets.mar) || 0 : existingTarget.monthlyTargets.mar,
        apr: monthlyTargets.apr !== undefined ? Number(monthlyTargets.apr) || 0 : existingTarget.monthlyTargets.apr,
        may: monthlyTargets.may !== undefined ? Number(monthlyTargets.may) || 0 : existingTarget.monthlyTargets.may,
        jun: monthlyTargets.jun !== undefined ? Number(monthlyTargets.jun) || 0 : existingTarget.monthlyTargets.jun,
        jul: monthlyTargets.jul !== undefined ? Number(monthlyTargets.jul) || 0 : existingTarget.monthlyTargets.jul,
        aug: monthlyTargets.aug !== undefined ? Number(monthlyTargets.aug) || 0 : existingTarget.monthlyTargets.aug,
        sep: monthlyTargets.sep !== undefined ? Number(monthlyTargets.sep) || 0 : existingTarget.monthlyTargets.sep,
        oct: monthlyTargets.oct !== undefined ? Number(monthlyTargets.oct) || 0 : existingTarget.monthlyTargets.oct,
        nov: monthlyTargets.nov !== undefined ? Number(monthlyTargets.nov) || 0 : existingTarget.monthlyTargets.nov,
        dec: monthlyTargets.dec !== undefined ? Number(monthlyTargets.dec) || 0 : existingTarget.monthlyTargets.dec,
      };
    }

    const updatedTarget = await existingTarget.save();

    res.status(200).json({
      success: true,
      message: 'Staff target updated successfully',
      data: updatedTarget,
    });
  } catch (error: any) {
    console.error('Error updating staff target:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update staff target',
      error: error.message,
    });
  }
};

/**
 * Delete a staff target
 */
export const deleteStaffTarget = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const gymId = user?.gym;
    const { id } = req.params;

    if (!gymId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const deleted = await StaffTarget.findOneAndDelete({
      _id: new Types.ObjectId(id),
      gym: new Types.ObjectId(gymId.toString()),
    });

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Staff target not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Staff target deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting staff target:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete staff target',
      error: error.message,
    });
  }
};
