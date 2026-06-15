import { Router } from 'express';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
} from '../controllers/notification.controllers';
import { authMiddleware } from '../middlewares/auth.middleware';

const notificationRouter = Router();

// All routes require authentication
notificationRouter.use(authMiddleware);

// POST /api/v1/notifications/test-mock  — dispatch a mock notification to yourself
notificationRouter.post('/test-mock', (async (req: any, res: any) => {
  try {
    const { createNotification } = await import('../utils/notification.helper');
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    await createNotification({
      recipientId: userId,
      recipientRole: (req.user?.role as any) || 'member',
      type: 'announcement',
      title: '🥗 Test Notification Spark!',
      message: 'This is a mock notification generated to test the live bell icon, unread badges, and individual hover deletion!',
      link: req.user?.role === 'member' ? '/member/dashboard' : '/staff/dashboard',
    });

    return res.status(201).json({ success: true, message: 'Mock notification successfully created' });
  } catch (error) {
    console.error('test-mock error:', error);
    return res.status(500).json({ success: false, message: 'Could not create mock notification' });
  }
}) as any);

// POST /api/v1/notifications/test-meal-reminder  — trigger a check and notification dispatch for a meal type
notificationRouter.post('/test-meal-reminder', (async (req: any, res: any) => {
  try {
    const { meal } = req.body;
    if (!meal || !['Breakfast', 'Lunch', 'Snacks', 'Dinner'].includes(meal)) {
      return res.status(400).json({ success: false, message: 'Invalid meal type. Must be Breakfast, Lunch, Snacks, or Dinner.' });
    }

    const { checkAndNotifyMealMissed } = await import('../utils/mealReminder.scheduler.js');
    await checkAndNotifyMealMissed(meal);

    return res.status(200).json({ success: true, message: `Completed check and dispatched reminders for: ${meal}` });
  } catch (error) {
    console.error('test-meal-reminder error:', error);
    return res.status(500).json({ success: false, message: 'Could not execute meal reminder check' });
  }
}) as any);

// GET  /api/v1/notifications            — paginated list + unread count
notificationRouter.get('/', getNotifications);

// PATCH /api/v1/notifications/read-all  — mark all as read (must be before /:id)
notificationRouter.patch('/read-all', markAllNotificationsRead);

// PATCH /api/v1/notifications/:id/read  — mark one as read
notificationRouter.patch('/:id/read', markNotificationRead);

// DELETE /api/v1/notifications          — clear all
notificationRouter.delete('/', clearAllNotifications);

// DELETE /api/v1/notifications/:id      — delete one
notificationRouter.delete('/:id', deleteNotification);

export default notificationRouter;
