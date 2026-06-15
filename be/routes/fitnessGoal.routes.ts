import { Router } from 'express';
import {
  createGoal,
  getGoals,
  updateProgress,
  toggleMilestone,
  deleteGoal
} from '../controllers/fitnessGoal.controllers';
import { authMiddleware } from '../middlewares/auth.middleware';
import { checkGymFeature } from '../middlewares/featureFlag.middleware';

const fitnessGoalRouter = Router();

// GET & POST goals
fitnessGoalRouter.route('/')
  .post(authMiddleware, checkGymFeature('memberPortal'), createGoal)
  .get(authMiddleware, checkGymFeature('memberPortal'), getGoals);

// DELETE fitness goal
fitnessGoalRouter.delete('/:id', authMiddleware, checkGymFeature('memberPortal'), deleteGoal);

// PATCH progressive target stats
fitnessGoalRouter.patch('/:id/progress', authMiddleware, checkGymFeature('memberPortal'), updateProgress);

// PATCH manual milestone completion trigger
fitnessGoalRouter.patch('/:id/milestone/:milestoneId', authMiddleware, checkGymFeature('memberPortal'), toggleMilestone);

export default fitnessGoalRouter;
