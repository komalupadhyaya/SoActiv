import { Router } from 'express';
import {
  createClient,
  getAllClients,
  getClientById,
  updateClientById,
  deleteClientById,
} from '../controllers/client.controllers';
import { bulkUploadClients } from '../controllers/client.bulk.controllers';
import {
  getExpiringPTPackages,
  getExpiringPTByTrainer,
  getClientPTStatus,
} from '../controllers/pt.expiry.controllers';
import { authMiddleware } from '../middlewares/auth.middleware';
import { bulkUpload } from '../middlewares/upload.middleware';
import { asyncHandler } from '../lib/AsyncHandler';

const clientRouter = Router();

/**
 * @route   POST /api/v1/client/bulk-upload
 * @desc    Bulk upload clients via CSV or XML
 * @access  Private
 */
clientRouter.post('/bulk-upload', authMiddleware, bulkUpload.single('file'), bulkUploadClients);

/**
 * @route   GET /api/v1/client/pt-expiring/by-trainer
 * @desc    Get PT packages expiring grouped by trainer
 * @access  Private (Admin only)
 * @note    Must come before /:id route to avoid matching "pt-expiring" as an ID
 */
clientRouter.get('/pt-expiring/by-trainer', authMiddleware, asyncHandler(getExpiringPTByTrainer));

/**
 * @route   GET /api/v1/client/pt-expiring
 * @desc    Get all clients with PT packages that are expiring soon or already expired
 * @access  Private (Admin, Trainer)
 * @note    Must come before /:id route to avoid matching "pt-expiring" as an ID
 */
clientRouter.get('/pt-expiring', authMiddleware, asyncHandler(getExpiringPTPackages));

/**
 * @route   POST /api/v1/client
 * @desc    Create a new client (user-owned)
 * @access  Private
 */
clientRouter.post('/', authMiddleware, createClient);

/**
 * @route   GET /api/v1/client
 * @desc    Get all clients for logged-in user (with optional filters)
 * @access  Private
 */
clientRouter.get('/', authMiddleware, getAllClients);

/**
 * @route   GET /api/v1/client/:id/pt-status
 * @desc    Get PT status for a specific client
 * @access  Private
 */
clientRouter.get('/:id/pt-status', authMiddleware, asyncHandler(getClientPTStatus));

/**
 * @route   GET /api/v1/client/:id
 * @desc    Get a single client by ID (must belong to user)
 * @access  Private
 */
clientRouter.get('/:id', authMiddleware, getClientById);

/**
 * @route   PUT /api/v1/client/:id
 * @desc    Update a client (must belong to user)
 * @access  Private
 */
clientRouter.put('/:id', authMiddleware, updateClientById);

/**
 * @route   DELETE /api/v1/client/:id
 * @desc    Delete a client (must belong to user)
 * @access  Private
 */
clientRouter.delete('/:id', authMiddleware, deleteClientById);

export default clientRouter;