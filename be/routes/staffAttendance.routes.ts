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

const staffAttendance_router = Router();

staffAttendance_router.post('/', authMiddleware, markAttendance);
staffAttendance_router.put('/:id', authMiddleware, updateAttendance);
staffAttendance_router.get('/date/:date', authMiddleware, getAttendanceByDate);
staffAttendance_router.get('/sheet/:date', authMiddleware, getDailyAttendanceSheet);
staffAttendance_router.get('/staff/:staffId', authMiddleware, getAttendanceByStaff);
staffAttendance_router.delete('/:id', authMiddleware, deleteAttendance);
staffAttendance_router.get('/monthly', authMiddleware, getMonthlyAttendanceReport);

export default staffAttendance_router;