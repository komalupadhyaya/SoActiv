import type { Request, Response } from "express";
import { asyncHandler } from "../lib/AsyncHandler.js";
import ApiError from "../lib/ApiError.js";
import ApiResponse from "../lib/ApiResponse.js";
import { HttpStatusCode } from "../lib/const.js";
import DietPlan from "../models/dietPlan.model.js";
import { Client } from "../models/client.model.js";
import { User } from "../models/user.model.js";
import { createNotification } from "../utils/notification.helper";

// ── Helper to resolve member User ID from client ID (e.g. Client _id or email) ──
const resolveMemberId = async (clientId: string): Promise<string> => {
  try {
    const client = await Client.findById(clientId);
    if (client) {
      const user = await User.findOne({ email: client.email });
      if (user) return user._id.toString();
    }
  } catch (err) {
    // Ignore cast/lookup errors
  }

  try {
    const user = await User.findById(clientId);
    if (user) return user._id.toString();
  } catch (err) {
    // Ignore cast/lookup errors
  }

  const userByEmail = await User.findOne({ email: clientId });
  if (userByEmail) return userByEmail._id.toString();

  return clientId;
};

// ── Default seeded meal plan for first-time users ────────────────────────────
const defaultMealPlan = [
  {
    day: "Everyday",
    meals: [
      {
        name: "Protein-Rich Breakfast",
        type: "Breakfast",
        calories: 450,
        protein: 35,
        carbs: 45,
        fat: 12,
        items: ["3 Egg Whites + 1 Whole Egg", "Whole Wheat Toast (2 slices)", "Low-fat Greek Yogurt (150g)", "Mixed Berries (80g)"],
      },
      {
        name: "Balanced Power Lunch",
        type: "Lunch",
        calories: 620,
        protein: 45,
        carbs: 65,
        fat: 18,
        items: ["Grilled Chicken Breast (150g)", "Brown Rice (100g cooked)", "Steamed Broccoli (120g)", "Olive Oil Dressing (1 tbsp)"],
      },
      {
        name: "Light Afternoon Snack",
        type: "Snacks",
        calories: 180,
        protein: 15,
        carbs: 20,
        fat: 5,
        items: ["Whey Protein Shake (1 scoop)", "Banana (1 medium)", "Almonds (15g)"],
      },
      {
        name: "Lean Recovery Dinner",
        type: "Dinner",
        calories: 550,
        protein: 40,
        carbs: 50,
        fat: 18,
        items: ["Salmon Fillet (130g)", "Quinoa (80g cooked)", "Roasted Sweet Potato (100g)", "Mixed Salad with Lemon Dressing"],
      },
    ],
  },
];

// ── GET /api/v1/diet-plans/active ─────────────────────────────────────────────
export const getActiveDietPlan = asyncHandler(async (req: Request, res: Response) => {
  const memberId = (req as any).user?.id;
  if (!memberId) throw new ApiError(HttpStatusCode.UNAUTHORIZED, "Unauthorized");

  let plan = await DietPlan.findOne({ member: memberId });

  // Auto-initialize default plan for first-time users
  if (!plan) {
    plan = await DietPlan.create({
      member: memberId,
      dailyCalorieTarget: 2000,
      dailyWaterTarget: 2500,
      dailyMacroTargets: { protein: 150, carbs: 200, fat: 65 },
      mealPlans: defaultMealPlan,
      dailyLogs: [],
    });
  }

  return res
    .status(HttpStatusCode.OK)
    .json(new ApiResponse(HttpStatusCode.OK, plan, "Diet plan fetched successfully"));
});

