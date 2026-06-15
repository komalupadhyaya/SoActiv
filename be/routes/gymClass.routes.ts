import { Router } from 'express';
import {
    createGymClass,
    getGymClasses,
    getGymClassById,
    updateGymClass,
    deleteGymClass,
    getMyClasses,
} from '../controllers/gymClass.controllers';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireAdminOrManager, requirePosition } from '../middlewares/permission.middleware';
import { asyncHandler } from '../lib/AsyncHandler';

const gymClassRouter = Router();

/**
 * @route   GET /api/v1/classes/my-classes
 * @desc    Get trainer's own classes
 * @access  Trainer
 */
gymClassRouter.get('/my-classes', authMiddleware, asyncHandler(getMyClasses));

/**
 * @route   POST /api/v1/classes
 * @desc    Create a new class
 * @access  Admin, Manager
 */
gymClassRouter.post('/', authMiddleware, requireAdminOrManager(), asyncHandler(createGymClass));

/**
 * @route   GET /api/v1/classes
 * @desc    Get all classes (filtered by role)
 * @access  Admin, Manager, Trainer
 */
gymClassRouter.get('/', authMiddleware, asyncHandler(getGymClasses));

/**
 * @route   GET /api/v1/classes/:id
 * @desc    Get a class by ID
 * @access  Admin, Manager, Trainer
 */
gymClassRouter.get('/:id', authMiddleware, asyncHandler(getGymClassById));

/**
 * @route   PUT /api/v1/classes/:id
 * @desc    Update a class
 * @access  Admin, Manager
 */
gymClassRouter.put('/:id', authMiddleware, requireAdminOrManager(), asyncHandler(updateGymClass));

/**
 * @route   DELETE /api/v1/classes/:id
 * @desc    Cancel/delete a class
 * @access  Admin, Manager
 */
gymClassRouter.delete('/:id', authMiddleware, requireAdminOrManager(), asyncHandler(deleteGymClass));

export default gymClassRouter;
