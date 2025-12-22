import { Router } from 'express';
import {
    createContact,
    getContacts,
    updateContactStatus,
    getContactStats
} from '../controllers/contact.controllers';
import { requireSuperAdminAuth } from '../middlewares/superAdminAuth.middleware';
import { softAuthMiddleware } from '../middlewares/softAuth.middleware';

const router = Router();

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

export default router;