// ── PATCH /api/v1/diet-plans/log ─────────────────────────────────────────────
// Log today's intake: calories, water, and/or macros
export const logIntake = asyncHandler(async (req: Request, res: Response) => {
  const memberId = (req as any).user?.id;
  if (!memberId) throw new ApiError(HttpStatusCode.UNAUTHORIZED, "Unauthorized");

  const { calories, water, protein, carbs, fat, mealType } = req.body;

  // Date key in YYYY-MM-DD format
  const today = new Date().toISOString().slice(0, 10);

  let plan = await DietPlan.findOne({ member: memberId });
  if (!plan) throw new ApiError(HttpStatusCode.NOT_FOUND, "Diet plan not found. Load the nutrition page first.");

  // Find or create today's log
  let todayLog = plan.dailyLogs.find((log: any) => log.date === today);
  if (!todayLog) {
    plan.dailyLogs.push({
      date: today,
      caloriesLogged: 0,
      waterLogged: 0,
      macrosLogged: { protein: 0, carbs: 0, fat: 0 },
      mealsLogged: [],
    });
    todayLog = plan.dailyLogs[plan.dailyLogs.length - 1];
  }

  // Accumulate incremental values (never replace — always add)
  if (calories != null) todayLog.caloriesLogged += Number(calories);
  if (water != null) todayLog.waterLogged += Number(water);
  if (protein != null) todayLog.macrosLogged.protein += Number(protein);
  if (carbs != null) todayLog.macrosLogged.carbs += Number(carbs);
  if (fat != null) todayLog.macrosLogged.fat += Number(fat);

  // If a specific meal type was logged, add it to mealsLogged array
  if (mealType) {
    if (!todayLog.mealsLogged) {
      todayLog.mealsLogged = [];
    }
    if (!todayLog.mealsLogged.includes(mealType)) {
      todayLog.mealsLogged.push(mealType);
    }
  }

  // Cap at target to prevent overflow display
  todayLog.caloriesLogged = Math.min(todayLog.caloriesLogged, plan.dailyCalorieTarget * 2);
  todayLog.waterLogged = Math.min(todayLog.waterLogged, plan.dailyWaterTarget * 2);

  plan.markModified("dailyLogs");
  await plan.save();

  return res
    .status(HttpStatusCode.OK)
    .json(new ApiResponse(HttpStatusCode.OK, plan, "Intake logged successfully"));
});

// ── PATCH /api/v1/diet-plans/log/reset ────────────────────────────────────────
// Reset today's log to zero (for testing or user request)
export const resetTodayLog = asyncHandler(async (req: Request, res: Response) => {
  const memberId = (req as any).user?.id;
  if (!memberId) throw new ApiError(HttpStatusCode.UNAUTHORIZED, "Unauthorized");

  const today = new Date().toISOString().slice(0, 10);
  const plan = await DietPlan.findOne({ member: memberId });
  if (!plan) throw new ApiError(HttpStatusCode.NOT_FOUND, "Diet plan not found.");

  const idx = plan.dailyLogs.findIndex((log: any) => log.date === today);
  if (idx !== -1) {
    plan.dailyLogs[idx].caloriesLogged = 0;
    plan.dailyLogs[idx].waterLogged = 0;
    plan.dailyLogs[idx].macrosLogged = { protein: 0, carbs: 0, fat: 0 };
    plan.dailyLogs[idx].mealsLogged = [];
    plan.markModified("dailyLogs");
    await plan.save();
  }

  return res.status(HttpStatusCode.OK).json(new ApiResponse(HttpStatusCode.OK, plan, "Today's log reset successfully"));
});

// ── PUT /api/v1/diet-plans/targets ───────────────────────────────────────────
// Update custom calorie, water and macro targets
export const updateDietTargets = asyncHandler(async (req: Request, res: Response) => {
  const memberId = (req as any).user?.id;
  if (!memberId) throw new ApiError(HttpStatusCode.UNAUTHORIZED, "Unauthorized");

  const { dailyCalorieTarget, dailyWaterTarget, protein, carbs, fat } = req.body;

  const plan = await DietPlan.findOne({ member: memberId });
  if (!plan) throw new ApiError(HttpStatusCode.NOT_FOUND, "Diet plan not found.");

  if (dailyCalorieTarget != null) plan.dailyCalorieTarget = Number(dailyCalorieTarget);
  if (dailyWaterTarget != null) plan.dailyWaterTarget = Number(dailyWaterTarget);
  if (protein != null) plan.dailyMacroTargets.protein = Number(protein);
  if (carbs != null) plan.dailyMacroTargets.carbs = Number(carbs);
  if (fat != null) plan.dailyMacroTargets.fat = Number(fat);

  await plan.save();

  return res
    .status(HttpStatusCode.OK)
    .json(new ApiResponse(HttpStatusCode.OK, plan, "Targets updated successfully"));
});

// ═══════════════════════════════════════════════════════════════════════════
//  TRAINER / STAFF ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

