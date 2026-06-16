import { useState, useCallback, useEffect } from 'react';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '').replace(/\/api\/v1$/, '');

export interface MacroTargets {
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealItem {
  _id?: string;
  name: string;
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  items: string[];
}

export interface MealPlan {
  day: string;
  meals: MealItem[];
}

export interface DailyLog {
  date: string;
  caloriesLogged: number;
  waterLogged: number;
  macrosLogged: MacroTargets;
  mealsLogged?: string[];
}

export interface DietPlan {
  _id: string;
  member: string;
  assignedBy?: { fullname: string; email: string } | null;
  dailyCalorieTarget: number;
  dailyWaterTarget: number;
  dailyMacroTargets: MacroTargets;
  trainerNotes?: string;
  mealPlans: MealPlan[];
  dailyLogs: DailyLog[];
  createdAt: string;
  updatedAt: string;
}

export const useDietPlan = () => {
  const [plan, setPlan] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const fetchPlan = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/diet-plans/active`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) setPlan(data.data);
    } catch (err) {
      console.error('Failed to fetch diet plan:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  // Today's log (or default zeros)
  const todayLog: DailyLog = plan?.dailyLogs.find(l => l.date === today) ?? {
    date: today,
    caloriesLogged: 0,
    waterLogged: 0,
    macrosLogged: { protein: 0, carbs: 0, fat: 0 },
    mealsLogged: [],
  };

  const logIntake = useCallback(async (payload: {
    calories?: number;
    water?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    mealType?: string;
  }) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/diet-plans/log`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) setPlan(data.data);
      return { success: res.ok };
    } catch {
      return { success: false };
    }
  }, []);

  const resetToday = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/diet-plans/log/reset`, {
        method: 'PATCH',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) setPlan(data.data);
      return { success: res.ok };
    } catch {
      return { success: false };
    }
  }, []);

  const updateTargets = useCallback(async (targets: {
    dailyCalorieTarget?: number;
    dailyWaterTarget?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  }) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/diet-plans/targets`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targets),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) setPlan(data.data);
      return { success: res.ok };
    } catch {
      return { success: false };
    }
  }, []);

  return {
    plan,
    loading,
    todayLog,
    fetchPlan,
    logIntake,
    resetToday,
    updateTargets,
  };
};

export default useDietPlan;
