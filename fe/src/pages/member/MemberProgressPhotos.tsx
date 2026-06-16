import React, { useState, useMemo } from 'react';
import { useProgressPhotos, type ProgressPhotoRecord } from '../../hooks/useProgressPhotos';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import {
  Camera,
  Plus,
  TrendingDown,
  Sparkles,
  Maximize2,
  Calendar,
  Layers,
  Info,
  Clock,
  Loader2,
  TrendingUp
} from 'lucide-react';

const baseApi = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const API_URL = baseApi.endsWith('/api/v1') ? baseApi : `${baseApi}/api/v1`;

// Direct utility to prepend server URL to local uploads
const formatPhotoUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const baseUrl = API_URL.replace('/api/v1', '');
  return `${baseUrl}${url}`;
};

export const MemberProgressPhotos: React.FC = () => {
  const { timeline, loading, uploading, uploadPhotos } = useProgressPhotos();

  // Upload Form State
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [sideFile, setSideFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);

  const [frontPreview, setFrontPreview] = useState<string>('');
  const [sidePreview, setSidePreview] = useState<string>('');
  const [backPreview, setBackPreview] = useState<string>('');

  const [weight, setWeight] = useState<string>('');
  const [bodyFat, setBodyFat] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [takenAt, setTakenAt] = useState<string>(new Date().toISOString().split('T')[0]);

  const [formMsg, setFormMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showUploadCard, setShowUploadCard] = useState(false);

  // Comparison State
  const [beforeEntry, setBeforeEntry] = useState<ProgressPhotoRecord | null>(null);
  const [afterEntry, setAfterEntry] = useState<ProgressPhotoRecord | null>(null);
  const [comparePose, setComparePose] = useState<'front' | 'side' | 'back'>('front');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Preview Image Zoom Modal
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);

  // ── Handle Previews ───────────────────────────────────────────────────────
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview: (p: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // ── Submit Form ──────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    if (!frontFile && !sideFile && !backFile) {
      setFormMsg({ type: 'error', text: 'Please upload at least one pose photo.' });
      return;
    }

    const formData = new FormData();
    if (frontFile) formData.append('frontPhoto', frontFile);
    if (sideFile) formData.append('sidePhoto', sideFile);
    if (backFile) formData.append('backPhoto', backFile);

    if (weight) formData.append('weight', weight);
    if (bodyFat) formData.append('bodyFat', bodyFat);
    formData.append('notes', notes);
    formData.append('takenAt', new Date(takenAt).toISOString());

    const result = await uploadPhotos(formData);
    
    if (result.success) {
      setFormMsg({ type: 'success', text: 'Photos recorded successfully!' });
      // Reset Form fields
      setFrontFile(null);
      setSideFile(null);
      setBackFile(null);
      setFrontPreview('');
      setSidePreview('');
      setBackPreview('');
      setWeight('');
      setBodyFat('');
      setNotes('');
      setShowUploadCard(false);
    } else {
      setFormMsg({ type: 'error', text: result.message });
    }
  };

  // ── Group Timeline by Month ──────────────────────────────────────────────
  const groupedTimeline = useMemo(() => {
    return timeline.reduce((acc: { [key: string]: ProgressPhotoRecord[] }, item) => {
      const month = new Date(item.takenAt).toLocaleString('default', {
        month: 'long',
        year: 'numeric',
      });
      if (!acc[month]) acc[month] = [];
      acc[month].push(item);
      return acc;
    }, {});
  }, [timeline]);

  // ── Calculate Transformations Stats ───────────────────────────────────────
  const transformationStats = useMemo(() => {
    if (timeline.length < 2) return null;
    const sorted = [...timeline].sort((a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime());
    const initial = sorted[0];
    const current = sorted[sorted.length - 1];

    const weightDiff = (current.weight && initial.weight) ? parseFloat((current.weight - initial.weight).toFixed(1)) : 0;
    const bodyFatDiff = (current.bodyFat && initial.bodyFat) ? parseFloat((current.bodyFat - initial.bodyFat).toFixed(1)) : 0;

    return {
      initialWeight: initial.weight,
      currentWeight: current.weight,
      weightDiff,
      initialBodyFat: initial.bodyFat,
      currentBodyFat: current.bodyFat,
      bodyFatDiff,
      totalEntries: timeline.length
    };
  }, [timeline]);

  // ── Select for Comparison ────────────────────────────────────────────────
  const handleSelectCompare = (entry: ProgressPhotoRecord) => {
    if (!beforeEntry) {
      setBeforeEntry(entry);
    } else if (beforeEntry._id === entry._id) {
      setBeforeEntry(null);
    } else {
      // Set the older as before, newer as after
      const d1 = new Date(beforeEntry.takenAt).getTime();
      const d2 = new Date(entry.takenAt).getTime();
      if (d1 < d2) {
        setAfterEntry(entry);
      } else {
        setAfterEntry(beforeEntry);
        setBeforeEntry(entry);
      }
      setShowCompareModal(true);
    }
  };

  const clearComparison = () => {
    setBeforeEntry(null);
    setAfterEntry(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <div className="max-w-7xl mx-auto">

        {/* Page Header */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Camera className="w-7 h-7 mr-3 text-orange-500" />
              Visual Progress Tracker
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Upload periodically, view your physical transformations timeline, and run split before/after sliders.
            </p>
          </div>

          <button
            onClick={() => setShowUploadCard(prev => !prev)}
            className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-sm font-semibold shadow-lg hover:scale-105 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {showUploadCard ? 'Cancel Upload' : 'Log New Progress'}
          </button>
        </div>

        {/* Stats and Analytics Strip */}
        {transformationStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Weight Shift</p>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1.5">
                    {transformationStats.initialWeight} kg → {transformationStats.currentWeight} kg
                  </h3>
                  <p className={`text-xs mt-1 font-bold flex items-center ${
                    transformationStats.weightDiff < 0 ? 'text-green-600' : transformationStats.weightDiff > 0 ? 'text-orange-500' : 'text-gray-500'
                  }`}>
                    {transformationStats.weightDiff < 0 ? <TrendingDown className="w-3.5 h-3.5 mr-1" /> : <TrendingUp className="w-3.5 h-3.5 mr-1" />}
                    {transformationStats.weightDiff === 0 ? 'No change' : `${Math.abs(transformationStats.weightDiff)} kg diff`}
                  </p>
                </div>
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Body Fat Progress</p>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1.5">
                    {transformationStats.initialBodyFat ? `${transformationStats.initialBodyFat}%` : 'N/A'} → {transformationStats.currentBodyFat ? `${transformationStats.currentBodyFat}%` : 'N/A'}
                  </h3>
                  {transformationStats.currentBodyFat && transformationStats.initialBodyFat && (
                    <p className={`text-xs mt-1 font-bold flex items-center ${
                      transformationStats.bodyFatDiff < 0 ? 'text-green-600' : 'text-orange-500'
                    }`}>
                      {transformationStats.bodyFatDiff < 0 ? <TrendingDown className="w-3.5 h-3.5 mr-1" /> : <TrendingUp className="w-3.5 h-3.5 mr-1" />}
                      {transformationStats.bodyFatDiff === 0 ? 'No change' : `${Math.abs(transformationStats.bodyFatDiff)}% body fat shift`}
                    </p>
                  )}
                </div>
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Snapshots</p>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                    {transformationStats.totalEntries} log entries
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 flex items-center">
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500 animate-pulse" /> Keep updating to track milestones!
                  </p>
                </div>
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Upload Form Card */}
        {showUploadCard && (
          <Card className="mb-8 overflow-hidden border-orange-200 dark:border-orange-900/30 shadow-md">
            <CardHeader className="bg-orange-50/50 dark:bg-orange-950/10 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-orange-500" />
                Log Periodic Progress Entry
              </h2>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Photo Dropzone Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Front Pose */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Front Pose (Required)</label>
                    <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-orange-400 rounded-xl aspect-[3/4] flex flex-col items-center justify-center p-3 cursor-pointer overflow-hidden transition-all bg-gray-50/50 dark:bg-gray-800/40">
                      {frontPreview ? (
                        <>
                          <img src={frontPreview} className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-xs text-white font-bold bg-black/60 px-3 py-1 rounded-full">Change Front</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center">
                          <Camera className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Click to upload Front Pose</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, setFrontFile, setFrontPreview)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        required
                      />
                    </div>
                  </div>

                  {/* Side Pose */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Side Pose (Optional)</label>
                    <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-orange-400 rounded-xl aspect-[3/4] flex flex-col items-center justify-center p-3 cursor-pointer overflow-hidden transition-all bg-gray-50/50 dark:bg-gray-800/40">
                      {sidePreview ? (
                        <>
                          <img src={sidePreview} className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-xs text-white font-bold bg-black/60 px-3 py-1 rounded-full">Change Side</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center">
                          <Camera className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Click to upload Side Pose</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, setSideFile, setSidePreview)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Back Pose */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Back Pose (Optional)</label>
                    <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-orange-400 rounded-xl aspect-[3/4] flex flex-col items-center justify-center p-3 cursor-pointer overflow-hidden transition-all bg-gray-50/50 dark:bg-gray-800/40">
                      {backPreview ? (
                        <>
                          <img src={backPreview} className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-xs text-white font-bold bg-black/60 px-3 py-1 rounded-full">Change Back</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center">
                          <Camera className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Click to upload Back Pose</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, setBackFile, setBackPreview)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Metric inputs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 74.5"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="mt-1 w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Body Fat (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 16.2"
                      value={bodyFat}
                      onChange={(e) => setBodyFat(e.target.value)}
                      className="mt-1 w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Log Date</label>
                    <input
                      type="date"
                      value={takenAt}
                      onChange={(e) => setTakenAt(e.target.value)}
                      className="mt-1 w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Progress Notes</label>
                  <textarea
                    placeholder="Describe how you feel, energy levels, diet notes..."
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1 w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowUploadCard(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                  >
                    Close Form
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold shadow-md disabled:opacity-50 flex items-center gap-2"
                  >
                    {uploading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Saving Snapshots...</>
                    ) : (
                      'Save Progress Log'
                    )}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Global Action feedback */}
        {formMsg && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium border ${
            formMsg.type === 'success'
              ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
          }`}>
            {formMsg.text}
          </div>
        )}

        {/* Selection Comparison Banner */}
        {beforeEntry && (
          <div className="mb-6 p-4 rounded-2xl bg-orange-500 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                🏆
              </div>
              <div>
                <p className="font-bold text-sm leading-tight">Transformation Comparison Mode</p>
                <p className="text-xs text-orange-100 mt-0.5">
                  Selected Before: <span className="font-bold underline">{new Date(beforeEntry.takenAt).toLocaleDateString()}</span>
                  {!afterEntry ? ' — Click "Compare" on another date entry to load Split view!' : ` — Selected After: ${new Date(afterEntry.takenAt).toLocaleDateString()}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {afterEntry && (
                <button
                  onClick={() => setShowCompareModal(true)}
                  className="px-4 py-1.5 bg-white text-orange-600 hover:bg-orange-50 rounded-xl text-xs font-extrabold shadow"
                >
                  Open Slider Tool
                </button>
              )}
              <button
                onClick={clearComparison}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 rounded-xl text-xs font-bold"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Timeline List Section */}
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-3" />
            <p className="text-gray-500">Loading your visual history timeline...</p>
          </div>
        ) : timeline.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <Camera className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">No progress entries logged yet</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
              Start your transformation record! Upload your first front pose snapshot today with notes, weight, and track your visual shifts.
            </p>
            <button
              onClick={() => setShowUploadCard(true)}
              className="mt-6 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold shadow-md hover:scale-105 transition-all"
            >
              Log First Entry
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.keys(groupedTimeline).map((monthStr) => (
              <div key={monthStr} className="space-y-6">
                
                {/* Month header */}
                <div className="flex items-center gap-4">
                  <div className="px-4 py-1.5 bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 rounded-xl font-bold text-sm shadow-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {monthStr}
                  </div>
                  <div className="h-[1px] bg-gray-200 dark:bg-gray-800 flex-1" />
                </div>

                {/* Timeline Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedTimeline[monthStr].map((entry) => (
                    <Card key={entry._id} className="group overflow-hidden hover:shadow-md transition-shadow relative">
                      
                      {/* Photo poses carousel */}
                      <div className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-950">
                        {entry.frontPhoto ? (
                          <img
                            src={formatPhotoUrl(entry.frontPhoto)}
                            className="w-full h-full object-cover transition-transform group-hover:scale-102"
                            alt="Front Pose"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                            <Camera className="w-8 h-8" />
                            <span className="text-xs">No Front Pose</span>
                          </div>
                        )}

                        {/* Hover Overlay with Pose Previews */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-between text-white z-10">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] bg-orange-500/80 px-2 py-0.5 rounded-full font-bold uppercase">
                              Pose Hub
                            </span>
                            <button
                              onClick={() => setZoomUrl(formatPhotoUrl(entry.frontPhoto || entry.sidePhoto || entry.backPhoto))}
                              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40"
                              title="Zoom pose"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Quick small thumbnails in overlay for side and back poses */}
                          <div className="flex gap-2">
                            {entry.sidePhoto && (
                              <div
                                onClick={() => setZoomUrl(formatPhotoUrl(entry.sidePhoto))}
                                className="w-12 h-16 rounded border border-white/30 overflow-hidden cursor-zoom-in"
                                title="Click to view Side Pose"
                              >
                                <img src={formatPhotoUrl(entry.sidePhoto)} className="w-full h-full object-cover" />
                              </div>
                            )}
                            {entry.backPhoto && (
                              <div
                                onClick={() => setZoomUrl(formatPhotoUrl(entry.backPhoto))}
                                className="w-12 h-16 rounded border border-white/30 overflow-hidden cursor-zoom-in"
                                title="Click to view Back Pose"
                              >
                                <img src={formatPhotoUrl(entry.backPhoto)} className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Header log entry */}
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-extrabold text-sm text-gray-900 dark:text-white">
                              {new Date(entry.takenAt).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric'
                              })}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5 flex items-center">
                              <Clock className="w-3 h-3 mr-1" /> Logged {new Date(entry.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex flex-col items-end">
                            {entry.weight && (
                              <span className="text-sm font-black text-orange-500">
                                {entry.weight} kg
                              </span>
                            )}
                            {entry.bodyFat && (
                              <span className="text-[10px] font-bold text-gray-400">
                                {entry.bodyFat}% Body Fat
                              </span>
                            )}
                          </div>
                        </div>

                        {entry.notes && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 bg-gray-50 dark:bg-gray-900/30 p-2 rounded-lg italic">
                            "{entry.notes}"
                          </p>
                        )}

                        {/* Compare Selector button */}
                        <div className="pt-2 flex justify-between gap-2 border-t border-gray-100 dark:border-gray-800">
                          <button
                            onClick={() => handleSelectCompare(entry)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                              beforeEntry?._id === entry._id
                                ? 'bg-orange-500 text-white border-orange-500'
                                : afterEntry?._id === entry._id
                                ? 'bg-orange-400 text-white border-orange-400'
                                : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:text-orange-600'
                            }`}
                          >
                            {beforeEntry?._id === entry._id
                              ? 'Selected "Before"'
                              : afterEntry?._id === entry._id
                              ? 'Selected "After"'
                              : beforeEntry
                              ? 'Compare with this'
                              : 'Select to Compare'}
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* ─── SPLIT COMPARISON SLIDER MODAL ────────────────────────────────────── */}
      {showCompareModal && beforeEntry && afterEntry && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden max-w-3xl w-full shadow-2xl animate-scale-up max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                  Split Pose Transformation Slider
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Before: {new Date(beforeEntry.takenAt).toLocaleDateString()} ({beforeEntry.weight}kg) vs After: {new Date(afterEntry.takenAt).toLocaleDateString()} ({afterEntry.weight}kg)
                </p>
              </div>
              <button
                onClick={() => setShowCompareModal(false)}
                className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-500 font-bold flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              
              {/* Pose Selector Tabs */}
              <div className="flex border border-gray-200 dark:border-gray-700 rounded-xl p-1 bg-gray-50 dark:bg-gray-800 text-sm flex-shrink-0">
                {['front', 'side', 'back'].map((pose) => {
                  const label = pose.charAt(0).toUpperCase() + pose.slice(1);
                  const isAvailable = (pose === 'front' && beforeEntry.frontPhoto && afterEntry.frontPhoto) ||
                                      (pose === 'side' && beforeEntry.sidePhoto && afterEntry.sidePhoto) ||
                                      (pose === 'back' && beforeEntry.backPhoto && afterEntry.backPhoto);
                  return (
                    <button
                      key={pose}
                      onClick={() => setComparePose(pose as any)}
                      disabled={!isAvailable}
                      className={`flex-1 py-1.5 rounded-lg font-medium text-center transition-all ${
                        !isAvailable ? 'opacity-40 cursor-not-allowed text-gray-400' :
                        comparePose === pose
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {label} Pose {!isAvailable && '(N/A)'}
                    </button>
                  );
                })}
              </div>

              {/* SPLIT SLIDER WORKSPACE */}
              <div className="relative aspect-[3/4] w-full max-w-[280px] sm:max-w-[340px] md:max-w-md mx-auto overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg bg-gray-100 dark:bg-gray-950 select-none">
                
                {/* Background Image: BEFORE */}
                <img
                  src={formatPhotoUrl(
                    comparePose === 'front' ? beforeEntry.frontPhoto :
                    comparePose === 'side' ? beforeEntry.sidePhoto : beforeEntry.backPhoto
                  )}
                  className="absolute inset-0 w-full h-full object-contain"
                  alt="Before Frame"
                />
                
                {/* Overlay Image: AFTER (Clipped) */}
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
                >
                  <img
                    src={formatPhotoUrl(
                      comparePose === 'front' ? afterEntry.frontPhoto :
                      comparePose === 'side' ? afterEntry.sidePhoto : afterEntry.backPhoto
                    )}
                    className="absolute inset-0 w-full h-full object-contain"
                    alt="After Frame"
                  />
                </div>

                {/* Split line divider */}
                <div
                  className="absolute inset-y-0 w-0.5 bg-orange-500 cursor-ew-resize flex items-center justify-center"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="w-8 h-8 rounded-full bg-orange-500 text-white border-2 border-white flex items-center justify-center font-bold text-xs pointer-events-none shadow-lg -translate-x-1/2">
                    ↔
                  </div>
                </div>

                {/* Range overlay slider to control the position */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPosition}
                  onChange={(e) => setSliderPosition(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                />

                {/* Tags label before/after overlay */}
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-[10px] font-black text-white px-2 py-1 rounded-md uppercase pointer-events-none">
                  Before
                </div>
                <div className="absolute top-3 right-3 bg-orange-500/80 backdrop-blur-sm text-[10px] font-black text-white px-2 py-1 rounded-md uppercase pointer-events-none">
                  After
                </div>
              </div>

              {/* Slider instruction details */}
              <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 p-3.5 rounded-xl text-center flex items-center justify-center gap-2 text-xs text-orange-700 dark:text-orange-400 font-medium">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>Drag the visual slider bar left and right across the frame to compare pose details!</span>
              </div>
            </div>

            {/* Modal footer */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
              <button
                onClick={() => setShowCompareModal(false)}
                className="px-4 py-2 bg-gray-900 hover:bg-black dark:bg-gray-800 dark:hover:bg-gray-700 text-white text-xs font-bold rounded-xl"
              >
                Close Tool
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MAXIMIZED IMAGE VIEW MODAL ────────────────────────────────────────── */}
      {zoomUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomUrl(null)}
        >
          <button
            onClick={() => setZoomUrl(null)}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/40 flex items-center justify-center text-xl font-bold"
          >
            ✕
          </button>
          <img src={zoomUrl} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" alt="Maximized" />
        </div>
      )}

    </div>
  );
};

export default MemberProgressPhotos;
