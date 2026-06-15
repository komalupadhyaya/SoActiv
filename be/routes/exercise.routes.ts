import { Router } from 'express';
import {
  createExercise,
  getExercises,
  updateExercise,
  deleteExercise
} from '../controllers/exercise.controllers';
import { authMiddleware } from '../middlewares/auth.middleware';
import { checkGymFeature } from '../middlewares/featureFlag.middleware';

const exerciseRouter = Router();

// GET & POST exercises
exerciseRouter.route('/')
  .post(authMiddleware, createExercise)
  .get(authMiddleware, checkGymFeature('memberPortal'), getExercises);

// PUT & DELETE exercises by ID
exerciseRouter.route('/:id')
  .put(authMiddleware, updateExercise)
  .delete(authMiddleware, deleteExercise);

export default exerciseRouter;
