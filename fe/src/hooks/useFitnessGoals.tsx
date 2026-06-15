import { useState, useCallback, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export interface Milestone {
  _id?: string;
  title: string;
  targetValue: number;
  isCompleted: boolean;
  completedAt?: string;
}

export interface WeeklyLog {
  _id?: string;
  weekStartDate: string;
  loggedValue: number;
  notes?: string;
  createdAt: string;
}

export interface FitnessGoalRecord {
  _id: string;
  member: string;
  title: string;
  type: 'weight' | 'muscle' | 'stamina' | 'steps' | 'other';
  startValue: number;
  targetValue: number;
  currentValue: number;
  unit: string;
  status: 'active' | 'completed' | 'abandoned';
  deadline?: string;
  milestones: Milestone[];
  weeklyLogs: WeeklyLog[];
  createdAt: string;
  updatedAt: string;
}

export const useFitnessGoals = () => {
  const [goals, setGoals] = useState<FitnessGoalRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/fitness-goals`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGoals(data.goals);
      }
    } catch (err) {
      console.error('Failed to fetch fitness goals:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const createGoal = useCallback(async (goalData: {
    title: string;
    type: 'weight' | 'muscle' | 'stamina' | 'steps' | 'other';
    startValue: number;
    targetValue: number;
    unit: string;
    deadline?: string;
    milestones?: { title: string; targetValue: number }[];
  }) => {
    try {
      const res = await fetch(`${API_URL}/fitness-goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchGoals();
        return { success: true, goal: data.goal };
      }
      return { success: false, message: data.message || 'Failed to create goal.' };
    } catch {
      return { success: false, message: 'Network error during goal creation.' };
    }
  }, [fetchGoals]);

  const logProgress = useCallback(async (goalId: string, value: number, notes?: string) => {
    try {
      const res = await fetch(`${API_URL}/fitness-goals/${goalId}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value, notes }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchGoals();
        return { success: true, goal: data.goal };
      }
      return { success: false, message: data.message || 'Failed to record progress.' };
    } catch {
      return { success: false, message: 'Network error logging progress.' };
    }
  }, [fetchGoals]);

  const toggleMilestone = useCallback(async (goalId: string, milestoneId: string) => {
    try {
      const res = await fetch(`${API_URL}/fitness-goals/${goalId}/milestone/${milestoneId}`, {
        method: 'PATCH',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchGoals();
        return { success: true, goal: data.goal };
      }
      return { success: false, message: data.message || 'Failed to toggle milestone.' };
    } catch {
      return { success: false, message: 'Network error toggling milestone.' };
    }
  }, [fetchGoals]);

  const deleteGoal = useCallback(async (goalId: string) => {
    try {
      const res = await fetch(`${API_URL}/fitness-goals/${goalId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchGoals();
        return { success: true };
      }
      return { success: false, message: data.message || 'Failed to remove goal.' };
    } catch {
      return { success: false, message: 'Network error deleting goal.' };
    }
  }, [fetchGoals]);

  return {
    goals,
    loading,
    fetchGoals,
    createGoal,
    logProgress,
    toggleMilestone,
    deleteGoal,
  };
};

export default useFitnessGoals;
