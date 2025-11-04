// controllers/staff.controller.ts
 
import type { Request, Response } from 'express';
import { Staff } from '../models/staff.model';
import type { IStaff } from '../models/staff.model';
import type { FilterQuery } from 'mongoose';
 
/**
 * Create a new staff member (only for authenticated user's organization)
 */
export const createStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    // Assume userId is attached by auth middleware (e.g., req.user.id)
    const userId = (req as any).user?.id; // Adjust based on your auth setup
 
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated',
      });
      return;
    }
 
    const newStaff = new Staff({
      ...req.body,
      userId, // 👈 Associate staff with the logged-in user
    });
 
    const savedStaff = await newStaff.save();
    res.status(201).json({
      success: true,
      data: savedStaff,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Staff with this email or phone number already exists.',
      });
      return;
    }
    res.status(400).json({
      success: false,
      message: 'Invalid data',
      error: error.message,
    });
  }
};
 
/**
 * Get all staff members (only for the logged-in user)
 */
export const getAllStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }
 
    const { search, role, status } = req.query;
 
    const query: FilterQuery<IStaff> = { userId };
 
    if (search || role || status) {
      if (search) {
        query.$or = [
          { fullName: { $regex: search as string, $options: 'i' } },
          { email: { $regex: search as string, $options: 'i' } },
          { contactNumber: { $regex: search as string, $options: 'i' } },
          { position: { $regex: search as string, $options: 'i' } },
        ];
      }
      if (role) {
        query.position = { $regex: new RegExp(role as string, 'i') };
      }
      if (status === 'active' || status === 'inactive') {
        query.status = status;
      }
    }
 
    console.log('🔍 Final Query:', query);
 
    // ✅ Just await — no race
    const staff = await Staff.find(query).sort({ createdAt: -1 });
 
    console.log(`✅ Found ${staff.length} staff members`);
 
    res.json({
      success: true,
      count: staff.length,
      data: staff, // ✅ Correct key
    });
  } catch (error: any) {
    console.error('🚨 Error in getAllStaff:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching staff',
      error: error.message,
    });
  }
};
 
/**
 * Get a single staff member by ID (user-owned only)
 */
export const getStaffById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;
 
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }
 
    const staff = await Staff.findOne({ _id: id, userId });
 
    if (!staff) {
      res.status(404).json({
        success: false,
        message: 'Staff not found or access denied',
      });
      return;
    }
 
    res.json({
      success: true,
      data: staff,
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        message: 'Invalid staff ID format',
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
 
/**
 * Update a staff member by ID (user-owned only)
 */
export const updateStaffById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;
 
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }
 
    const updates = req.body;
 
    // Remove userId from updates (can't change ownership)
    delete updates.userId;
 
    const updatedStaff = await Staff.findOneAndUpdate(
      { _id: id, userId }, // 👈 Match both ID and user ownership
      updates,
      { new: true, runValidators: true }
    );
 
    if (!updatedStaff) {
      res.status(404).json({
        success: false,
        message: 'Staff not found or access denied',
      });
      return;
    }
 
    res.json({
      success: true,
      data: updatedStaff,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Update results in duplicate email or phone number.',
      });
      return;
    }
    if (error.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message,
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: 'Server error during update',
      error: error.message,
    });
  }
};
 
/**
 * Delete a staff member by ID (user-owned only)
 */
export const deleteStaffById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;
 
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }
 
    const deletedStaff = await Staff.findOneAndDelete({ _id: id, userId });
 
    if (!deletedStaff) {
      res.status(404).json({
        success: false,
        message: 'Staff not found or access denied',
      });
      return;
    }
 
    res.json({
      success: true,
      message: 'Staff deleted successfully',
       deletedStaff,
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        message: 'Invalid staff ID format',
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: 'Server error during deletion',
      error: error.message,
    });
  }
};