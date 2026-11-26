import { Router } from 'express';
import { getDsrReport, getRevenueReport } from '../controllers/report.controllers';
import { authMiddleware } from '../middlewares/auth.middleware';
import { checkGymStatus } from '../middlewares/checkGymStatus.middleware';
import { asyncHandler } from '../lib/AsyncHandler';

const reportRouter = Router();

reportRouter.use(authMiddleware);
reportRouter.use(checkGymStatus);

/**
 * @route   GET /api/v1/reports/dsr
 * @desc    Get DSR Report for specified month and year
 * @access  Private
 */
reportRouter.get('/dsr', asyncHandler(getDsrReport));

/**
 * @route   GET /api/v1/reports/revenue
 * @desc    Get Annual Revenue Report for specified year
 * @access  Private
 */
reportRouter.get('/revenue', asyncHandler(getRevenueReport));

export default reportRouter;
