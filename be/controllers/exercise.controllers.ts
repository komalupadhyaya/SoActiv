import type { Request, Response, NextFunction } from 'express';
import Exercise from '../models/exercise.model';
import { Client } from '../models/client.model';
import ApiError from '../lib/ApiError';
import { HttpStatusCode } from '../lib/const';

/**
 * Helper to require admin or staff roles for management actions
 */
const requireStaffOrAdmin = (req: Request) => {
  const user = (req as any).user;
  if (!user) {
    throw new ApiError(HttpStatusCode.UNAUTHORIZED, "Unauthorized");
  }
  if (user.role !== "staff" && user.role !== "admin" && user.role !== "superadmin") {
    throw new ApiError(HttpStatusCode.FORBIDDEN, "Only admin/staff can manage exercises");
  }
  return user;
};

/**
 * Create Exercise
 */
export const createExercise = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = requireStaffOrAdmin(req);
    const { title, category, muscleTargeting, difficulty, videoUrl, instructions } = req.body;

    if (!title || !category || !muscleTargeting || !difficulty || !videoUrl) {
      throw new ApiError(HttpStatusCode.BAD_REQUEST, "Missing required exercise fields");
    }

    // Resolve gym owner adminId
    const adminId = user.adminId || user.id || user._id;

    const exercise = await Exercise.create({
      adminId,
      title,
      category,
      muscleTargeting,
      difficulty,
      videoUrl,
      instructions: instructions || [],
      createdBy: user.id || user._id,
    });

    res.status(HttpStatusCode.CREATED).json({
      success: true,
      message: "Exercise created successfully",
      data: exercise,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Exercises
 * Automatically handles tenant scoping:
 * - If user is a member: resolves their gym owner's adminId using the Client collection and scopes query to that adminId.
 * - Otherwise: scopes query to the user's adminId.
 */
export const getExercises = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user) {
      throw new ApiError(HttpStatusCode.UNAUTHORIZED, "Unauthorized");
    }

    let adminId: string;

    if (user.role === 'member') {
      const clientRecord = await Client.findOne({ email: user.email?.toLowerCase() }).select('userId');
      if (!clientRecord) {
        return res.status(HttpStatusCode.OK).json({ success: true, data: [] });
      }
      adminId = clientRecord.userId.toString();
    } else {
      adminId = user.adminId || user.id || user._id;
    }

    const { category, difficulty, search } = req.query;

    const filter: any = { adminId };

    if (category) {
      filter.category = category;
    }

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    if (search) {
      // Fuzzy search by title or targeted muscle
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { muscleTargeting: { $regex: search, $options: 'i' } }
      ];
    }

    const exercises = await Exercise.find(filter).sort({ createdAt: -1 });

    res.status(HttpStatusCode.OK).json({
      success: true,
      data: exercises,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Exercise
 */
export const updateExercise = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = requireStaffOrAdmin(req);
    const { id } = req.params;
    const updates = req.body;

    // Prevent changing immutable values
    delete updates.adminId;
    delete updates.createdBy;

    const exercise = await Exercise.findById(id);
    if (!exercise) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Exercise not found");
    }

    // Verify creator scope matches
    const adminId = user.adminId || user.id || user._id;
    if (exercise.adminId.toString() !== adminId.toString()) {
      throw new ApiError(HttpStatusCode.FORBIDDEN, "Access denied: cannot update other gym's exercises");
    }

    const updatedExercise = await Exercise.findByIdAndUpdate(id, updates, { new: true });

    res.status(HttpStatusCode.OK).json({
      success: true,
      message: "Exercise updated successfully",
      data: updatedExercise,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Exercise
 */
export const deleteExercise = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = requireStaffOrAdmin(req);
    const { id } = req.params;

    const exercise = await Exercise.findById(id);
    if (!exercise) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Exercise not found");
    }

    // Verify creator scope matches
    const adminId = user.adminId || user.id || user._id;
    if (exercise.adminId.toString() !== adminId.toString()) {
      throw new ApiError(HttpStatusCode.FORBIDDEN, "Access denied: cannot delete other gym's exercises");
    }

    await Exercise.findByIdAndDelete(id);

    res.status(HttpStatusCode.OK).json({
      success: true,
      message: "Exercise deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
