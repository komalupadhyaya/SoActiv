// routes/staffTarget.routes.ts
import { Router } from 'express';
import {
  getStaffTargets,
  createStaffTarget,
  updateStaffTarget,
  deleteStaffTarget,
} from '../controllers/staffTarget.controllers';
import { authMiddleware } from '../middlewares/auth.middleware';

const staffTargetRouter = Router();

staffTargetRouter.get('/', authMiddleware, getStaffTargets);
staffTargetRouter.post('/', authMiddleware, createStaffTarget);
staffTargetRouter.put('/:id', authMiddleware, updateStaffTarget);
staffTargetRouter.delete('/:id', authMiddleware, deleteStaffTarget);

export default staffTargetRouter;
