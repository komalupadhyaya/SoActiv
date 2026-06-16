import type { Request, Response } from 'express';
import { CleaningTemplate } from '../models/cleaningTemplate.model';
import { CleaningChecklist } from '../models/cleaningChecklist.model';
import { Staff } from '../models/staff.model';
import { getOwnerId } from './client.controllers';
import { asyncHandler } from '../lib/AsyncHandler';
import ApiError from '../lib/ApiError';
import { HttpStatusCode } from '../lib/const';

/**
 * Helper to verify staff member belongs to the requesting admin's gym
 */
const verifyStaffAccess = async (req: Request, staffId: string): Promise<string> => {
  const ownerId = await getOwnerId(req);
  const staff = await Staff.findOne({ _id: staffId, createdBy: ownerId });
  if (!staff) {
    throw new ApiError(HttpStatusCode.NOT_FOUND, 'Staff member not found or access denied');
  }
  return ownerId;
};

/**
 * Get checklist template for a specific cleaner
 * GET /api/v1/cleaning/template/:cleanerId
 */
export const getTemplate = asyncHandler(async (req: Request, res: Response) => {
  const { cleanerId } = req.params;
  if (!cleanerId) {
    throw new ApiError(HttpStatusCode.BAD_REQUEST, 'cleanerId parameter is required');
  }
  await verifyStaffAccess(req, cleanerId);

  const template = await CleaningTemplate.findOne({ assignedTo: cleanerId });
  return res.status(200).json({
    success: true,
    data: template || { assignedTo: cleanerId, items: [] }
  });
});

/**
 * Save or update checklist template for a cleaner
 * POST /api/v1/cleaning/template
 */
export const saveTemplate = asyncHandler(async (req: Request, res: Response) => {
  const { cleanerId, items } = req.body;

  if (!cleanerId || !Array.isArray(items)) {
    throw new ApiError(HttpStatusCode.BAD_REQUEST, 'cleanerId and items array are required');
  }

  const ownerId = await verifyStaffAccess(req, cleanerId);

  // Validate items
  if (items.length === 0) {
    throw new ApiError(HttpStatusCode.BAD_REQUEST, 'Template checklist must have at least one item');
  }

  const template = await CleaningTemplate.findOneAndUpdate(
    { assignedTo: cleanerId },
    { adminId: ownerId, items },
    { upsert: true, new: true, runValidators: true }
  );

  return res.status(200).json({
    success: true,
    message: 'Cleaning template saved successfully',
    data: template
  });
});

/**
 * Get or initialize today's checklist for logged-in cleaner
 * GET /api/v1/cleaning/today?dateStr=YYYY-MM-DD
 */
export const getTodayChecklist = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const cleanerId = user.staffId;
  const { dateStr } = req.query;

  if (!cleanerId) {
    throw new ApiError(HttpStatusCode.BAD_REQUEST, 'Cleaner staff ID not associated with this session');
  }

  if (!dateStr || typeof dateStr !== 'string') {
    throw new ApiError(HttpStatusCode.BAD_REQUEST, 'dateStr query parameter is required (format: YYYY-MM-DD)');
  }

  // Find template for this cleaner
  const template = await CleaningTemplate.findOne({ assignedTo: cleanerId });
  if (!template) {
    return res.status(200).json({
      success: true,
      message: 'No template cleaning checklist configured for this staff member.',
      data: null
    });
  }

  // Find existing checklist log for today
  let checklist = await CleaningChecklist.findOne({ assignedTo: cleanerId, dateStr });

  if (checklist) {
    const activeChecklist = checklist;
    // Sync checklist items with the template in case the template was updated today
    const existingItemsMap = new Map(activeChecklist.items.map(item => [item.taskName, item]));

    // Build updated items list preserving completed ones
    const syncedItems = template.items.map(taskName => {
      const existing = existingItemsMap.get(taskName);
      if (existing) {
        return existing;
      } else {
        return {
          taskName,
          completed: false,
          completedAt: null
        };
      }
    });

    // Check if anything actually changed (length, taskNames, or order)
    const itemsChanged = syncedItems.length !== activeChecklist.items.length ||
      syncedItems.some((item, idx) => {
        const existingItem = activeChecklist.items[idx];
        return !existingItem || item.taskName !== existingItem.taskName;
      });

    if (itemsChanged) {
      activeChecklist.items = syncedItems as any;
      const allCompleted = activeChecklist.items.length > 0 && activeChecklist.items.every(item => item.completed);
      activeChecklist.status = allCompleted ? 'completed' : 'pending';
      activeChecklist.completedAt = allCompleted ? (activeChecklist.completedAt || new Date()) : null;

      await activeChecklist.save();
    }
  } else {
    // If no checklist exists for today, initialize it from template
    const items = template.items.map((taskName) => ({
      taskName,
      completed: false,
      completedAt: null
    }));

    try {
      checklist = await CleaningChecklist.create({
        adminId: template.adminId,
        assignedTo: cleanerId,
        dateStr,
        items,
        status: 'pending'
      });
    } catch (err: any) {
      // Handle race condition if concurrent requests try to create it
      if (err.code === 11000) {
        checklist = await CleaningChecklist.findOne({ assignedTo: cleanerId, dateStr });
      } else {
        throw err;
      }
    }
  }

  return res.status(200).json({
    success: true,
    data: checklist
  });
});

