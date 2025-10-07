import { Router } from 'express';
import {
  createClient,
  getAllClients,
  getClientById,
  updateClientById,
  deleteClientById,
} from '../controllers/client.controllers';
import { authMiddleware } from '../middlewares/auth.middleware';
 
const clientRouter = Router();
 
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