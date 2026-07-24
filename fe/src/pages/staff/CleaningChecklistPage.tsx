import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCleaning, CleaningChecklist } from '../../hooks/useCleaning';
import { CleaningManagementView } from '../../components/cleaning/CleaningManagementView';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { 
  Sparkles, 
  CheckCircle, 
  Square, 
  CheckSquare, 
  Loader2,
  Calendar,
  AlertCircle,
  ThumbsUp,
  Droplet
} from 'lucide-react';

const getLocalDateStr = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const CleaningChecklistPage: React.FC = () => {
  const { user } = useAuth();
  const { loading, getTodayChecklist, toggleItem, completeChecklist } = useCleaning();
  const [checklist, setChecklist] = useState<CleaningChecklist | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const todayStr = getLocalDateStr(new Date());

  const isCleaner = user?.position === 'cleaner';

  useEffect(() => {
    if (isCleaner) {
      loadTodayChecklist();
    }
  }, [isCleaner]);

  const loadTodayChecklist = async () => {
    setErrorMsg(null);
    try {
      const data = await getTodayChecklist(todayStr);
      setChecklist(data);
    } catch (err: any) {
      setErrorMsg('Failed to load today\'s cleaning checklist.');
    }
  };

  const handleToggle = async (itemId: string, currentCompleted: boolean) => {
    if (!checklist) return;
    const updated = await toggleItem(itemId, !currentCompleted);
    if (updated) {
      setChecklist(updated);
    }
  };

  const handleCompleteAll = async () => {
    if (!checklist) return;
    const updated = await completeChecklist(todayStr);
    if (updated) {
      setChecklist(updated);
    }
  };

  // If user is admin, manager, or superadmin, show the management view instead
  if (!isCleaner) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Droplet className="text-orange-500 w-7 h-7" /> Cleaning Operations
            </h1>
            <p className="text-gray-500 dark:text-gray-400">Manage cleaning templates and trace historical checklist completions</p>
          </div>
        </div>
        <CleaningManagementView />
      </div>
    );
  }

  // Cleaner View
  const totalTasks = checklist?.items?.length || 0;
  const completedTasks = checklist?.items?.filter(item => item.completed).length || 0;
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const isAllCompleted = checklist?.status === 'completed';

  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 rounded-3xl p-6 md:p-8 shadow-xl text-white relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
          <Droplet size={300} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <Badge className="bg-white/20 text-white border-none py-1 px-3 text-xs uppercase tracking-wider font-bold">
              Cleaner Portal
            </Badge>
            <h1 className="text-3xl font-extrabold tracking-tight mt-1 flex items-center gap-2">
              Hello, {user?.name}!
            </h1>
            <p className="text-orange-50 text-sm flex items-center gap-1.5">
              <Calendar size={14} />
              {formattedDate}
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 min-w-[150px]">
            <span className="text-xs text-orange-100 block">Today's Progress</span>
            <span className="text-3xl font-black">{progressPct}%</span>
            <span className="text-xs text-orange-200 block mt-1">{completedTasks} of {totalTasks} tasks done</span>
          </div>
        </div>
      </div>

      {loading && !checklist && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
          <span className="text-gray-500">Loading daily checklist...</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900 rounded-2xl p-5 flex items-start gap-3">
          <AlertCircle className="text-rose-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-rose-800 dark:text-rose-400">Error loading checklist</h4>
            <p className="text-xs text-rose-600 dark:text-rose-500 mt-1">{errorMsg}</p>
            <Button onClick={loadTodayChecklist} size="sm" className="mt-3 bg-rose-600 hover:bg-rose-700 text-white">
              Retry
            </Button>
          </div>
        </div>
      )}

      {!loading && !checklist && !errorMsg && (
        <Card className="shadow-lg border border-gray-150 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-3xl p-8 text-center max-w-md mx-auto">
          <CardContent className="space-y-4">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-950/40 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="text-orange-500 w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Checklist Not Configured</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No cleaning checklist template has been defined for your account yet. Please contact your administrator or manager to set up your checklist.
            </p>
          </CardContent>
        </Card>
      )}

      {checklist && (
        <div className="space-y-6">
          {/* Celebrating banner */}
          {isAllCompleted && (
            <div className="bg-emerald-500/10 dark:bg-emerald-950/20 border-2 border-dashed border-emerald-500/30 rounded-3xl p-6 text-center animate-fade-in flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 animate-bounce">
                <CheckCircle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-emerald-800 dark:text-emerald-400">Great Job!</h3>
                <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
                  All gym cleaning checklist tasks are fully completed for today. Thank you for keeping the facility clean and safe!
                </p>
              </div>
            </div>
          )}

          {/* Interactive Checklist list */}
          <Card className="shadow-lg border border-gray-150 dark:border-gray-800 bg-white/85 dark:bg-gray-900/85 backdrop-blur-md rounded-3xl overflow-hidden">
            <div className="p-5 border-b border-gray-150 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/40">
              <h2 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Sparkles className="text-orange-500 w-5 h-5" />
                Tasks Checklist ({completedTasks}/{totalTasks})
              </h2>
              {checklist.status !== 'completed' && totalTasks > 0 && (
                <Button
                  onClick={handleCompleteAll}
                  disabled={loading}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Mark All Completed
                </Button>
              )}
            </div>
            <CardContent className="p-6">
              <div className="space-y-3">
                {checklist.items.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => !loading && handleToggle(item._id, item.completed)}
                    className={`group flex items-center justify-between p-4 border rounded-2xl cursor-pointer select-none transition-all duration-300 transform active:scale-[0.99] ${
                      item.completed
                        ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-gray-500 dark:text-gray-400'
                        : 'bg-white hover:bg-orange-50/10 dark:bg-gray-800 dark:hover:bg-gray-700/60 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:border-orange-200'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <button
                        type="button"
                        className="transition-transform duration-200 group-hover:scale-110"
                      >
                        {item.completed ? (
                          <CheckSquare className="w-6 h-6 text-emerald-500" />
                        ) : (
                          <Square className="w-6 h-6 text-gray-300 dark:text-gray-700" />
                        )}
                      </button>
                      <span className={`text-sm font-semibold leading-relaxed transition-all ${
                        item.completed ? 'line-through opacity-60' : ''
                      }`}>
                        {item.taskName}
                      </span>
                    </div>

                    {item.completed && item.completedAt && (
                      <span className="text-xs text-emerald-600/80 dark:text-emerald-500/80 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                        Completed at {new Date(item.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CleaningChecklistPage;
