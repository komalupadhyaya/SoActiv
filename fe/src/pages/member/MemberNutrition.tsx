import React, { useState } from 'react';
import useDietPlan from '../../hooks/useDietPlan';
import {
  Flame, Droplets, Apple, UtensilsCrossed, Plus,
  RotateCcw, Target, ChevronDown, ChevronUp, Sparkles,
  TrendingUp, BarChart3, Activity
} from 'lucide-react';

const MEAL_COLORS: Record<string, string> = {
  Breakfast: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  Lunch: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  Dinner: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400',
  Snacks: 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400',
};

// Circular SVG ring component
const Ring = ({ value, max, color, size = 120, label, sublabel }: {
  value: number; max: number; color: string; size?: number; label: string; sublabel: string;
}) => {
  const pct = Math.min(100, Math.max(0, (value / Math.max(1, max)) * 100));
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={10} className="dark:stroke-gray-800" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={10}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div className="text-center -mt-2">
        <div className="text-xl font-black text-gray-900 dark:text-white">{label}</div>
        <div className="text-xs text-gray-500">{sublabel}</div>
      </div>
    </div>
  );
};

// Macro progress bar
const MacroBar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => {
  const pct = Math.min(100, (value / Math.max(1, max)) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-semibold">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="text-gray-900 dark:text-white">{value}g / {max}g</span>
      </div>
      <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// Water bottle visual
const WaterMeter = ({ logged, target }: { logged: number; target: number }) => {
  const pct = Math.min(100, (logged / Math.max(1, target)) * 100);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-16 h-28 border-2 border-blue-300 dark:border-blue-700 rounded-b-2xl rounded-t-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
        <div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 to-blue-300 transition-all duration-700"
          style={{ height: `${pct}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-black text-white drop-shadow">{Math.round(pct)}%</span>
        </div>
      </div>
      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{logged}ml / {target}ml</span>
    </div>
  );
};

export const MemberNutrition: React.FC = () => {
  const { plan, loading, todayLog, logIntake, resetToday, updateTargets } = useDietPlan();

  // Log quick food modal state
  const [showLogModal, setShowLogModal] = useState(false);
  const [logCal, setLogCal] = useState('');
  const [logProtein, setLogProtein] = useState('');
  const [logCarbs, setLogCarbs] = useState('');
  const [logFat, setLogFat] = useState('');
  const [logMsg, setLogMsg] = useState<string | null>(null);

  // Targets editor state
  const [showTargets, setShowTargets] = useState(false);
  const [tCal, setTCal] = useState('');
  const [tWater, setTWater] = useState('');
  const [tProtein, setTProtein] = useState('');
  const [tCarbs, setTCarbs] = useState('');
  const [tFat, setTFat] = useState('');

  // Expanded meal section state
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);

  // Chart view: 'bar' or 'line'
  const [chartView, setChartView] = useState<'bar' | 'line'>('bar');

  // Chart range: 7 or 30 days
  const [timeRange, setTimeRange] = useState<7 | 30>(7);

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await logIntake({
      calories: logCal ? Number(logCal) : undefined,
      protein: logProtein ? Number(logProtein) : undefined,
      carbs: logCarbs ? Number(logCarbs) : undefined,
      fat: logFat ? Number(logFat) : undefined,
    });
    setLogMsg('Logged successfully!');
    setLogCal(''); setLogProtein(''); setLogCarbs(''); setLogFat('');
    setTimeout(() => { setShowLogModal(false); setLogMsg(null); }, 1200);
  };

  const handleTargetsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateTargets({
      dailyCalorieTarget: tCal ? Number(tCal) : undefined,
      dailyWaterTarget: tWater ? Number(tWater) : undefined,
      protein: tProtein ? Number(tProtein) : undefined,
      carbs: tCarbs ? Number(tCarbs) : undefined,
      fat: tFat ? Number(tFat) : undefined,
    });
    setShowTargets(false);
  };

  if (loading || !plan) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Apple className="w-10 h-10 text-green-500 animate-bounce" />
          <p className="text-gray-500 text-sm">Initializing your nutrition plan...</p>
        </div>
      </div>
    );
  }

  const calorieRemaining = Math.max(0, plan.dailyCalorieTarget - todayLog.caloriesLogged);
  const meals = plan.mealPlans[0]?.meals ?? [];

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Apple className="w-7 h-7 text-green-500" />
            Nutrition & Diet Plans
          </h1>
          <p className="text-sm text-gray-500 mt-1">Track your daily calories, macros, and hydration goals.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setShowTargets(v => !v); setTCal(''); setTWater(''); setTProtein(''); setTCarbs(''); setTFat(''); }}
            className="px-3.5 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1.5"
          >
            <Target className="w-3.5 h-3.5" /> Edit Targets
          </button>
          <button
            onClick={() => setShowLogModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Log Meal
          </button>
          <button
            onClick={resetToday}
            className="p-2 border border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl text-gray-400 hover:text-red-500 transition-colors"
            title="Reset today's log"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Edit Targets Panel */}
      {showTargets && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-green-500" /> Customize Daily Targets</h3>
          <form onSubmit={handleTargetsSubmit} className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Calories (kcal)', val: tCal, set: setTCal, ph: plan.dailyCalorieTarget.toString() },
              { label: 'Water (ml)', val: tWater, set: setTWater, ph: plan.dailyWaterTarget.toString() },
              { label: 'Protein (g)', val: tProtein, set: setTProtein, ph: plan.dailyMacroTargets.protein.toString() },
              { label: 'Carbs (g)', val: tCarbs, set: setTCarbs, ph: plan.dailyMacroTargets.carbs.toString() },
              { label: 'Fat (g)', val: tFat, set: setTFat, ph: plan.dailyMacroTargets.fat.toString() },
            ].map(({ label, val, set, ph }) => (
              <div key={label}>
                <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
                <input type="number" value={val} onChange={e => set(e.target.value)} placeholder={ph}
                  className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg text-xs outline-none focus:ring-2 focus:ring-green-500/20" />
              </div>
            ))}
            <div className="col-span-2 md:col-span-5 flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setShowTargets(false)} className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-1.5 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600">Save Targets</button>
            </div>
          </form>
        </div>
      )}

      {/* Trainer Notes Display (if trainer has left notes) */}
      {plan.trainerNotes && (
        <div className="bg-amber-50/60 dark:bg-amber-950/15 rounded-2xl border border-amber-200 dark:border-amber-800/40 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 mb-2">
            📋 Trainer Notes
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{plan.trainerNotes}</p>
        </div>
      )}

      {/* Cockpit Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Calorie Ring */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm flex flex-col items-center gap-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white self-start flex items-center gap-1.5"><Flame className="w-4 h-4 text-orange-500" /> Calorie Budget</h3>
          <Ring
            value={todayLog.caloriesLogged}
            max={plan.dailyCalorieTarget}
            color="#f97316"
            size={140}
            label={`${todayLog.caloriesLogged}`}
            sublabel={`of ${plan.dailyCalorieTarget} kcal`}
          />
          <div className="grid grid-cols-2 gap-3 w-full text-center text-xs">
            <div className="bg-orange-50 dark:bg-orange-950/20 p-2 rounded-xl">
              <div className="font-black text-orange-600">{todayLog.caloriesLogged}</div>
              <div className="text-gray-400">Eaten</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/40 p-2 rounded-xl">
              <div className="font-black text-gray-700 dark:text-gray-200">{calorieRemaining}</div>
              <div className="text-gray-400">Remaining</div>
            </div>
          </div>
        </div>

        {/* Macros */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-amber-500" /> Macro Breakdown</h3>
          <MacroBar label="Protein" value={todayLog.macrosLogged.protein} max={plan.dailyMacroTargets.protein} color="bg-orange-500" />
          <MacroBar label="Carbohydrates" value={todayLog.macrosLogged.carbs} max={plan.dailyMacroTargets.carbs} color="bg-amber-400" />
          <MacroBar label="Fat" value={todayLog.macrosLogged.fat} max={plan.dailyMacroTargets.fat} color="bg-emerald-500" />
          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-gray-100 dark:border-gray-700">
            {[
              { l: 'Protein', v: todayLog.macrosLogged.protein, c: 'text-orange-600' },
              { l: 'Carbs', v: todayLog.macrosLogged.carbs, c: 'text-amber-600' },
              { l: 'Fat', v: todayLog.macrosLogged.fat, c: 'text-emerald-600' },
            ].map(({ l, v, c }) => (
              <div key={l}><div className={`font-black text-base ${c}`}>{v}g</div><div className="text-gray-400">{l}</div></div>
            ))}
          </div>
        </div>

        {/* Water */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm flex flex-col items-center gap-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white self-start flex items-center gap-1.5"><Droplets className="w-4 h-4 text-blue-500" /> Hydration Tracker</h3>
          <WaterMeter logged={todayLog.waterLogged} target={plan.dailyWaterTarget} />
          <div className="grid grid-cols-2 gap-2 w-full">
            <button onClick={() => logIntake({ water: 250 })}
              className="py-2 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-xl hover:bg-blue-100 transition-colors border border-blue-200 dark:border-blue-800">
              + 250ml Cup
            </button>
            <button onClick={() => logIntake({ water: 500 })}
              className="py-2 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs font-bold rounded-xl hover:bg-blue-200 transition-colors border border-blue-200 dark:border-blue-800">
              + 500ml Bottle
            </button>
          </div>
        </div>
      </div>

      {/* Calories Consumption History */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-700/50">
          <div className="space-y-1.5">
            <h3 className="font-extrabold text-gray-900 dark:text-white flex items-center gap-2 text-lg sm:text-xl">
              <TrendingUp className="w-5.5 h-5.5 text-green-500" />
              {timeRange}-Day Calories Consumption History
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Track your daily calorie intake trends over the past {timeRange === 7 ? 'week' : 'month'}.
            </p>
            {/* Elegant Legend under the title */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1.5">
              <span className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/60 px-2.5 py-1 rounded-lg border border-gray-200/40 dark:border-gray-700/40 shadow-sm">
                <span className="w-2 h-2 bg-gradient-to-t from-green-600 to-emerald-400 rounded-full" /> Target Met
              </span>
              <span className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/60 px-2.5 py-1 rounded-lg border border-gray-200/40 dark:border-gray-700/40 shadow-sm">
                <span className="w-2 h-2 bg-gradient-to-t from-rose-500 to-red-400 rounded-full" /> Over Target
              </span>
              <span className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/60 px-2.5 py-1 rounded-lg border border-gray-200/40 dark:border-gray-700/40 shadow-sm">
                <span className="w-2 h-2 bg-gradient-to-t from-orange-500 to-amber-300 rounded-full" /> Under Goal
              </span>
            </div>
          </div>

          {/* Unified Controls side-by-side */}
          <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
            {/* Toggle Switch (Bar vs Line) */}
            <div className="flex bg-gray-100 dark:bg-gray-900/60 p-1 rounded-xl border border-gray-200/30 dark:border-gray-800/40 shadow-sm">
              <button
                onClick={() => setChartView('bar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  chartView === 'bar'
                    ? 'bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 shadow-sm border border-gray-200/10 dark:border-gray-700/10'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" /> Bar View
              </button>
              <button
                onClick={() => setChartView('line')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  chartView === 'line'
                    ? 'bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 shadow-sm border border-gray-200/10 dark:border-gray-700/10'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" /> Line View
              </button>
            </div>

            {/* Time Range Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-900/60 p-1 rounded-xl border border-gray-200/30 dark:border-gray-800/40 shadow-sm">
              <button
                onClick={() => setTimeRange(7)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  timeRange === 7
                    ? 'bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 shadow-sm border border-gray-200/10 dark:border-gray-700/10'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setTimeRange(30)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  timeRange === 30
                    ? 'bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 shadow-sm border border-gray-200/10 dark:border-gray-700/10'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                30 Days
              </button>
            </div>
          </div>
        </div>

        {chartView === 'bar' ? (() => {
          const lastDays = Array.from({ length: timeRange }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().slice(0, 10);
          }).reverse();

          const recentDays = lastDays.slice(-2);
          const isRecentOverTarget = recentDays.some(dayKey => {
            const log = plan.dailyLogs.find(l => l.date === dayKey);
            return log ? log.caloriesLogged > plan.dailyCalorieTarget : false;
          });

          return (
            <div className="w-full">
              {/* Bars Container */}
              <div className="h-48 flex items-end justify-between gap-1 sm:gap-4 border-b border-gray-100 dark:border-gray-700 relative">
                {/* Target Calorie Line */}
                <div className="absolute left-0 right-0 border-t border-dashed border-green-500/50 z-0" style={{ bottom: '70%' }}>
                  <span className={`absolute bottom-full mb-1 bg-white dark:bg-gray-800 px-2 py-0.5 rounded text-[10px] text-green-600 dark:text-green-400 font-bold border border-green-200 dark:border-green-800 shadow-sm z-20 whitespace-nowrap transition-all duration-300 ${
                    isRecentOverTarget ? 'right-20 sm:right-28' : 'right-2'
                  }`}>
                    Target ({plan.dailyCalorieTarget} kcal)
                  </span>
                </div>

                {lastDays.map((dayKey, idx) => {
                  const log = plan.dailyLogs.find(l => l.date === dayKey) ?? {
                    date: dayKey,
                    caloriesLogged: 0,
                    waterLogged: 0,
                    macrosLogged: { protein: 0, carbs: 0, fat: 0 }
                  };

                  const dateObj = new Date(dayKey);
                  const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                  const caloriePct = Math.min(100, (log.caloriesLogged / Math.max(1, plan.dailyCalorieTarget)) * 70);
                  const isOverTarget = log.caloriesLogged > plan.dailyCalorieTarget;
                  const isTargetMet = log.caloriesLogged === plan.dailyCalorieTarget;

                  return (
                    <div key={dayKey} className="flex-1 flex justify-center items-end h-full group relative z-10">
                      {/* Tooltip on Hover */}
                      <div className="absolute bottom-full mb-2 bg-gray-950 text-white text-[10px] p-2.5 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none w-32 border border-gray-800 flex flex-col gap-1 z-20">
                        <span className="font-extrabold text-gray-300 mb-1">{formattedDate}</span>
                        <span className="flex justify-between"><span>Calories:</span><span className="font-bold text-orange-400">{log.caloriesLogged}</span></span>
                        <span className="flex justify-between"><span>Protein:</span><span className="font-bold text-orange-300">{log.macrosLogged?.protein ?? 0}g</span></span>
                        <span className="flex justify-between"><span>Carbs:</span><span className="font-bold text-amber-300">{log.macrosLogged?.carbs ?? 0}g</span></span>
                        <span className="flex justify-between"><span>Fat:</span><span className="font-bold text-emerald-300">{log.macrosLogged?.fat ?? 0}g</span></span>
                      </div>

                      {/* Active Bar */}
                      <div
                        className={`transition-all duration-700 ease-out hover:brightness-110 shadow-sm ${
                          timeRange === 7 ? 'w-8 sm:w-12 rounded-t-xl' : 'w-2.5 sm:w-3.5 rounded-t-md'
                        } ${
                          isOverTarget
                            ? 'bg-gradient-to-t from-rose-500 to-red-400'
                            : isTargetMet
                            ? 'bg-gradient-to-t from-green-600 to-emerald-400'
                            : log.caloriesLogged > 0
                            ? 'bg-gradient-to-t from-orange-500 to-amber-300'
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}
                        style={{ height: `${Math.max(4, caloriePct)}%` }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Labels Row below Bars Container */}
              <div className="flex justify-between gap-1 sm:gap-4 pt-3 pb-1">
                {lastDays.map((dayKey, idx) => {
                  const log = plan.dailyLogs.find(l => l.date === dayKey) ?? {
                    date: dayKey,
                    caloriesLogged: 0
                  };
                  const dateObj = new Date(dayKey);
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                  const showLabel = timeRange === 7 || (idx % 5 === 0) || (idx === lastDays.length - 1);

                  return (
                    <div key={dayKey} className="flex-1 flex flex-col items-center">
                      {showLabel ? (
                        <>
                          <span className="text-[10px] font-bold text-gray-900 dark:text-white whitespace-nowrap">{dayName}</span>
                          <span className="text-[8px] text-gray-400 font-semibold">{log.caloriesLogged}</span>
                        </>
                      ) : (
                        <span className="w-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-1.5" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })() : (
          <div className="relative pt-6 border-b border-gray-100 dark:border-gray-700 pb-2">
            {/* Native SVG Line Graph */}
            {(() => {
              const lastDays = Array.from({ length: timeRange }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                return d.toISOString().slice(0, 10);
              }).reverse();

              const lastDaysLogs = lastDays.map(dayKey => {
                const log = plan.dailyLogs.find(l => l.date === dayKey) ?? {
                  date: dayKey,
                  caloriesLogged: 0,
                  waterLogged: 0,
                  macrosLogged: { protein: 0, carbs: 0, fat: 0 }
                };
                const dateObj = new Date(dayKey);
                const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return { ...log, dayName, formattedDate };
              });

              const maxCalVal = Math.max(...lastDaysLogs.map(l => l.caloriesLogged), plan.dailyCalorieTarget);
              const maxYVal = maxCalVal * 1.25; // 25% top padding to keep graph curve spacious

              // Map each point to coordinate within SVG viewBox (0 0 700 200)
              const points = lastDaysLogs.map((log, i) => {
                const x = 50 + i * (600 / (timeRange - 1));
                const y = 175 - (log.caloriesLogged / maxYVal) * 140;
                return { x, y, log };
              });

              // Create smooth path
              const lineD = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
              const areaD = `${lineD} L 650 175 L 50 175 Z`;
              const targetY = 175 - (plan.dailyCalorieTarget / maxYVal) * 140;

              const isRecentOverTarget = points.slice(-2).some(p => p.log.caloriesLogged > plan.dailyCalorieTarget);

              return (
                <div className="w-full">
                  <svg viewBox="0 0 700 200" width="100%" height="220" className="overflow-visible">
                    <defs>
                      <linearGradient id="calorieAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid lines */}
                    <line x1="50" y1="175" x2="650" y2="175" stroke="#e5e7eb" className="dark:stroke-gray-700/60" strokeWidth="1" />
                    <line x1="50" y1="105" x2="650" y2="105" stroke="#e5e7eb" className="dark:stroke-gray-700/30" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="50" y1="35" x2="650" y2="35" stroke="#e5e7eb" className="dark:stroke-gray-700/30" strokeWidth="1" strokeDasharray="4 4" />

                    {/* Target Calorie Line */}
                    <line x1="50" y1={targetY} x2="650" y2={targetY} stroke="#10b981" strokeWidth="2" strokeDasharray="6 4" opacity="0.6" />
                    <text x={isRecentOverTarget ? "500" : "645"} y={targetY - 6} textAnchor={isRecentOverTarget ? "start" : "end"} fill="#10b981" className="text-[10px] font-bold fill-emerald-500 dark:fill-emerald-400 transition-all duration-300">
                      Target ({plan.dailyCalorieTarget} kcal)
                    </text>

                    {/* Area under the line */}
                    {points.length > 0 && <path d={areaD} fill="url(#calorieAreaGrad)" />}

                    {/* Line itself */}
                    {points.length > 0 && (
                      <path d={lineD} fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    )}

                    {/* Points and Tooltip Triggers */}
                    {points.map((p, i) => {
                      const isOverTarget = p.log.caloriesLogged > plan.dailyCalorieTarget;
                      const isTargetMet = p.log.caloriesLogged === plan.dailyCalorieTarget;
                      const showLabel = timeRange === 7 || (i % 5 === 0) || (i === points.length - 1);
                      const dotRadius = timeRange === 7 ? 5 : 3.5;
                      const hoverRadius = timeRange === 7 ? 8 : 6;

                      return (
                        <g key={i} className="group/dot cursor-pointer">
                          {/* Large transparent circle to make hover zone generous */}
                          <circle cx={p.x} cy={p.y} r={timeRange === 7 ? "16" : "10"} fill="transparent" />

                          {/* Inner white dot with colored border - moves slightly straight down on hover without diagonal shifting */}
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={dotRadius}
                            fill="#ffffff"
                            stroke={isOverTarget ? '#f43f5e' : isTargetMet ? '#22c55e' : '#f59e0b'}
                            strokeWidth={timeRange === 7 ? "3" : "2"}
                            className="group-hover/dot:translate-y-[2px] group-hover/dot:scale-110 transition-all duration-300"
                            style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                          />

                          {/* Day Labels at bottom */}
                          {showLabel && (
                            <text x={p.x} y="196" textAnchor="middle" fill="currentColor" className="text-[10px] font-bold text-gray-900 dark:text-white fill-gray-900 dark:fill-gray-100">
                              {p.log.dayName}
                            </text>
                          )}

                          {/* Value Labels under dots */}
                          {showLabel && (
                            <text x={p.x} y={p.y + 20} textAnchor="middle" fill="currentColor" className="text-[8px] font-semibold fill-gray-500 dark:fill-gray-400">
                              {p.log.caloriesLogged}
                            </text>
                          )}

                          {/* Interactive Hover Tooltip - shifted slightly upward */}
                          <foreignObject x={p.x - 64} y={p.y - 132} width="128" height="110" className="pointer-events-none opacity-0 group-hover/dot:opacity-100 transition-opacity duration-300 overflow-visible">
                            <div className="bg-gray-950 text-white text-[10px] p-2.5 rounded-xl shadow-xl border border-gray-800 flex flex-col gap-1 w-32">
                              <span className="font-extrabold text-gray-300 mb-1">{p.log.formattedDate}</span>
                              <span className="flex justify-between"><span>Calories:</span><span className="font-bold text-orange-400">{p.log.caloriesLogged}</span></span>
                              <span className="flex justify-between"><span>Protein:</span><span className="font-bold text-orange-300">{p.log.macrosLogged?.protein ?? 0}g</span></span>
                              <span className="flex justify-between"><span>Carbs:</span><span className="font-bold text-amber-300">{p.log.macrosLogged?.carbs ?? 0}g</span></span>
                              <span className="flex justify-between"><span>Fat:</span><span className="font-bold text-emerald-300">{p.log.macrosLogged?.fat ?? 0}g</span></span>
                            </div>
                          </foreignObject>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Meal Plan Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
          <UtensilsCrossed className="w-5 h-5 text-green-500" />
          <h3 className="font-bold text-gray-900 dark:text-white">Today's Meal Plan</h3>
          <span className="ml-auto text-xs text-gray-400">{plan.mealPlans[0]?.day ?? 'Everyday'}</span>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {meals.map((meal) => {
            const key = meal._id ?? meal.name;
            const isOpen = expandedMeal === key;
            return (
              <div key={key}>
                <button
                  onClick={() => setExpandedMeal(isOpen ? null : key)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors text-left"
                >
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${MEAL_COLORS[meal.type]}`}>{meal.type}</span>
                  <span className="flex-1 font-semibold text-sm text-gray-900 dark:text-white">{meal.name}</span>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span><span className="font-bold text-orange-500">{meal.calories}</span> kcal</span>
                    <span>P: {meal.protein}g</span>
                    <span>C: {meal.carbs}g</span>
                    <span>F: {meal.fat}g</span>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {isOpen && (
                  <div className="px-6 pb-4 bg-gray-50/50 dark:bg-gray-800/50">
                    <ul className="space-y-1.5 mt-2">
                      {meal.items.map((item, i) => (
                        <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    {(() => {
                      const isMealLogged = todayLog.mealsLogged?.includes(meal.type);
                      return (
                        <button
                          disabled={isMealLogged}
                          onClick={() => logIntake({
                            calories: meal.calories,
                            protein: meal.protein,
                            carbs: meal.carbs,
                            fat: meal.fat,
                            mealType: meal.type
                          })}
                          className={`mt-3 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                            isMealLogged
                              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                              : 'bg-green-500 hover:bg-green-600 text-white'
                          }`}
                        >
                          {isMealLogged ? '✓ Meal Logged' : '+ Log This Meal'}
                        </button>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Log Meal Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowLogModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-green-500" /> Log Custom Meal
            </h3>
            {logMsg && <div className="mb-3 p-2 bg-green-50 text-green-700 rounded-lg text-xs font-semibold">{logMsg}</div>}
            <form onSubmit={handleLogSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Calories (kcal)', val: logCal, set: setLogCal },
                  { label: 'Protein (g)', val: logProtein, set: setLogProtein },
                  { label: 'Carbs (g)', val: logCarbs, set: setLogCarbs },
                  { label: 'Fat (g)', val: logFat, set: setLogFat },
                ].map(({ label, val, set }) => (
                  <div key={label}>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
                    <input type="number" step="0.1" value={val} onChange={e => set(e.target.value)} placeholder="0"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500/20" />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowLogModal(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white font-bold text-sm rounded-xl shadow-md">Save Log</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberNutrition;
