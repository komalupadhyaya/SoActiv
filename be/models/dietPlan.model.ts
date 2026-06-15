import mongoose from "mongoose";

const mealItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["Breakfast", "Lunch", "Dinner", "Snacks"],
      required: true,
    },
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    items: [{ type: String }],
  },
  { _id: true }
);

const mealPlanSchema = new mongoose.Schema(
  {
    day: { type: String, default: "Everyday" },
    meals: [mealItemSchema],
  },
  { _id: false }
);

const dailyLogSchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // YYYY-MM-DD format
    caloriesLogged: { type: Number, default: 0 },
    waterLogged: { type: Number, default: 0 }, // in ml
    macrosLogged: {
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      fat: { type: Number, default: 0 },
    },
    mealsLogged: [{ type: String }],
  },
  { _id: false }
);

const dietPlanSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    dailyCalorieTarget: { type: Number, default: 2000 },
    dailyWaterTarget: { type: Number, default: 2500 }, // in ml
    dailyMacroTargets: {
      protein: { type: Number, default: 150 }, // grams
      carbs: { type: Number, default: 200 },   // grams
      fat: { type: Number, default: 65 },      // grams
    },
    trainerNotes: { type: String, default: "" },
    mealPlans: [mealPlanSchema],
    dailyLogs: [dailyLogSchema],
  },
  { timestamps: true }
);

// Compound index for fast member queries
dietPlanSchema.index({ member: 1 });

export default mongoose.model("DietPlan", dietPlanSchema);
