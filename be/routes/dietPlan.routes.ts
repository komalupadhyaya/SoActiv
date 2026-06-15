import { Router } from "express";
import {
  getActiveDietPlan,
  logIntake,
  resetTodayLog,
  updateDietTargets,
  getClientDietPlan,
  assignMealPlan,
  addTrainerNote,
} from "../controllers/dietPlan.controllers.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { checkGymFeature } from "../middlewares/featureFlag.middleware.js";

const dietPlanRouter = Router();

// ── Member endpoints ─────────────────────────────────────────────────────────
dietPlanRouter.get("/active", authMiddleware, checkGymFeature('memberPortal'), getActiveDietPlan);
dietPlanRouter.patch("/log", authMiddleware, checkGymFeature('memberPortal'), logIntake);
dietPlanRouter.patch("/log/reset", authMiddleware, checkGymFeature('memberPortal'), resetTodayLog);
dietPlanRouter.put("/targets", authMiddleware, checkGymFeature('memberPortal'), updateDietTargets);

// ── Trainer / Staff endpoints ────────────────────────────────────────────────
dietPlanRouter.get("/client/:clientId", authMiddleware, getClientDietPlan);
dietPlanRouter.put("/client/:clientId/assign", authMiddleware, assignMealPlan);
dietPlanRouter.patch("/client/:clientId/notes", authMiddleware, addTrainerNote);

export default dietPlanRouter;