const requireStaffRole = (req: Request) => {
  const user = (req as any).user;
  if (!user) throw new ApiError(HttpStatusCode.UNAUTHORIZED, "Unauthorized");
  if (user.role !== "staff" && user.role !== "admin") {
    throw new ApiError(HttpStatusCode.FORBIDDEN, "Only staff/admin can manage client diet plans");
  }
  return user;
};

// ── GET /api/v1/diet-plans/client/:clientId ───────────────────────────────────
// Trainer views a specific client's diet plan (auto-initializes if absent)
export const getClientDietPlan = asyncHandler(async (req: Request, res: Response) => {
  requireStaffRole(req);
  const { clientId } = req.params;

  const memberId = await resolveMemberId(clientId);

  let plan = await DietPlan.findOne({ member: memberId }).populate("assignedBy", "fullname email");

  if (!plan) {
    plan = await DietPlan.create({
      member: memberId,
      dailyCalorieTarget: 2000,
      dailyWaterTarget: 2500,
      dailyMacroTargets: { protein: 150, carbs: 200, fat: 65 },
      mealPlans: defaultMealPlan,
      dailyLogs: [],
    });
  }

  return res
    .status(HttpStatusCode.OK)
    .json(new ApiResponse(HttpStatusCode.OK, plan, "Client diet plan fetched"));
});

// ── PUT /api/v1/diet-plans/client/:clientId/assign ────────────────────────────
// Trainer assigns / replaces a full meal plan + targets for a client
export const assignMealPlan = asyncHandler(async (req: Request, res: Response) => {
  const staff = requireStaffRole(req);
  const { clientId } = req.params;
  const { dailyCalorieTarget, dailyWaterTarget, protein, carbs, fat, mealPlans, trainerNotes } = req.body;

  const memberId = await resolveMemberId(clientId);

  let plan = await DietPlan.findOne({ member: memberId });

  if (!plan) {
    plan = await DietPlan.create({
      member: memberId,
      assignedBy: staff.id,
      dailyCalorieTarget: dailyCalorieTarget || 2000,
      dailyWaterTarget: dailyWaterTarget || 2500,
      dailyMacroTargets: {
        protein: protein || 150,
        carbs: carbs || 200,
        fat: fat || 65,
      },
      trainerNotes: trainerNotes || "",
      mealPlans: mealPlans || defaultMealPlan,
      dailyLogs: [],
    });
  } else {
    plan.assignedBy = staff.id;
    if (dailyCalorieTarget != null) plan.dailyCalorieTarget = Number(dailyCalorieTarget);
    if (dailyWaterTarget != null) plan.dailyWaterTarget = Number(dailyWaterTarget);
    if (protein != null) plan.dailyMacroTargets.protein = Number(protein);
    if (carbs != null) plan.dailyMacroTargets.carbs = Number(carbs);
    if (fat != null) plan.dailyMacroTargets.fat = Number(fat);
    if (mealPlans) {
      plan.mealPlans = mealPlans;
      plan.markModified("mealPlans");
    }
    if (trainerNotes !== undefined) plan.trainerNotes = trainerNotes;
    await plan.save();
  }

  // ── Notify member that a diet plan was assigned ─────────────────────────────
  try {
    await createNotification({
      recipientId: memberId,
      recipientRole: 'member',
      type: 'diet_plan_assigned',
      title: '🥗 New Diet Plan Assigned',
      message: 'Your trainer has assigned you a new diet/meal plan. Check your nutrition page.',
      link: '/member/nutrition',
    });
  } catch (err) {
    console.error('[DietPlan] Failed to notify member:', err);
  }

  return res
    .status(HttpStatusCode.OK)
    .json(new ApiResponse(HttpStatusCode.OK, plan, "Meal plan assigned successfully"));
});

// ── PATCH /api/v1/diet-plans/client/:clientId/notes ──────────────────────────
// Trainer adds / updates notes for a client's diet plan
export const addTrainerNote = asyncHandler(async (req: Request, res: Response) => {
  requireStaffRole(req);
  const { clientId } = req.params;
  const { trainerNotes } = req.body;

  const memberId = await resolveMemberId(clientId);

  const plan = await DietPlan.findOne({ member: memberId });
  if (!plan) throw new ApiError(HttpStatusCode.NOT_FOUND, "Diet plan not found for this client.");

  plan.trainerNotes = trainerNotes ?? "";
  await plan.save();

  return res
    .status(HttpStatusCode.OK)
    .json(new ApiResponse(HttpStatusCode.OK, plan, "Trainer note updated"));
});
