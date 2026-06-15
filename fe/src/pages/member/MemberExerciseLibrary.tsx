import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, 
  Video, 
  Dumbbell, 
  Compass, 
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Bookmark,
  ExternalLink,
  Flame,
  Zap,
  Play,
  X
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

export const MemberExerciseLibrary: React.FC = () => {
  const { addToast } = useToast();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');
  const [expandedInstructions, setExpandedInstructions] = useState<Record<string, boolean>>({});

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
      addToast(error.response?.data?.message || 'Could not load exercise library. Please check connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleInstructions = (id: string) => {
    setExpandedInstructions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Helper to extract YouTube video ID or format URL safely
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    try {
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

  // Filter logic
  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = 
      ex.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      ex.muscleTargeting.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = activeCategory === 'All' || ex.category === activeCategory;
    const matchesDifficulty = difficultyFilter === 'All' || ex.difficulty === difficultyFilter;

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const categories = ['All', 'Chest', 'Back', 'Legs', 'Cardio', 'Yoga'];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Premium Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white p-8 md:p-12 shadow-xl shadow-orange-500/10">
        {/* Background visual shapes */}
        <div className="absolute right-0 bottom-0 opacity-15 transform translate-y-1/4 translate-x-1/4 pointer-events-none">
          <Dumbbell size={350} className="text-white" />
        </div>

        <div className="relative z-10 max-w-xl space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-extrabold uppercase tracking-widest">
            <Compass size={14} className="animate-spin-slow" />
            Curated For You
          </span>
          
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Interactive Exercise Library
          </h1>
          
          <p className="text-orange-50/90 text-sm md:text-base leading-relaxed font-semibold">
            Perfect your form with premium HD tutorials, targeted muscle analytics, step-by-step guides, and curated plans designed directly by your personal trainer.
          </p>
        </div>
      </div>

      {/* Control bar: Search and Filter Tabs */}
      <div className="space-y-4">
        {/* Filters and search block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-sm font-bold tracking-tight whitespace-nowrap transition-all duration-300 ${
                  activeCategory === cat
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60 border border-gray-100 dark:border-gray-700/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Difficulty Dropdown */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Level:</span>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="All">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60 overflow-hidden">
          <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search exercises by title or muscle targeted..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-transparent border-0 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500 dark:text-gray-400 font-semibold">Opening library collection...</span>
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 py-20 px-6 text-center rounded-3xl border border-gray-100 dark:border-gray-700/60 shadow-sm flex flex-col items-center space-y-4">
          <div className="p-4 bg-orange-50 dark:bg-orange-950/40 text-orange-500 rounded-full">
            <Compass size={40} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">No exercise videos available</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm">
            We couldn't find any exercise tutorials matching your filter combinations. Ask your trainer to add new content!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {filteredExercises.map((ex) => {
            const isExpanded = !!expandedInstructions[ex._id];
            
            return (
              <div
                key={ex._id}
                className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/60 shadow-sm overflow-hidden flex flex-col h-auto group hover:shadow-md transition-all duration-300"
              >
                {/* Video container */}
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

                {/* Info and layout */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight group-hover:text-orange-500 transition-colors">
                      {ex.title}
                    </h3>
                    
                    {/* Targeted Muscle group list */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                        <Flame size={12} className="text-orange-500" />
                        Targeted Muscles
                      </span>
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

                  {/* Expandable Instructions Drawer */}
                  <div className="pt-4 border-t border-gray-50 dark:border-gray-700/60 space-y-3">
                    <button
                      onClick={() => toggleInstructions(ex._id)}
                      className="w-full flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors focus:outline-none"
                    >
                      <span className="flex items-center gap-1.5">
                        <Zap size={13} className="text-amber-500" />
                        View Execution Steps ({ex.instructions.length})
                      </span>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {isExpanded && ex.instructions.length > 0 && (
                      <div className="space-y-2 pt-2 animate-in slide-in-from-top-2 duration-200">
                        {ex.instructions.map((step, idx) => (
                          <div key={idx} className="flex gap-2 text-xs text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-900/40 p-2 rounded-xl">
                            <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 font-extrabold rounded-lg text-[10px]">
                              {idx + 1}
                            </span>
                            <p className="flex-1 font-semibold">{step}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
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
