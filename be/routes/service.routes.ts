import { Router } from 'express';
import {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  togglePromote,
  toggleStatus,
  addVariation,
  deleteVariation,
  toggleVariationStatus,
} from '../controllers/service.controllers';
import { authMiddleware } from '../middlewares/auth.middleware';
import { checkGymStatus } from '../middlewares/checkGymStatus.middleware';

const serviceRouter = Router();

serviceRouter.use(authMiddleware);
serviceRouter.use(checkGymStatus);

serviceRouter.get('/', getAllServices);
serviceRouter.get('/:id', getServiceById);
serviceRouter.post('/', createService);
serviceRouter.put('/:id', updateService);
serviceRouter.delete('/:id', deleteService);

serviceRouter.patch('/:id/toggle-promote', togglePromote);
serviceRouter.patch('/:id/toggle-status', toggleStatus);

serviceRouter.post('/:id/variations', addVariation);
serviceRouter.patch('/:id/variations/:variationId/toggle-status', toggleVariationStatus);
serviceRouter.delete('/:id/variations/:variationId', deleteVariation);

export default serviceRouter;

