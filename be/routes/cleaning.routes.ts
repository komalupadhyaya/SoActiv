import { Router } from 'express';
import {
  getTemplate,
  saveTemplate,
  getTodayChecklist,
  toggleItem,
  completeChecklist,
  getLogs
} from '../controllers/cleaning.controllers';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requirePosition, requireAdminOrManager } from '../middlewares/permission.middleware';

const cleaningRouter = Router();

// Template routes - Admin and Manager
cleaningRouter.get('/template/:cleanerId', authMiddleware, requireAdminOrManager(), getTemplate);
cleaningRouter.post('/template', authMiddleware, requireAdminOrManager(), saveTemplate);

// Cleaner checklist routes - Cleaners only
cleaningRouter.get('/today', authMiddleware, requirePosition(['cleaner']), getTodayChecklist);
cleaningRouter.patch('/today/items/:itemId', authMiddleware, requirePosition(['cleaner']), toggleItem);
cleaningRouter.patch('/today/complete', authMiddleware, requirePosition(['cleaner']), completeChecklist);

// Logs routes - Admin, Manager, Cleaner
cleaningRouter.get('/logs', authMiddleware, requirePosition(['cleaner', 'manager']), getLogs);

export default cleaningRouter;
