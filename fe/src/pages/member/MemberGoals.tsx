import React, { useState, useMemo } from 'react';
import { useFitnessGoals, type FitnessGoalRecord, type Milestone } from '../../hooks/useFitnessGoals';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import {
  Award,
  Plus,
  Flame,
  CheckCircle2,
  Calendar,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Trash2,
  Clock,
  ChevronRight,
  Target,
  FileText,
  AlertCircle,
  HelpCircle,
  Play,
  RotateCcw
} from 'lucide-react';

export const MemberGoals: React.FC = () => {
  const { goals, loading, createGoal, logProgress, toggleMilestone, deleteGoal } = useFitnessGoals();

  // Create Goal Form State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'weight' | 'muscle' | 'stamina' | 'steps' | 'other'>('weight');
  const [startValue, setStartValue] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('kg');
  const [deadline, setDeadline] = useState('');
  
  // Custom Milestones list
  const [milestoneInput, setMilestoneInput] = useState('');
  const [milestoneTarget, setMilestoneTarget] = useState('');
  const [milestones, setMilestones] = useState<{ title: string; targetValue: number }[]>([]);

  // Log Progress Modal/Input State
  const [activeLogGoalId, setActiveLogGoalId] = useState<string | null>(null);
  const [loggedValue, setLoggedValue] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [logMsg, setLogMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form error state
  const [formError, setFormError] = useState<string | null>(null);

  // ── Goal Preset Setup helper ───────────────────────────────────────────────
  const applyGoalPreset = (preset: 'lose_weight' | 'gain_muscle' | 'steps' | 'stamina') => {
    setFormError(null);
    if (preset === 'lose_weight') {
      setTitle('Lose 5kg Target');
      setType('weight');
      setStartValue('80');
      setTargetValue('75');
      setUnit('kg');
      setMilestones([
        { title: 'Crack 78kg Milestone', targetValue: 78 },
        { title: 'Crack 76kg Milestone', targetValue: 76 }
      ]);
    } else if (preset === 'gain_muscle') {
      setTitle('Gain Lean Muscle');
      setType('muscle');
      setStartValue('12');
      setTargetValue('15');
      setUnit('%');
      setMilestones([
        { title: 'Reach 13% muscle index', targetValue: 13 },
        { title: 'Reach 14% muscle index', targetValue: 14 }
      ]);
    } else if (preset === 'steps') {
      setTitle('Daily 10k Habits');
      setType('steps');
      setStartValue('4000');
      setTargetValue('10000');
      setUnit('steps');
      setMilestones([
        { title: 'Consistent 6k daily', targetValue: 6000 },
        { title: 'Hit 8k steps milestone', targetValue: 8000 }
      ]);
    } else if (preset === 'stamina') {
      setTitle('5k Run Endurance');
      setType('stamina');
      setStartValue('25');
      setTargetValue('20');
      setUnit('mins');
      setMilestones([
        { title: 'Hit 23 mins pace', targetValue: 23 },
        { title: 'Hit 21.5 mins pace', targetValue: 21.5 }
      ]);
    }
  };

  // ── Add Custom Milestone ──────────────────────────────────────────────────
  const handleAddMilestone = () => {
    if (!milestoneInput || !milestoneTarget) return;
    setMilestones([
      ...milestones,
      { title: milestoneInput, targetValue: parseFloat(milestoneTarget) }
    ]);
    setMilestoneInput('');
    setMilestoneTarget('');
  };

  const handleRemoveMilestone = (idx: number) => {
    setMilestones(milestones.filter((_, i) => i !== idx));
  };

  // ── Handle Submit Create ──────────────────────────────────────────────────
  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title || !startValue || !targetValue) {
      setFormError('Please fill in goal title, starting value, and targets.');
      return;
    }

    const startVal = parseFloat(startValue);
    const targetVal = parseFloat(targetValue);

    const res = await createGoal({
      title,
      type,
      startValue: startVal,
      targetValue: targetVal,
      unit,
      deadline: deadline || undefined,
      milestones
    });

    if (res.success) {
      setShowCreateForm(false);
      setTitle('');
      setStartValue('');
      setTargetValue('');
      setUnit('kg');
      setDeadline('');
      setMilestones([]);
    } else {
      setFormError(res.message || 'Failed to create goal.');
    }
  };

  // ── Handle Log Progress Submit ───────────────────────────────────────────
  const handleLogProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogMsg(null);

    if (!activeLogGoalId || !loggedValue) return;

    const val = parseFloat(loggedValue);
    const result = await logProgress(activeLogGoalId, val, logNotes);

    if (result.success) {
      setLogMsg({ type: 'success', text: 'Progress updated, milestones refreshed!' });
      setLoggedValue('');
      setLogNotes('');
      // Keep card open momentarily, then close
      setTimeout(() => {
        setActiveLogGoalId(null);
        setLogMsg(null);
      }, 1500);
    } else {
      setLogMsg({ type: 'error', text: result.message || 'Error updating progress.' });
    }
  };

  // ── Dynamic Smart Reminders / Coach Generator ─────────────────────────────
  const getCoachAdvice = (goal: FitnessGoalRecord) => {
    const isDecreasing = goal.targetValue < goal.startValue;
    const totalDiff = goal.targetValue - goal.startValue;
    const progressDiff = goal.currentValue - goal.startValue;
    
    // Percentage calculation
    let percentage = 0;
    if (totalDiff !== 0) {
      percentage = Math.min(100, Math.max(0, Math.round((progressDiff / totalDiff) * 100)));
    }

    if (goal.status === 'completed') {
      return {
        text: 'Target reached! Fantastic consistency. Set a new progressive threshold to keep leveling up!',
        alertType: 'success'
      };
    }

    if (goal.type === 'weight') {
      if (percentage >= 75) {
        return {
          text: `You are incredibly close to your weight target! Hold strict onto hydration and maintain a moderate calorie deficit. You got this!`,
          alertType: 'urgent'
        };
      } else if (percentage >= 40) {
        return {
          text: `Solid steady progress. Integrate 2 rounds of active HIIT cardio sessions this week to accelerate metabolism!`,
          alertType: 'normal'
        };
      } else {
        return {
          text: `Goal established. Kick off today with a high-protein breakfast and log your compound lifts!`,
          alertType: 'normal'
        };
      }
    } else if (goal.type === 'steps') {
      if (percentage >= 70) {
        return {
          text: `Amazing daily steps habits! You are averaging high levels. Add a 10 min evening recovery walk to secure the streak.`,
          alertType: 'success'
        };
      } else {
        return {
          text: `Daily active step habits are compounding! Opt for taking the stairs today and log active cardio gaps.`,
          alertType: 'normal'
        };
      }
    } else if (goal.type === 'muscle') {
      return {
        text: `Keep prioritizing absolute protein targets (1.6g per kg of bodyweight) and focus on progressive heavy overload today.`,
        alertType: 'normal'
      };
    } else {
      return {
        text: `Outstanding focus! Log your metrics weekly to review dynamic visual sparkline charts.`,
        alertType: 'normal'
      };
    }
  };

  // ── Render Dynamic SVG progress trends chart ──────────────────────────────
  const renderSparkline = (logs: any[], target: number, start: number, unitStr: string) => {
    if (logs.length < 2) {
      return (
        <div className="py-6 px-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl text-center border border-dashed border-gray-200 dark:border-gray-800">
          <Clock className="w-5 h-5 mx-auto text-gray-400 mb-1" />
          <p className="text-xs text-gray-400 italic">Progress charts will generate automatically after your next metric update log.</p>
        </div>
      );
    }

    // Sort logs by date
    const sortedLogs = [...logs].sort((a, b) => new Date(a.weekStartDate).getTime() - new Date(b.weekStartDate).getTime());

    const width = 600;
    const height = 160;
    const paddingX = 40;
    const paddingY = 30;

    const minVal = Math.min(...sortedLogs.map(l => l.loggedValue), target, start);
    const maxVal = Math.max(...sortedLogs.map(l => l.loggedValue), target, start);
    const valRange = maxVal - minVal || 1;

    // Convert logs into SVG coordinate strings
    const points = sortedLogs.map((log, idx) => {
      const x = paddingX + (idx / (sortedLogs.length - 1)) * (width - 2 * paddingX);
      const y = height - paddingY - ((log.loggedValue - minVal) / valRange) * (height - 2 * paddingY);
      return `${x},${y}`;
    }).join(' ');

    const targetY = height - paddingY - ((target - minVal) / valRange) * (height - 2 * paddingY);
    const startY = height - paddingY - ((start - minVal) / valRange) * (height - 2 * paddingY);

    return (
      <div className="w-full overflow-hidden mt-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingX} y1={startY} x2={width - paddingX} y2={startY} stroke="#e5e7eb" strokeWidth="1" className="dark:stroke-gray-800" />
          <text x={paddingX - 8} y={startY + 4} textAnchor="end" className="text-[9px] font-bold fill-gray-400">Start</text>

          {/* Shaded Area */}
          <path
            d={`M ${paddingX},${height - paddingY} L ${points} L ${width - paddingX},${height - paddingY} Z`}
            fill="url(#chartGradient)"
          />

          {/* Target Guide Line */}
          <line
            x1={paddingX}
            y1={targetY}
            x2={width - paddingX}
            y2={targetY}
            stroke="#f97316"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />
          <text
            x={width - paddingX + 8}
            y={targetY + 3}
            textAnchor="start"
            className="text-[9px] fill-orange-500 font-extrabold"
          >
            Target ({target})
          </text>

          {/* Trend Line */}
          <polyline
            fill="none"
            stroke="#f97316"
            strokeWidth="3.5"
            points={points}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Dots on points */}
          {sortedLogs.map((log, idx) => {
            const x = paddingX + (idx / (sortedLogs.length - 1)) * (width - 2 * paddingX);
            const y = height - paddingY - ((log.loggedValue - minVal) / valRange) * (height - 2 * paddingY);
            return (
              <g key={idx} className="group">
                <circle
                  cx={x}
                  cy={y}
                  r="6"
                  className="fill-white dark:fill-gray-900 stroke-orange-500 stroke-[3.5] cursor-pointer hover:r-7 transition-all"
                />
                <circle
                  cx={x}
                  cy={y}
                  r="3"
                  className="fill-orange-500"
                />
                <title>{`${log.loggedValue} ${unitStr} (${new Date(log.weekStartDate).toLocaleDateString()})`}</title>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <div className="max-w-7xl mx-auto">

        {/* Page Header */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Award className="w-7 h-7 mr-3 text-orange-500" />
              Fitness Goal Engine
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Configure metrics-driven body targets, unlock custom sub-milestones, track trends and get coaches' insights.
            </p>
          </div>

          <button
            onClick={() => setShowCreateForm(prev => !prev)}
            className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-sm font-semibold shadow-lg hover:scale-105 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {showCreateForm ? 'Cancel Creation' : 'Establish New Goal'}
          </button>
        </div>

        {/* Create Form Card */}
        {showCreateForm && (
          <Card className="mb-8 border-orange-200 dark:border-orange-900/30 shadow-md">
            <CardHeader className="bg-orange-50/50 dark:bg-orange-950/10 border-b border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-center w-full">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-500" />
                  Establish New Performance Target
                </h2>
                {/* Goal Presets Strip */}
                <div className="hidden sm:flex gap-1.5 text-xs font-bold text-gray-500">
                  <button type="button" onClick={() => applyGoalPreset('lose_weight')} className="px-2.5 py-1 bg-white dark:bg-gray-800 border rounded-lg hover:bg-orange-50">Lose 5kg</button>
                  <button type="button" onClick={() => applyGoalPreset('gain_muscle')} className="px-2.5 py-1 bg-white dark:bg-gray-800 border rounded-lg hover:bg-orange-50">Gain Muscle</button>
                  <button type="button" onClick={() => applyGoalPreset('steps')} className="px-2.5 py-1 bg-white dark:bg-gray-800 border rounded-lg hover:bg-orange-50">10k Steps</button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleCreateGoal} className="space-y-6">
                {formError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl text-sm">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Goal Statement</label>
                    <input
                      type="text"
                      placeholder="e.g. Lose 5kg before marathon"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-1 w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Goal Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="mt-1 w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    >
                      <option value="weight">Weight Target</option>
                      <option value="muscle">Muscle Growth</option>
                      <option value="stamina">Stamina/Cardio</option>
                      <option value="steps">Daily Habit Steps</option>
                      <option value="other">Other/Custom</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Starting Metric</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 80.5"
                      value={startValue}
                      onChange={(e) => setStartValue(e.target.value)}
                      className="mt-1 w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Target Metric</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 75.0"
                      value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value)}
                      className="mt-1 w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Metric Unit</label>
                    <input
                      type="text"
                      placeholder="kg, steps, %"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="mt-1 w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Deadline Target</label>
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="mt-1 w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Sub-Milestones Builder */}
                <div className="bg-gray-50/50 dark:bg-gray-800/40 p-5 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                    Custom Goal Milestones (Celebrate mini wins!)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        placeholder="Milestone title, e.g. Hit sub 78kg"
                        value={milestoneInput}
                        onChange={(e) => setMilestoneInput(e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-xs outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Target value"
                        value={milestoneTarget}
                        onChange={(e) => setMilestoneTarget(e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-xs outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddMilestone}
                        className="px-3 bg-orange-500 text-white font-bold rounded-lg text-xs hover:bg-orange-600 transition-colors flex-shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Milestones list preview */}
                  {milestones.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {milestones.map((m, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-gray-800 border rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300">
                          🎯 {m.title} ({m.targetValue} {unit})
                          <button type="button" onClick={() => handleRemoveMilestone(idx)} className="text-red-500 hover:text-red-700 font-bold ml-1">✕</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold shadow-md"
                  >
                    Confirm Goal Targets
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Goals Grid list */}
        {loading ? (
          <div className="text-center py-20">
            <Flame className="w-12 h-12 text-orange-500 animate-bounce mx-auto mb-3" />
            <p className="text-gray-500">Loading your performance thresholds...</p>
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <Target className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">No active goals established</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              Build your customized training path! Define weight, cardio, steps or stamina goals to track weekly reports.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-6 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold shadow-md hover:scale-105 transition-all"
            >
              Establish First Goal
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {goals.map((goal) => {
              const coachAdvice = getCoachAdvice(goal);
              
              // Calculate accurate progress completion percentage
              const totalChange = goal.targetValue - goal.startValue;
              const currentChange = goal.currentValue - goal.startValue;
              let progressPercent = 0;
              if (totalChange !== 0) {
                progressPercent = Math.min(100, Math.max(0, Math.round((currentChange / totalChange) * 100)));
              }

              return (
                <Card key={goal._id} className="overflow-hidden hover:shadow-md transition-all border-l-4 border-l-orange-500">
                  <CardHeader className="bg-gray-50/50 dark:bg-gray-800/40 p-5 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 w-full">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-base font-extrabold text-gray-900 dark:text-white">{goal.title}</h2>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            goal.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400' : 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400'
                          }`}>
                            {goal.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5" />
                          Target: {goal.targetValue} {goal.unit} (Start: {goal.startValue} {goal.unit})
                          {goal.deadline && ` — By ${new Date(goal.deadline).toLocaleDateString()}`}
                        </p>
                      </div>

                      {/* Log Action Button */}
                      <div className="flex items-center gap-2">
                        {goal.status !== 'completed' && (
                          <button
                            onClick={() => {
                              setActiveLogGoalId(goal._id);
                              setLoggedValue(goal.currentValue.toString());
                            }}
                            className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold shadow-sm"
                          >
                            Update Progress Log
                          </button>
                        )}
                        <button
                          onClick={() => deleteGoal(goal._id)}
                          className="p-1.5 border border-gray-200 dark:border-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors text-gray-400"
                          title="Remove Goal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    
                    {/* Log Progress Inline Section */}
                    {activeLogGoalId === goal._id && (
                      <div className="mb-6 p-4 bg-orange-50/50 dark:bg-orange-950/15 border border-orange-100 dark:border-orange-900/30 rounded-2xl animate-slide-down">
                        <form onSubmit={handleLogProgressSubmit} className="space-y-4">
                          <h4 className="text-xs font-black text-orange-600 dark:text-orange-400 uppercase tracking-wider">Weekly Metric Logging</h4>
                          {logMsg && (
                            <div className={`p-2 rounded-lg text-xs font-semibold ${
                              logMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                              {logMsg.text}
                            </div>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[11px] font-bold text-gray-500">Logged Value ({goal.unit})</label>
                              <input
                                type="number"
                                step="0.1"
                                value={loggedValue}
                                onChange={(e) => setLoggedValue(e.target.value)}
                                className="mt-1 w-full px-3 py-1.5 border border-gray-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-xs outline-none"
                                required
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[11px] font-bold text-gray-500">Progress Notes</label>
                              <input
                                type="text"
                                placeholder="Describe current physical state..."
                                value={logNotes}
                                onChange={(e) => setLogNotes(e.target.value)}
                                className="mt-1 w-full px-3 py-1.5 border border-gray-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-xs outline-none"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 text-xs">
                            <button type="button" onClick={() => setActiveLogGoalId(null)} className="px-3 py-1.5 text-gray-500">Cancel</button>
                            <button type="submit" className="px-4 py-1.5 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600">Save Log Entry</button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Progress details */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Metric state dials */}
                      <div className="space-y-4">
                        <div>
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Current progress value</span>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-3xl font-black text-gray-900 dark:text-white">{goal.currentValue}</span>
                            <span className="text-sm font-semibold text-gray-500">{goal.unit}</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-gray-500">
                            <span>Progress</span>
                            <span>{progressPercent}%</span>
                          </div>
                          <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                            <div
                              className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-300"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Automated Smart advice nudges card */}
                        <div className="p-4 bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/30 rounded-2xl flex gap-3">
                          <Sparkles className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5 animate-pulse" />
                          <div>
                            <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-wider block">Coach Smart Nudge</span>
                            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed mt-1 font-medium">
                              {coachAdvice.text}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Milestone checks */}
                      <div className="space-y-3">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Sub-Milestones tracking</span>
                        <div className="space-y-2 bg-gray-50/50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                          {goal.milestones.length === 0 ? (
                            <p className="text-xs text-gray-400 italic text-center py-4">No customized milestones set for this goal.</p>
                          ) : (
                            goal.milestones.map((milestone) => (
                              <div
                                key={milestone._id}
                                onClick={() => toggleMilestone(goal._id, milestone._id!)}
                                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer select-none transition-all ${
                                  milestone.isCompleted
                                    ? 'bg-green-50/60 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 shadow-sm'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-gray-700 hover:border-orange-300'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${milestone.isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-300'}`} />
                                  <span className="text-xs font-bold leading-tight">{milestone.title}</span>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                  {milestone.targetValue} {goal.unit}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Progress reports & Weekly Trends Sparklines */}
                      <div className="space-y-3">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Chronological Progress Trend</span>
                        <div className="p-3 bg-white dark:bg-gray-800/20 rounded-2xl border border-gray-100 dark:border-gray-800">
                          {renderSparkline(goal.weeklyLogs, goal.targetValue, goal.startValue, goal.unit)}
                        </div>
                      </div>

                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default MemberGoals;
