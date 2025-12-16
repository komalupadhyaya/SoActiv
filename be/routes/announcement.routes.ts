import { Router } from 'express';
import {
    createAnnouncement,
    getAnnouncements,
    updateAnnouncement,
    deleteAnnouncement
} from '../controllers/announcement.controllers';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requirePosition, requireAdminOrManager } from '../middlewares/permission.middleware';

const announcementRouter = Router();

// Create - Admin & Manager
announcementRouter.post('/', authMiddleware, requireAdminOrManager(), createAnnouncement);

// Read - All Authenticated Roles
announcementRouter.get('/', authMiddleware, getAnnouncements);

// Update/Delete - Admin & Manager
announcementRouter.put('/:id', authMiddleware, requireAdminOrManager(), updateAnnouncement);
announcementRouter.delete('/:id', authMiddleware, requireAdminOrManager(), deleteAnnouncement);

export default announcementRouter;
