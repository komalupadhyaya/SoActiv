import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Video, 
  Layers, 
  Flame, 
  HelpCircle, 
  X, 
  AlertTriangle,
  Play,
  ArrowRight,
  TrendingUp,
  Dumbbell
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import api from '../../utils/api';

interface Exercise {
  _id: string;
  title: string;
  category: 'Chest' | 'Back' | 'Legs' | 'Cardio' | 'Yoga';
  muscleTargeting: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  videoUrl: string;
  instructions: string[];
}

export const AdminExerciseLibrary: React.FC = () => {
  const { addToast } = useToast();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Chest' as 'Chest' | 'Back' | 'Legs' | 'Cardio' | 'Yoga',
    muscleTargeting: '',
    difficulty: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
    videoUrl: '',
    instructions: ['']
  });

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Video popup modal states
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);
  const [playingVideoTitle, setPlayingVideoTitle] = useState<string>('');

  useEffect(() => {
    fetchExercises();
  }, []);

  // Lock body scroll when video is playing
  useEffect(() => {
    if (playingVideoUrl) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [playingVideoUrl]);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const response = await api.get('/exercises');
      if (response.data.success) {
        setExercises(response.data.data);
      } else {
        addToast(response.data.message || 'Failed to fetch exercises', 'error');
      }
    } catch (error: any) {
      addToast(error.response?.data?.message || 'Connection error. Could not load exercises.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingExercise(null);
    setFormData({
      title: '',
      category: 'Chest',
      muscleTargeting: '',
      difficulty: 'Beginner',
      videoUrl: '',
      instructions: ['']
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setFormData({
      title: exercise.title,
      category: exercise.category,
      muscleTargeting: exercise.muscleTargeting,
      difficulty: exercise.difficulty,
      videoUrl: exercise.videoUrl,
      instructions: exercise.instructions.length > 0 ? [...exercise.instructions] : ['']
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Dynamic Instructions actions
  const handleInstructionChange = (index: number, value: string) => {
    const newInstructions = [...formData.instructions];
    newInstructions[index] = value;
    setFormData(prev => ({
      ...prev,
      instructions: newInstructions
    }));
  };

  const handleAddInstructionStep = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }));
  };

  const handleRemoveInstructionStep = (index: number) => {
    if (formData.instructions.length === 1) return;
    const newInstructions = formData.instructions.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      instructions: newInstructions
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) return addToast('Title is required', 'error');
    if (!formData.muscleTargeting.trim()) return addToast('Muscle targeted is required', 'error');
    if (!formData.videoUrl.trim()) return addToast('Video URL is required', 'error');
    
    // Clean empty instruction steps
    const cleanedInstructions = formData.instructions
      .map(step => step.trim())
      .filter(step => step.length > 0);

    const payload = {
      ...formData,
      instructions: cleanedInstructions
    };

    try {
      const response = editingExercise 
        ? await api.put(`/exercises/${editingExercise._id}`, payload)
        : await api.post('/exercises', payload);

      if (response.data.success) {
        addToast(editingExercise ? 'Exercise updated successfully!' : 'New exercise added successfully!', 'success');
        setIsModalOpen(false);
        fetchExercises();
      } else {
        addToast(response.data.message || 'Operation failed', 'error');
      }
    } catch (error: any) {
      addToast(error.response?.data?.message || 'Connection error. Save failed.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await api.delete(`/exercises/${id}`);
      if (response.data.success) {
        addToast('Exercise deleted successfully', 'success');
        setDeleteConfirmId(null);
        fetchExercises();
      } else {
        addToast(response.data.message || 'Delete failed', 'error');
      }
    } catch (error: any) {
      addToast(error.response?.data?.message || 'Connection error. Delete failed.', 'error');
    }
  };

  // Helper to extract YouTube video ID or format URL safely
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    try {
      // YouTube standard or share link
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = '';
        if (url.includes('youtu.be/')) {
          videoId = url.split('youtu.be/')[1]?.split(/[?#]/)[0];
        } else {
          videoId = url.split('v=')[1]?.split(/[&?#]/)[0];
        }
        return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
      }
    } catch (e) {}
    return url;
  };

  const getYouTubeThumbnail = (url: string) => {
    if (!url) return '';
    try {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = '';
        if (url.includes('youtu.be/')) {
          videoId = url.split('youtu.be/')[1]?.split(/[?#]/)[0];
        } else {
          videoId = url.split('v=')[1]?.split(/[&?#]/)[0];
        }
        return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';
      }
    } catch (e) {}
    return '';
  };

  // Filter exercises logic
  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = 
      ex.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      ex.muscleTargeting.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'All' || ex.category === categoryFilter;
    const matchesDifficulty = difficultyFilter === 'All' || ex.difficulty === difficultyFilter;

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  // Calculate quick stats
  const stats = {
    total: exercises.length,
    chest: exercises.filter(e => e.category === 'Chest').length,
    back: exercises.filter(e => e.category === 'Back').length,
    legs: exercises.filter(e => e.category === 'Legs').length,
    other: exercises.filter(e => e.category === 'Cardio' || e.category === 'Yoga').length
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <span className="p-2.5 bg-orange-500 rounded-2xl shadow-lg shadow-orange-500/20 text-white">
              <Dumbbell className="w-7 h-7" />
            </span>
            Exercise Library Management
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Create, update, and manage workout and instructional videos for the member portal.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
        >
          <Plus size={20} />
          Add Exercise Video
        </button>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Exercises', count: stats.total, color: 'from-blue-500 to-indigo-500', shadow: 'shadow-blue-500/10' },
          { label: 'Chest Videos', count: stats.chest, color: 'from-red-500 to-rose-500', shadow: 'shadow-red-500/10' },
          { label: 'Back Videos', count: stats.back, color: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/10' },
          { label: 'Legs Videos', count: stats.legs, color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/10' },
          { label: 'Cardio & Yoga', count: stats.other, color: 'from-purple-500 to-fuchsia-500', shadow: 'shadow-purple-500/10' },
        ].map((stat, idx) => (
          <div key={idx} className={`p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm ${stat.shadow} flex flex-col justify-between`}>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-extrabold text-gray-900 dark:text-white">{stat.count}</span>
              <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-tr ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Control bar: Search and filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by exercise name or target muscle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white"
          />
        </div>

        {/* Category & Difficulty Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Category</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="All">All Categories</option>
              <option value="Chest">Chest</option>
              <option value="Back">Back</option>
              <option value="Legs">Legs</option>
              <option value="Cardio">Cardio</option>
              <option value="Yoga">Yoga</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Difficulty</span>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="All">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Exercises */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500 dark:text-gray-400 font-semibold">Loading exercise collection...</span>
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 py-16 px-6 text-center rounded-3xl border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-4 flex flex-col items-center">
          <div className="p-4 bg-orange-50 dark:bg-orange-950/40 text-orange-500 rounded-full">
            <Video size={40} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">No exercises found</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm">
            We couldn't find any exercises matching your filter combinations. Try refining your filters or upload a new video.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl shadow hover:bg-orange-600 transition-all"
          >
            Add First Exercise
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExercises.map((ex) => (
            <div
              key={ex._id}
              className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/60 shadow-sm overflow-hidden flex flex-col h-full group hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-300"
            >
              {/* Video Embed Frame / Image preview */}
              <div 
                onClick={() => {
                  setPlayingVideoUrl(ex.videoUrl);
                  setPlayingVideoTitle(ex.title);
                }}
                className="relative aspect-video w-full bg-gray-950 overflow-hidden cursor-pointer group/video"
              >
                {getYouTubeThumbnail(ex.videoUrl) ? (
                  <img 
                    src={getYouTubeThumbnail(ex.videoUrl)} 
                    alt={ex.title} 
                    className="w-full h-full object-cover group-hover/video:scale-105 transition-all duration-500" 
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-4">
                    <Video size={36} className="text-orange-500 mb-2" />
                    <span className="text-[10px] text-center font-semibold font-mono text-gray-500 dark:text-gray-400 break-all">{ex.videoUrl}</span>
                  </div>
                )}
                
                {/* Glossy Play Overlay */}
                <div className="absolute inset-0 bg-black/20 group-hover/video:bg-black/45 flex items-center justify-center transition-all duration-300">
                  <div className="w-12 h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30 scale-90 group-hover/video:scale-100 transition-all duration-300">
                    <Play size={20} fill="currentColor" className="ml-1" />
                  </div>
                </div>
              </div>

              {/* Card info */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight group-hover:text-orange-500 transition-colors">
                    {ex.title}
                  </h3>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Targets Muscle</span>
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                      {ex.muscleTargeting}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 rounded-lg text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                      {ex.category}
                    </span>
                    <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-lg shadow-sm text-white ${
                      ex.difficulty === 'Beginner' 
                        ? 'bg-emerald-500' 
                        : ex.difficulty === 'Intermediate' 
                        ? 'bg-amber-500' 
                        : 'bg-rose-500'
                    }`}>
                      {ex.difficulty}
                    </span>
                  </div>
                </div>

                {/* Controls and step indicators */}
                <div className="pt-4 border-t border-gray-50 dark:border-gray-700/60 flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-semibold">
                    {ex.instructions.length} step instructions
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(ex)}
                      className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/40 rounded-xl transition-all"
                      title="Edit Exercise"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(ex._id)}
                      className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-all"
                      title="Delete Exercise"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Exercise Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingExercise ? 'Edit Exercise Video' : 'Add New Exercise Video'}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Complete the exercise metadata, instruction steps, and video preview details.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Row 1: Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Exercise Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Incline Barbell Chest Press"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white"
                />
              </div>

              {/* Row 2: Category & Difficulty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white"
                  >
                    <option value="Chest">Chest</option>
                    <option value="Back">Back</option>
                    <option value="Legs">Legs</option>
                    <option value="Cardio">Cardio</option>
                    <option value="Yoga">Yoga</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Difficulty Level</label>
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Target muscles */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Muscle targeting</label>
                <input
                  type="text"
                  name="muscleTargeting"
                  value={formData.muscleTargeting}
                  onChange={handleInputChange}
                  placeholder="e.g. Upper Pectorals, Anterior Deltoids, Triceps"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white"
                />
              </div>

              {/* Row 4: Video URL */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Video URL (YouTube or MP4)</label>
                <input
                  type="text"
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleInputChange}
                  placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white font-mono text-xs"
                />
                <span className="text-[10px] text-gray-400 font-semibold">
                  Supports full YouTube URLs or share links. YouTube previews will display directly on the dashboard cards!
                </span>
              </div>

              {/* Row 5: Step by Step Instructions */}
              <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Step-by-Step Instructions</label>
                  <button
                    type="button"
                    onClick={handleAddInstructionStep}
                    className="flex items-center gap-1.5 text-xs text-orange-500 font-bold hover:text-orange-600 focus:outline-none"
                  >
                    <Plus size={14} />
                    Add Next Step
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.instructions.map((step, index) => (
                    <div key={index} className="flex items-center gap-2.5">
                      <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 font-bold rounded-lg text-xs">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={step}
                        onChange={(e) => handleInstructionChange(index, e.target.value)}
                        placeholder={`Describe step ${index + 1}...`}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveInstructionStep(index)}
                        disabled={formData.instructions.length === 1}
                        className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-40 disabled:hover:text-gray-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md transition-all"
                >
                  Save Exercise
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3.5 text-red-500">
              <span className="p-3 bg-red-50 dark:bg-red-950/40 rounded-2xl">
                <AlertTriangle size={24} />
              </span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Exercise Video?</h3>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Are you sure you want to permanently delete this exercise? Gym members will immediately lose access to this instructional video. This action is irreversible.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4.5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-all text-sm"
              >
                No, Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-md transition-all text-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Play Modal Popup - Exactly 50% of tab size on large screens */}
      {playingVideoUrl && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full lg:w-[50vw] aspect-video rounded-3xl overflow-hidden shadow-2xl border border-gray-700/50 bg-black">
            {/* Header / Title overlay */}
            <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/85 to-transparent p-4 flex items-center justify-between z-10">
              <span className="text-white font-extrabold truncate text-sm md:text-base mr-4">
                {playingVideoTitle}
              </span>
              <button
                onClick={() => setPlayingVideoUrl(null)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all focus:outline-none"
                aria-label="Close Video"
              >
                <X size={18} />
              </button>
            </div>

            {/* Video Player */}
            {playingVideoUrl.includes('youtube.com') || playingVideoUrl.includes('youtu.be') ? (
              <iframe
                title={playingVideoTitle}
                src={`${getEmbedUrl(playingVideoUrl)}?autoplay=1`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video 
                src={playingVideoUrl} 
                controls 
                autoPlay 
                className="w-full h-full object-contain"
              />
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
