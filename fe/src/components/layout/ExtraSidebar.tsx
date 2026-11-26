import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AlertCircle,
  Users,
  GraduationCap,
  Dumbbell,
  UserPlus,
  Bell,
  Sparkles,
  Megaphone,
  MessageSquare,
  Inbox,
  Calendar,
  Search,
  X,
  ChevronRight,
  Layers,
  LucideIcon,
  Fingerprint,
} from 'lucide-react';

interface ExtraSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExtraModuleItem {
  id: string;
  name: string;
  href: string;
  icon: LucideIcon;
  category: string;
  description?: string;
  badge?: string;
}

const EXTRA_MODULES: ExtraModuleItem[] = [
  {
    id: 'enquiries-expiring',
    name: 'Enquiries Expiring',
    href: '/admin/enquiries-expiring',
    icon: AlertCircle,
    category: 'Enquiries & Sales',
    description: 'Enquiries nearing expiration',
  },
  {
    id: 'staff-attendance',
    name: 'Staff Attendance',
    href: '/admin/staff-attendance',
    icon: Users,
    category: 'Staff Management',
    description: 'Daily staff check-ins and sheets',
  },
  {
    id: 'classes',
    name: 'Classes',
    href: '/admin/classes',
    icon: GraduationCap,
    category: 'Training & Fitness',
    description: 'Group fitness classes & schedules',
  },
  {
    id: 'pt-plans',
    name: 'PT Plans',
    href: '/admin/pt-plans',
    icon: Dumbbell,
    category: 'Training & Fitness',
    description: 'Personal training packages & rates',
  },
  {
    id: 'pt-assignments',
    name: 'PT Assignments',
    href: '/admin/pt-assignments',
    icon: UserPlus,
    category: 'Training & Fitness',
    description: 'Assign trainers to active clients',
  },
  {
    id: 'pt-expiring',
    name: 'PT Expiring',
    href: '/admin/pt-expiring',
    icon: AlertCircle,
    category: 'Training & Fitness',
    description: 'Personal training packages expiring',
  },
  {
    id: 'follow-ups',
    name: 'Follow-ups',
    href: '/admin/follow-ups',
    icon: Bell,
    category: 'Communications',
    description: 'Enquiry & member follow-up schedules',
  },
  {
    id: 'exercise-library',
    name: 'Exercise Library',
    href: '/admin/exercises',
    icon: Dumbbell,
    category: 'Training & Fitness',
    description: 'Workout video tutorials & library',
  },
  {
    id: 'cleaning-log',
    name: 'Cleaning Log',
    href: '/admin/cleaning',
    icon: Sparkles,
    category: 'Operations',
    description: 'Hygiene & maintenance checklists',
  },
  {
    id: 'biometric-management',
    name: 'Biometric Devices',
    href: '/admin/biometric',
    icon: Fingerprint,
    category: 'Operations',
    description: 'Hardware devices, user mappings & logs',
  },
  {
    id: 'announcements',
    name: 'Member Announcements',
    href: '/admin/announcements',
    icon: Megaphone,
    category: 'Communications',
    description: 'Broadcast notices to all members',
  },
  {
    id: 'contact-support',
    name: 'Contact Support',
    href: '/admin/contact-support',
    icon: MessageSquare,
    category: 'Help & Support',
    description: 'Contact platform support desk',
  },
  {
    id: 'support-inbox',
    name: 'Support Inbox',
    href: '/admin/member-support',
    icon: Inbox,
    category: 'Help & Support',
    description: 'Member inquiries & tickets',
  },
  {
    id: 'calendar',
    name: 'Calendar',
    href: '/admin/calendar',
    icon: Calendar,
    category: 'Operations',
    description: 'Gym calendar & schedule overview',
  },
];

export const ExtraSidebar: React.FC<ExtraSidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle click outside to close sidebar
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement;
      if (sidebarRef.current && sidebarRef.current.contains(target)) {
        return;
      }
      if (target.closest('[data-nav-item="Extra"]')) {
        return;
      }
      onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Filter modules based on search
  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return EXTRA_MODULES;
    const q = searchQuery.toLowerCase();
    return EXTRA_MODULES.filter(
      (mod) =>
        mod.name.toLowerCase().includes(q) ||
        mod.category.toLowerCase().includes(q) ||
        mod.description?.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Group filtered modules by category
  const groupedModules = useMemo(() => {
    const groups: Record<string, ExtraModuleItem[]> = {};
    filteredModules.forEach((mod) => {
      if (!groups[mod.category]) {
        groups[mod.category] = [];
      }
      groups[mod.category].push(mod);
    });
    return groups;
  }, [filteredModules]);

  const handleItemClick = (href: string) => {
    navigate(href);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs xl:hidden"
        onClick={onClose}
      />

      {/* Flyout panel */}
      <div
        ref={sidebarRef}
        className="fixed inset-y-0 left-24 z-50 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-2xl transition-transform duration-200 ease-out font-sans"
        style={{ animation: 'slideInFromLeft 0.15s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
              <Layers size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Extra Modules</h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Additional tools & management</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
            aria-label="Close Extra Sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-gray-100 dark:border-gray-800">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search extra modules..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Modules List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {Object.keys(groupedModules).length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-500 dark:text-gray-400">
              No modules found matching "{searchQuery}"
            </div>
          ) : (
            Object.entries(groupedModules).map(([category, items]) => (
              <div key={category} className="space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {category}
                </div>
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    location.pathname === item.href ||
                    (item.href !== '/admin/dashboard' && location.pathname.startsWith(item.href));

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleItemClick(item.href)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-all duration-150 group cursor-pointer ${
                        isActive
                          ? 'bg-orange-50 dark:bg-orange-950/60 text-red-600 dark:text-red-400 font-semibold shadow-xs'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div
                          className={`p-1.5 rounded-md transition-colors ${
                            isActive
                              ? 'bg-red-100/70 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:text-orange-500 group-hover:bg-orange-50 dark:group-hover:bg-orange-950/40'
                          }`}
                        >
                          <Icon size={15} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs truncate leading-snug">{item.name}</p>
                          {item.description && (
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate leading-tight font-normal">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronRight
                        size={14}
                        className={`transition-transform flex-shrink-0 ml-1 ${
                          isActive
                            ? 'text-red-500 translate-x-0.5'
                            : 'text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 group-hover:translate-x-0.5'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-800/40 text-center">
          <p className="text-[10px] text-gray-400 dark:text-gray-500">
            {EXTRA_MODULES.length} Extra Modules available
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideInFromLeft {
          from { opacity: 0; transform: translateX(-10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
};
