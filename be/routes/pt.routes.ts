import { Router } from 'express';
import {
    createPTPlan,
    getPTPlans,
    updatePTPlan,
    togglePTPlanStatus,
    assignPT,
    getPTAssignments,
    logPTSession,
    checkPTExpiry
} from '../controllers/pt.controllers';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireAdmin, requirePosition, requireAdminOrManager } from '../middlewares/permission.middleware';
import { checkGymFeature } from '../middlewares/featureFlag.middleware';

const ptRouter = Router();

// ==============================================================================
// PT PLANS (Admin Only mostly)
// ==============================================================================

// Create Plan - Admin Only
ptRouter.post('/plans', authMiddleware, checkGymFeature('pt'), requireAdmin(), createPTPlan);

// Get Plans - Admin, Manager, Sales (to sell)
// Assuming requirePosition checks "allow if role is in list".
// If we want all staff to see plans to sell them? Or just admin/manager/sales?
// Let's allow Admin, Manager, Sales, Receptionist to VIEW plans.
ptRouter.get('/plans', authMiddleware, checkGymFeature('pt'), requirePosition(['admin', 'manager', 'sales', 'receptionist']), getPTPlans);

// Update Plan - Admin Only
ptRouter.put('/plans/:id', authMiddleware, checkGymFeature('pt'), requireAdmin(), updatePTPlan);

// Toggle Status - Admin Only
ptRouter.patch('/plans/:id/status', authMiddleware, checkGymFeature('pt'), requireAdmin(), togglePTPlanStatus);

// ==============================================================================
// PT ASSIGNMENTS (Selling & Viewing)
// ==============================================================================

// Assign PT (Sell) - Admin, Manager, Sales
ptRouter.post('/assignments', authMiddleware, checkGymFeature('pt'), requirePosition(['admin', 'manager', 'sales']), assignPT);

// Get Assignments - Admin (All), Manager (All), Trainer (Own), Reception (All - checks status?)
// Controller handles the filtering logic based on role. Middleware just ensures they are authenticated staff.
ptRouter.get('/assignments', authMiddleware, checkGymFeature('pt'), getPTAssignments);

// Log Session - Trainer Only (or Admin/Manager override)
// Anyone with 'trainer' role or admin/manager.
// Logic inside controller validates "Own Client" for trainers.
ptRouter.post('/assignments/:id/session', authMiddleware, checkGymFeature('pt'), requirePosition(['admin', 'manager', 'trainer']), logPTSession);

// Check Expiry - Admin/Manager or automated
ptRouter.post('/expiry-check', authMiddleware, checkGymFeature('pt'), requireAdminOrManager(), checkPTExpiry);

export default ptRouter;
