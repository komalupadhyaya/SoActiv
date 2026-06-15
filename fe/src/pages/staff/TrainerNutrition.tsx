import React, { useState, useCallback, useEffect } from 'react';
import { useClient, type Client } from '../../hooks/useClient';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  Apple, Search, User, ChevronRight, ArrowLeft,
  Plus, Trash2, Save, StickyNote, UtensilsCrossed, Target
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface MealItem {
  name: string;
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  items: string[];
}

interface ClientPlan {
  _id: string;
  dailyCalorieTarget: number;
  dailyWaterTarget: number;
  dailyMacroTargets: { protein: number; carbs: number; fat: number };
  trainerNotes: string;
  mealPlans: { day: string; meals: MealItem[] }[];
  assignedBy?: { fullname: string; email: string } | null;
}

export const TrainerNutrition: React.FC = () => {
  const { user } = useAuth();
  const { clients, loading: clientsLoading } = useClient();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [plan, setPlan] = useState<ClientPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);

  // Editable state
  const [calTarget, setCalTarget] = useState('');
  const [waterTarget, setWaterTarget] = useState('');
  const [proteinTarget, setProteinTarget] = useState('');
  const [carbsTarget, setCarbsTarget] = useState('');
  const [fatTarget, setFatTarget] = useState('');
  const [notes, setNotes] = useState('');
  const [meals, setMeals] = useState<MealItem[]>([]);

  // New meal form
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [mealName, setMealName] = useState('');
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'>('Breakfast');
  const [mealCal, setMealCal] = useState('');
  const [mealProtein, setMealProtein] = useState('');
  const [mealCarbs, setMealCarbs] = useState('');
  const [mealFat, setMealFat] = useState('');
  const [mealItems, setMealItems] = useState('');

  // Show all gym clients (trainer can manage nutrition for any member)
  const myClients = clients.filter(client => {
    const matchesSearch =
      client.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.contactNumber?.includes(searchQuery) ?? false);
    return matchesSearch;
  });

  // Fetch a client's diet plan
  const fetchClientPlan = useCallback(async (clientId: string) => {
    setPlanLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/diet-plans/client/${clientId}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const p = data.data;
        setPlan(p);
        setCalTarget(p.dailyCalorieTarget.toString());
        setWaterTarget(p.dailyWaterTarget.toString());
        setProteinTarget(p.dailyMacroTargets.protein.toString());
        setCarbsTarget(p.dailyMacroTargets.carbs.toString());
        setFatTarget(p.dailyMacroTargets.fat.toString());
        setNotes(p.trainerNotes || '');
        setMeals(p.mealPlans[0]?.meals || []);
      }
    } catch {
      addToast('Failed to fetch client plan', 'error');
    } finally {
      setPlanLoading(false);
    }
  }, [addToast]);

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    fetchClientPlan(client._id);
  };

  const handleBack = () => {
    setSelectedClient(null);
    setPlan(null);
  };

  // Save full plan assignment
  const handleSavePlan = async () => {
    if (!selectedClient) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/diet-plans/client/${selectedClient._id}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyCalorieTarget: Number(calTarget),
          dailyWaterTarget: Number(waterTarget),
          protein: Number(proteinTarget),
          carbs: Number(carbsTarget),
          fat: Number(fatTarget),
          trainerNotes: notes,
          mealPlans: [{ day: 'Everyday', meals }],
        }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPlan(data.data);
        addToast(`Diet plan assigned to ${selectedClient.fullName}`, 'success');
      } else {
        addToast(data.message || 'Failed to save plan', 'error');
      }
    } catch {
      addToast('Network error saving plan', 'error');
    }
  };

  // Save notes only
  const handleSaveNotes = async () => {
    if (!selectedClient) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/diet-plans/client/${selectedClient._id}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainerNotes: notes }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) addToast('Notes saved', 'success');
      else addToast(data.message || 'Failed', 'error');
    } catch {
      addToast('Network error', 'error');
    }
  };

  // Add a meal to the list
  const handleAddMeal = () => {
    if (!mealName) return;
    const newMeal: MealItem = {
      name: mealName,
      type: mealType,
      calories: Number(mealCal) || 0,
      protein: Number(mealProtein) || 0,
      carbs: Number(mealCarbs) || 0,
      fat: Number(mealFat) || 0,
      items: mealItems.split(',').map(s => s.trim()).filter(Boolean),
    };
    setMeals(prev => [...prev, newMeal]);
    setMealName(''); setMealCal(''); setMealProtein(''); setMealCarbs(''); setMealFat(''); setMealItems('');
    setShowAddMeal(false);
  };

  const removeMeal = (idx: number) => setMeals(prev => prev.filter((_, i) => i !== idx));

  // Meal type badge colors
  const typeBadge: Record<string, string> = {
    Breakfast: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
    Lunch: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400',
    Dinner: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400',
    Snacks: 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400',
  };

  // ── CLIENT LIST VIEW ───────────────────────────────────────────────────────
  if (!selectedClient) {
    return (
      <div className="max-w-7xl mx-auto pb-12 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Apple className="w-7 h-7 text-green-500" /> Client Nutrition Manager
          </h1>
          <p className="text-sm text-gray-500 mt-1">Select a client to assign meal plans, modify diets, and add notes.</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500/20"
          />
        </div>

        {/* Clients Grid */}
        {clientsLoading ? (
          <div className="text-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500 mx-auto" /></div>
        ) : myClients.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No assigned clients found.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myClients.map(client => (
              <button
                key={client._id}
                onClick={() => handleSelectClient(client)}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 text-left hover:shadow-md hover:border-green-300 dark:hover:border-green-700 transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                    <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{client.fullName}</h3>
                    <span className="text-xs text-gray-500">{client.contactNumber}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-green-500 transition-colors" />
                </div>
                <div className="text-xs text-gray-400">
                  {client.personalTrainingDurationWeeks ? `${client.personalTrainingDurationWeeks} Weeks Plan` : 'Standard'}
                  {' · '}
                  <span className={client.status === 'active' ? 'text-green-600' : 'text-red-500'}>{client.status}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── CLIENT PLAN EDITOR VIEW ────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {selectedClient.fullName}'s Diet Plan
            </h1>
            <p className="text-xs text-gray-500">
              {plan?.assignedBy ? `Last assigned by ${(plan.assignedBy as any)?.fullname || 'Trainer'}` : 'Default plan (auto-generated)'}
            </p>
          </div>
        </div>
        <button
          onClick={handleSavePlan}
          className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl text-sm font-bold shadow-md flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> Assign & Save Plan
        </button>
      </div>

      {planLoading ? (
        <div className="text-center py-16"><Apple className="w-10 h-10 text-green-500 animate-bounce mx-auto" /></div>
      ) : (
        <>
          {/* Targets Editor */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-green-500" /> Daily Targets</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Calories (kcal)', val: calTarget, set: setCalTarget },
                { label: 'Water (ml)', val: waterTarget, set: setWaterTarget },
                { label: 'Protein (g)', val: proteinTarget, set: setProteinTarget },
                { label: 'Carbs (g)', val: carbsTarget, set: setCarbsTarget },
                { label: 'Fat (g)', val: fatTarget, set: setFatTarget },
              ].map(({ label, val, set }) => (
                <div key={label}>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
                  <input type="number" value={val} onChange={e => set(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500/20" />
                </div>
              ))}
            </div>
          </div>

          {/* Trainer Notes */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><StickyNote className="w-4 h-4 text-amber-500" /> Trainer Notes</h3>
              <button onClick={handleSaveNotes} className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg">Save Notes</button>
            </div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add dietary instructions, allergies, restrictions, or motivational guidance..."
              className="w-full h-28 px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
            />
          </div>

          {/* Meal Plan Editor */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-green-500" /> Meal Plan
              </h3>
              <button
                onClick={() => setShowAddMeal(v => !v)}
                className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Meal
              </button>
            </div>

            {/* Add Meal Form */}
            {showAddMeal && (
              <div className="p-5 bg-green-50/50 dark:bg-green-950/10 border-b border-gray-100 dark:border-gray-700">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Meal Name</label>
                    <input type="text" value={mealName} onChange={e => setMealName(e.target.value)} placeholder="e.g. Grilled Chicken Bowl"
                      className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg text-xs outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Meal Type</label>
                    <select value={mealType} onChange={e => setMealType(e.target.value as any)}
                      className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg text-xs outline-none">
                      <option value="Breakfast">Breakfast</option>
                      <option value="Lunch">Lunch</option>
                      <option value="Dinner">Dinner</option>
                      <option value="Snacks">Snacks</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Calories</label>
                    <input type="number" value={mealCal} onChange={e => setMealCal(e.target.value)} placeholder="0"
                      className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg text-xs outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Protein (g)</label>
                    <input type="number" value={mealProtein} onChange={e => setMealProtein(e.target.value)} placeholder="0"
                      className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg text-xs outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Carbs (g)</label>
                    <input type="number" value={mealCarbs} onChange={e => setMealCarbs(e.target.value)} placeholder="0"
                      className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg text-xs outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Fat (g)</label>
                    <input type="number" value={mealFat} onChange={e => setMealFat(e.target.value)} placeholder="0"
                      className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg text-xs outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Ingredients (comma-sep)</label>
                    <input type="text" value={mealItems} onChange={e => setMealItems(e.target.value)} placeholder="Rice, Chicken, Broccoli"
                      className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg text-xs outline-none" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowAddMeal(false)} className="px-3 py-1.5 text-xs text-gray-500">Cancel</button>
                  <button onClick={handleAddMeal} className="px-4 py-1.5 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600">Add to Plan</button>
                </div>
              </div>
            )}

            {/* Meal List */}
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {meals.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">No meals added yet. Click "Add Meal" to build the plan.</div>
              ) : meals.map((meal, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${typeBadge[meal.type]}`}>{meal.type}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">{meal.name}</h4>
                    <span className="text-xs text-gray-400">{meal.items.join(', ')}</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 text-xs text-gray-400">
                    <span><b className="text-orange-500">{meal.calories}</b> kcal</span>
                    <span>P:{meal.protein}g</span>
                    <span>C:{meal.carbs}g</span>
                    <span>F:{meal.fat}g</span>
                  </div>
                  <button onClick={() => removeMeal(idx)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TrainerNutrition;