/**
 * Toggle completed status of an item in today's checklist
 * PATCH /api/v1/cleaning/today/items/:itemId
 */
export const toggleItem = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const cleanerId = user.staffId;
  const { itemId } = req.params;
  const { completed } = req.body;

  if (completed === undefined) {
    throw new ApiError(HttpStatusCode.BAD_REQUEST, 'completed boolean value is required');
  }

  // Find cleaner's active checklist
  const checklist = await CleaningChecklist.findOne({
    assignedTo: cleanerId,
    'items._id': itemId
  });

  if (!checklist) {
    throw new ApiError(HttpStatusCode.NOT_FOUND, 'Checklist item not found');
  }

  // Find item and update it
  const itemIndex = checklist.items.findIndex(item => item._id?.toString() === itemId);
  if (itemIndex > -1 && checklist.items[itemIndex]) {
    checklist.items[itemIndex].completed = completed;
    checklist.items[itemIndex].completedAt = completed ? new Date() : null;
  }

  // Auto calculate if all items are completed
  const allCompleted = checklist.items.every(item => item.completed);
  checklist.status = allCompleted ? 'completed' : 'pending';
  checklist.completedAt = allCompleted ? new Date() : null;

  await checklist.save();

  return res.status(200).json({
    success: true,
    message: 'Checklist item updated successfully',
    data: checklist
  });
});

/**
 * Mark the entire today's checklist completed
 * PATCH /api/v1/cleaning/today/complete
 */
export const completeChecklist = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const cleanerId = user.staffId;
  const { dateStr } = req.body;

  if (!dateStr) {
    throw new ApiError(HttpStatusCode.BAD_REQUEST, 'dateStr is required');
  }

  const checklist = await CleaningChecklist.findOne({ assignedTo: cleanerId, dateStr });
  if (!checklist) {
    throw new ApiError(HttpStatusCode.NOT_FOUND, 'Checklist not found for this date');
  }

  // Mark all items completed
  checklist.items.forEach(item => {
    if (!item.completed) {
      item.completed = true;
      item.completedAt = new Date();
    }
  });

  checklist.status = 'completed';
  checklist.completedAt = new Date();

  await checklist.save();

  return res.status(200).json({
    success: true,
    message: 'Daily cleaning checklist marked completed',
    data: checklist
  });
});

/**
 * Retrieve checklist history logs
 * GET /api/v1/cleaning/logs
 */
export const getLogs = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { cleanerId, dateStr } = req.query;

  const filter: any = {};

  if (user.role === 'admin' || user.role === 'superadmin' || user.position === 'manager') {
    const ownerId = await getOwnerId(req);
    filter.adminId = ownerId;

    if (cleanerId) {
      filter.assignedTo = cleanerId;
    }
  } else if (user.position === 'cleaner') {
    // Cleaners can only see their own logs
    filter.assignedTo = user.staffId;
  } else {
    throw new ApiError(HttpStatusCode.FORBIDDEN, 'Access denied');
  }

  if (dateStr) {
    filter.dateStr = dateStr;
  }

  const logs = await CleaningChecklist.find(filter)
    .populate('assignedTo', 'fullName position email')
    .sort({ dateStr: -1, createdAt: -1 });

  return res.status(200).json({
    success: true,
    data: logs
  });
});
