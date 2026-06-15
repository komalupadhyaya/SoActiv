import { Router } from 'express';
import {
    createContact,
    getContacts,
    updateContactStatus,
    getContactStats,
    getGymContacts,
    updateGymContactStatus,
    getMyContacts
} from '../controllers/contact.controllers';
import { requireSuperAdminAuth } from '../middlewares/superAdminAuth.middleware';
import { softAuthMiddleware } from '../middlewares/softAuth.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireAdminOrManager, requirePosition } from '../middlewares/permission.middleware';
import { asyncHandler } from '../lib/AsyncHandler';

const router = Router();

/**
 * @route   GET /api/v1/contact/my
 * @desc    Get support messages sent by the logged-in member
 * @access  Private (Member)
 */
router.get('/my', authMiddleware, asyncHandler(getMyContacts));

/**
 * @route   POST /api/v1/contact
 * @desc    Submit a support message (Public or Admin)
 * @access  Public / Admin (Soft Auth used to determine source/gymId)
 */
router.post('/', softAuthMiddleware, createContact);

/**
 * @route   GET /api/v1/contact/superadmin/list
 * @desc    List all support messages
 * @access  Private (SuperAdmin)
 */
router.get('/superadmin/list', requireSuperAdminAuth, getContacts);

/**
 * @route   GET /api/v1/contact/superadmin/stats
 * @desc    Get support statistics
 * @access  Private (SuperAdmin)
 */
router.get('/superadmin/stats', requireSuperAdminAuth, getContactStats);

/**
 * @route   PATCH /api/v1/contact/superadmin/:id/status
 * @desc    Update support message status
 * @access  Private (SuperAdmin)
 */
router.patch('/superadmin/:id/status', requireSuperAdminAuth, updateContactStatus);

/**
 * @route   GET /api/v1/contact/gym/list
 * @desc    List support messages from members of the current gym
 * @access  Private (Gym Admin / Manager)
 */
router.get('/gym/list', authMiddleware, requirePosition(['manager', 'receptionist']), getGymContacts);

/**
 * @route   PATCH /api/v1/contact/gym/:id/status
 * @desc    Update support message status for the current gym
 * @access  Private (Gym Admin / Manager)
 */
router.patch('/gym/:id/status', authMiddleware, requireAdminOrManager(), updateGymContactStatus);

export default router;
