// routes/attendance.routes.ts
import { Router } from 'express';
import {
  markAttendance,
  updateAttendance,
  getAttendanceByDate,
  getDailyAttendanceSheet,
  getAttendanceByStaff,
  deleteAttendance,
  getMonthlyAttendanceReport,
} from "../controllers/staffAttendance.controllers";
import { authMiddleware } from '../middlewares/auth.middleware';
import { checkGymFeature } from '../middlewares/featureFlag.middleware';

const staffAttendance_router = Router();

staffAttendance_router.post('/', authMiddleware, checkGymFeature('attendance'), markAttendance);
staffAttendance_router.put('/:id', authMiddleware, checkGymFeature('attendance'), updateAttendance);
staffAttendance_router.get('/date/:date', authMiddleware, checkGymFeature('attendance'), getAttendanceByDate);
staffAttendance_router.get('/sheet/:date', authMiddleware, checkGymFeature('attendance'), getDailyAttendanceSheet);
staffAttendance_router.get('/staff/:staffId', authMiddleware, checkGymFeature('attendance'), getAttendanceByStaff);
staffAttendance_router.delete('/:id', authMiddleware, checkGymFeature('attendance'), deleteAttendance);
staffAttendance_router.get('/monthly', authMiddleware, checkGymFeature('attendance'), getMonthlyAttendanceReport);

export default staffAttendance_router;