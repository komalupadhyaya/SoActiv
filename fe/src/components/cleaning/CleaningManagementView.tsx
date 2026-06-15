import React, { useEffect, useState } from 'react';
import { useStaff } from '../../hooks/useStaff';
import { useCleaning, CleaningChecklist } from '../../hooks/useCleaning';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { 
  ClipboardList, 
  History, 
  Plus, 
  Trash2, 
  Save, 
  User, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowUp, 
  ArrowDown,
  Calendar,
  AlertCircle
} from 'lucide-react';

export const CleaningManagementView: React.FC = () => {
  const { staff, loading: staffLoading, fetchAllStaff } = useStaff();
  const { loading: cleaningLoading, getTemplate, saveTemplate, getLogs } = useCleaning();

  const [selectedCleanerId, setSelectedCleanerId] = useState<string>('');
  const [templateItems, setTemplateItems] = useState<string[]>([]);
  const [newItemText, setNewItemText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'template' | 'history'>('template');
  
  // History states
  const [logs, setLogs] = useState<CleaningChecklist[]>([]);
  const [filterDate, setFilterDate] = useState<string>('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Load all cleaners on mount
  useEffect(() => {
    fetchAllStaff({ role: 'cleaner' });
  }, [fetchAllStaff]);

  // Handle cleaner selection change
  useEffect(() => {
    if (selectedCleanerId) {
      // Fetch template
      getTemplate(selectedCleanerId).then((data) => {
        if (data) {
          setTemplateItems(data.items || []);
        } else {
          setTemplateItems([]);
        }
      });

      // Fetch logs
      fetchLogs();
    } else {
      setTemplateItems([]);
      setLogs([]);
    }
  }, [selectedCleanerId, getTemplate]);

  // Fetch logs whenever selected cleaner or date filter changes
  const fetchLogs = async () => {
    if (selectedCleanerId) {
      const data = await getLogs(selectedCleanerId, filterDate || undefined);
      setLogs(data);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterDate]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = newItemText.trim();
    if (!cleanText) return;
    
    if (templateItems.includes(cleanText)) {
      alert('This task is already in the checklist.');
      return;
    }

    setTemplateItems((prev) => [...prev, cleanText]);
    setNewItemText('');
  };

  const handleRemoveItem = (index: number) => {
    setTemplateItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === templateItems.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...templateItems];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setTemplateItems(updated);
  };

  const handleSaveTemplate = async () => {
    if (!selectedCleanerId) return;
    if (templateItems.length === 0) {
      alert('The checklist template must have at least one item.');
      return;
    }
    const success = await saveTemplate(selectedCleanerId, templateItems);
    if (success) {
      // Refresh logs because it might affect today's pending logs
      fetchLogs();
    }
  };

  // Find currently selected cleaner object
  const selectedCleaner = staff.find((s) => s._id === selectedCleanerId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Column 1: Cleaners Selection */}
      <div className="lg:col-span-1 space-y-4">
        <Card className="shadow-lg border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-orange-50/50 to-amber-50/30 dark:from-gray-800/20 dark:to-gray-900/10">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
              <User className="text-orange-500 w-5 h-5 animate-pulse" />
              Cleaners Staff
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Select a cleaner to manage their template or view logs</p>
          </div>
          <CardContent className="p-4">
            {staffLoading ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-2">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-500">Loading cleaners...</span>
              </div>
            ) : staff.length === 0 ? (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                <AlertCircle className="mx-auto text-amber-500 mb-2" size={24} />
                No staff members with the position of "cleaner" found.
              </div>
            ) : (
              <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                {staff.map((cleaner) => {
                  const isSelected = selectedCleanerId === cleaner._id;
                  return (
                    <button
                      key={cleaner._id}
                      onClick={() => {
                        setSelectedCleanerId(cleaner._id);
                        setExpandedLogId(null);
                      }}
                      className={`w-full text-left p-4 rounded-xl flex justify-between items-center transition-all duration-300 transform ${
                        isSelected
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md scale-[1.02]'
                          : 'bg-gray-50 hover:bg-orange-50/50 dark:bg-gray-800/40 dark:hover:bg-gray-850 dark:text-gray-200 text-gray-800 hover:text-orange-600 dark:hover:text-white border border-transparent dark:border-gray-850 hover:border-orange-100'
                      }`}
                    >
                      <div>
                        <h4 className="font-semibold text-sm leading-tight">{cleaner.fullName}</h4>
                        <span className={`text-xs ${isSelected ? 'text-orange-100' : 'text-gray-400'}`}>
                          {cleaner.email}
                        </span>
                      </div>
                      <Badge className={isSelected ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400'}>
                        Cleaner
                      </Badge>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Column 2 & 3: Configuration & Logging Workspace */}
      <div className="lg:col-span-2 space-y-6">
        {selectedCleanerId ? (
          <div className="space-y-6">
            {/* Header for selected cleaner */}
            <div className="bg-gradient-to-r from-gray-550 to-gray-600 dark:from-gray-800 dark:to-gray-850 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-xs font-bold text-orange-500 dark:text-orange-400 uppercase tracking-widest">Active Workspace</span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{selectedCleaner?.fullName}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">{selectedCleaner?.email} • {selectedCleaner?.contactNumber}</p>
              </div>

              {/* Tabs with HSL Glow effect */}
              <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-800">
                <button
                  onClick={() => setActiveTab('template')}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-300 ${
                    activeTab === 'template'
                      ? 'bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <ClipboardList size={14} />
                  Template
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-300 ${
                    activeTab === 'history'
                      ? 'bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <History size={14} />
                  Logs History
                </button>
              </div>
            </div>

            {/* TAB CONTENT: TEMPLATE EDITOR */}
            {activeTab === 'template' && (
              <Card className="shadow-lg border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Daily Checklist Template</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Tasks that will refresh daily for this cleaner</p>
                  </div>
                  <Button
                    onClick={handleSaveTemplate}
                    disabled={cleaningLoading}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 flex items-center gap-2 border-none shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 py-2"
                  >
                    <Save size={14} />
                    {cleaningLoading ? 'Saving...' : 'Save Template'}
                  </Button>
                </div>
                <CardContent className="p-6 space-y-6">
                  {/* Task Addition Form */}
                  <form onSubmit={handleAddItem} className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="e.g. Sanitize cardiovascular machines"
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <Button type="submit" variant="outline" className="border-orange-200 dark:border-orange-950/40 text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950/10 flex items-center gap-1">
                      <Plus size={16} />
                      Add
                    </Button>
                  </form>

                  {/* Task list with micro-animations */}
                  <div className="space-y-2">
                    {templateItems.length === 0 ? (
                      <div className="text-center py-10 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl text-gray-400">
                        <ClipboardList className="mx-auto opacity-30 mb-2" size={36} />
                        No template tasks defined. Add tasks above.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {templateItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="group flex items-center justify-between p-3.5 bg-gray-50 hover:bg-orange-50/20 dark:bg-gray-850 dark:hover:bg-gray-800/60 border border-gray-100 dark:border-gray-800/80 rounded-xl transition-all duration-300"
                          >
                            <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                              {idx + 1}. {item}
                            </span>
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="ghost"
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveItem(idx, 'up')}
                                className="text-gray-400 hover:text-orange-500 h-8 w-8 p-0"
                              >
                                <ArrowUp size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                type="button"
                                disabled={idx === templateItems.length - 1}
                                onClick={() => handleMoveItem(idx, 'down')}
                                className="text-gray-400 hover:text-orange-500 h-8 w-8 p-0"
                              >
                                <ArrowDown size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 h-8 w-8 p-0"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TAB CONTENT: HISTORICAL LOGS */}
            {activeTab === 'history' && (
              <Card className="shadow-lg border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <History className="text-orange-500 w-4.5 h-4.5" />
                      Daily Completion Logs
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Track daily checklists and verification times</p>
                  </div>

                  {/* Date picker */}
                  <div className="flex items-center gap-2 max-w-[200px]">
                    <Calendar size={14} className="text-gray-400" />
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="w-full text-xs px-2 py-1.5 border border-gray-200 dark:border-gray-800 rounded-lg dark:bg-gray-800 dark:text-white"
                    />
                    {filterDate && (
                      <button
                        onClick={() => setFilterDate('')}
                        className="text-xs text-rose-500 hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <CardContent className="p-6">
                  {cleaningLoading && logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-2">
                      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-gray-500">Retrieving logs...</span>
                    </div>
                  ) : logs.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <History className="mx-auto opacity-20 mb-2" size={36} />
                      No completed logs found {filterDate ? 'for this date' : 'yet'}.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {logs.map((log) => {
                        const isExpanded = expandedLogId === log._id;
                        const totalTasks = log.items.length;
                        const completedTasks = log.items.filter(item => item.completed).length;
                        const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                        const statusColor = log.status === 'completed' ? 'text-emerald-500' : 'text-amber-500';

                        return (
                          <div
                            key={log._id}
                            className="border border-gray-150 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-gray-900"
                          >
                            {/* Log Summary Row */}
                            <div
                              onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                              className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer bg-gray-50/50 hover:bg-gray-100/40 dark:bg-gray-850/40 dark:hover:bg-gray-800/80 transition-colors"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-gray-900 dark:text-white">
                                    {new Date(log.dateStr + 'T00:00:00').toLocaleDateString(undefined, {
                                      weekday: 'short',
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </span>
                                  <Badge className={log.status === 'completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'}>
                                    {log.status.toUpperCase()}
                                  </Badge>
                                </div>
                                <div className="text-xs text-gray-400 flex items-center gap-1.5">
                                  <Clock size={12} />
                                  {log.completedAt ? (
                                    <span>Completed: {new Date(log.completedAt).toLocaleTimeString()}</span>
                                  ) : (
                                    <span>Started: {new Date(log.createdAt).toLocaleTimeString()}</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-3 w-full sm:w-auto">
                                <div className="flex-1 sm:flex-none text-right">
                                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block sm:inline">Progress: </span>
                                  <span className="text-sm font-bold dark:text-white">
                                    {completedTasks}/{totalTasks} ({progressPct}%)
                                  </span>
                                  {/* Small progress bar */}
                                  <div className="w-24 bg-gray-200 dark:bg-gray-800 h-1.5 rounded-full mt-1 overflow-hidden ml-auto">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        log.status === 'completed' ? 'bg-emerald-500' : 'bg-orange-500'
                                      }`}
                                      style={{ width: `${progressPct}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Log Checklist Item Details (Expandable) */}
                            {isExpanded && (
                              <div className="border-t border-gray-150 dark:border-gray-800 p-4 bg-gray-50/20 dark:bg-gray-900/50 space-y-2.5">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Checklist Task Checklist Details</h4>
                                {log.items.map((item) => (
                                  <div
                                    key={item._id}
                                    className="flex justify-between items-center py-2 px-3 bg-white dark:bg-gray-850 rounded-lg border border-gray-100 dark:border-gray-800/80 text-sm"
                                  >
                                    <div className="flex items-center gap-2">
                                      {item.completed ? (
                                        <CheckCircle2 size={16} className="text-emerald-500" />
                                      ) : (
                                        <XCircle size={16} className="text-gray-300 dark:text-gray-700" />
                                      )}
                                      <span className={item.completed ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-400 line-through'}>
                                        {item.taskName}
                                      </span>
                                    </div>
                                    {item.completed && item.completedAt && (
                                      <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <Clock size={11} />
                                        {new Date(item.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl p-8 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
            <ClipboardList className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4 animate-bounce" />
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">No Cleaner Workspace Selected</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm text-center">
              Please choose a staff cleaner from the left pane to define checklist templates or analyze historical task logs.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
