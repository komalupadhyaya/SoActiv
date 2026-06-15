import type { Request, Response } from 'express';
import FitnessGoal from '../models/fitnessGoal.model';

// Helper to determine if a milestone has been achieved based on target direction (e.g. weight loss vs steps gain)
const checkMilestoneStatus = (start: number, target: number, current: number, milestoneTarget: number): boolean => {
  const isDecreasing = target < start;
  if (isDecreasing) {
    return current <= milestoneTarget;
  } else {
    return current >= milestoneTarget;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/fitness-goals
// Create a new fitness goal with optional milestones
// ─────────────────────────────────────────────────────────────────────────────
export const createGoal = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { title, type, startValue, targetValue, unit, deadline, milestones } = req.body;

    if (!title || !type || startValue === undefined || targetValue === undefined) {
      res.status(400).json({ success: false, message: 'Please provide title, type, startValue, and targetValue.' });
      return;
    }

    const goal = await FitnessGoal.create({
      member: user.id || user._id,
      title,
      type,
      startValue,
      targetValue,
      currentValue: startValue, // Initial progress is always the starting value
      unit: unit || 'kg',
      deadline: deadline ? new Date(deadline) : undefined,
      milestones: (milestones || []).map((m: any) => ({
        title: m.title,
        targetValue: m.targetValue,
        isCompleted: false
      })),
      weeklyLogs: [
        {
          weekStartDate: new Date(),
          loggedValue: startValue,
          notes: 'Goal created! Tracking started.',
          createdAt: new Date()
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Fitness goal created successfully!',
      goal
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create fitness goal.',
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/fitness-goals
// Retrieve all goals logged by the current member
// ─────────────────────────────────────────────────────────────────────────────
export const getGoals = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;

    const goals = await FitnessGoal.find({ member: user.id || user._id })
      .sort({ createdAt: -1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      total: goals.length,
      goals
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve fitness goals.',
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/fitness-goals/:id/progress
// Log a new progress metric, auto-updating milestones and creating progress logs
// ─────────────────────────────────────────────────────────────────────────────
export const updateProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { value, notes } = req.body;

    if (value === undefined) {
      res.status(400).json({ success: false, message: 'Please provide new progress value.' });
      return;
    }

    const goal = await FitnessGoal.findOne({ _id: id, member: user.id || user._id });

    if (!goal) {
      res.status(404).json({ success: false, message: 'Fitness goal not found.' });
      return;
    }

    const newValue = parseFloat(value);
    goal.currentValue = newValue;

    // 1. Check & Auto-complete Milestones
    goal.milestones.forEach((milestone) => {
      const isCompletedNow = checkMilestoneStatus(goal.startValue, goal.targetValue, newValue, milestone.targetValue);
      if (isCompletedNow && !milestone.isCompleted) {
        milestone.isCompleted = true;
        milestone.completedAt = new Date();
      } else if (!isCompletedNow && milestone.isCompleted) {
        // Fallback: if they revert metrics, unlock milestone
        milestone.isCompleted = false;
        milestone.completedAt = undefined;
      }
    });

    // 2. Auto-complete main goal if target achieved
    const goalAchieved = checkMilestoneStatus(goal.startValue, goal.targetValue, newValue, goal.targetValue);
    if (goalAchieved) {
      goal.status = 'completed';
    } else {
      goal.status = 'active';
    }

    // 3. Add Weekly Log entry
    goal.weeklyLogs.push({
      weekStartDate: new Date(),
      loggedValue: newValue,
      notes: notes || 'Logged progress update.',
      createdAt: new Date()
    });

    await goal.save();

    res.status(200).json({
      success: true,
      message: 'Progress metrics and milestones synchronized successfully!',
      goal
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update goal progress.',
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/fitness-goals/:id/milestone/:milestoneId
// Manually toggle a milestone completion status
// ─────────────────────────────────────────────────────────────────────────────
export const toggleMilestone = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { id, milestoneId } = req.params;

    const goal = await FitnessGoal.findOne({ _id: id, member: user.id || user._id });
    if (!goal) {
      res.status(404).json({ success: false, message: 'Fitness goal not found.' });
      return;
    }

    const milestone = goal.milestones.id(milestoneId);
    if (!milestone) {
      res.status(404).json({ success: false, message: 'Milestone not found.' });
      return;
    }

    milestone.isCompleted = !milestone.isCompleted;
    milestone.completedAt = milestone.isCompleted ? new Date() : undefined;

    await goal.save();

    res.status(200).json({
      success: true,
      message: `Milestone status toggled to ${milestone.isCompleted ? 'Completed' : 'Pending'}.`,
      goal
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to toggle milestone.',
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/v1/fitness-goals/:id
// Delete a specific fitness goal safely
// ─────────────────────────────────────────────────────────────────────────────
export const deleteGoal = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const deleted = await FitnessGoal.findOneAndDelete({ _id: id, member: user.id || user._id });
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Fitness goal not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Fitness goal removed successfully!'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete fitness goal.',
      error: error.message
    });
  }
};
