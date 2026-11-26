// biometric/biometric.routes.ts

import { Router } from 'express';
import { BiometricController } from './biometric.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// EVENT INGESTION & TEST ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// Device Event Ingestion (Adapter / Push webhook target)
router.post('/events', BiometricController.handleBiometricEvent);

// Mock Device Test Event (Runs same business pipeline)
router.post('/test-event', BiometricController.handleTestEvent);

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED MANAGEMENT ROUTES (Admin / Superadmin)
// ─────────────────────────────────────────────────────────────────────────────
router.use(authMiddleware);

// Device Management
router.post('/devices', BiometricController.createDevice);
router.get('/devices', BiometricController.getDevices);
router.get('/devices/:id', BiometricController.getDeviceById);
router.put('/devices/:id', BiometricController.updateDevice);
router.delete('/devices/:id', BiometricController.deleteDevice);
router.get('/devices/:id/status', BiometricController.getDeviceStatus);

// Biometric User Mapping
router.post('/users', BiometricController.createBiometricUser);
router.get('/users', BiometricController.getBiometricUsers);
router.put('/users/:id', BiometricController.updateBiometricUser);
router.delete('/users/:id', BiometricController.deleteBiometricUser);

// Audit Logs & Attendance
router.get('/events', BiometricController.getEventLogs);
router.get('/attendance', BiometricController.getBiometricAttendance);

export default router;
