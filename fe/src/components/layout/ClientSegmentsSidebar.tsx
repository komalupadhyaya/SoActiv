import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronRight, Search, Users, X } from 'lucide-react';
import { useClient } from '../../hooks/useClient';

interface ClientSegmentsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SegmentCategory {
  id: string;
  name: string;
  items?: { id: string; label: string; filterKey: string; filterValue: string }[];
}

export const ClientSegmentsSidebar: React.FC<ClientSegmentsSidebarProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clients } = useClient();

  const sidebarRef = React.useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    validity: !searchParams.get('gender') && !searchParams.get('fgendr') && !searchParams.get('purchaseType') && !searchParams.get('fptyp') && !searchParams.get('serviceCategory') && !searchParams.get('fscat') && !searchParams.get('behaviour') && !searchParams.get('fbhvtyp') && !searchParams.get('batch') && !searchParams.get('archived'),
    purchase: Boolean(searchParams.get('purchaseType') || searchParams.get('fptyp')),
    service: Boolean(searchParams.get('serviceCategory') || searchParams.get('fscat')),
    behaviour: Boolean(searchParams.get('behaviour') || searchParams.get('fbhvtyp')),
    gender: Boolean(searchParams.get('gender') || searchParams.get('fgendr')),
    age: Boolean(searchParams.get('age')),
    custom: Boolean(searchParams.get('batch')),
    archived: Boolean(searchParams.get('archived') || searchParams.get('Archive')),
  });

  // Sync expanded categories when URL query parameters change
  React.useEffect(() => {
    if (searchParams.get('gender') || searchParams.get('fgendr')) {
      setExpandedCategories((prev) => ({ ...prev, gender: true }));
    }
    if (searchParams.get('purchaseType') || searchParams.get('fptyp')) {
      setExpandedCategories((prev) => ({ ...prev, purchase: true }));
    }
    if (searchParams.get('serviceCategory') || searchParams.get('fscat')) {
      setExpandedCategories((prev) => ({ ...prev, service: true }));
    }
    if (searchParams.get('behaviour') || searchParams.get('fbhvtyp')) {
      setExpandedCategories((prev) => ({ ...prev, behaviour: true }));
    }
    if (searchParams.get('batch')) {
      setExpandedCategories((prev) => ({ ...prev, custom: true }));
    }
    if (searchParams.get('archived') || searchParams.get('Archive')) {
      setExpandedCategories((prev) => ({ ...prev, archived: true }));
    }
  }, [searchParams]);

  // Handle click outside to collapse sidebar
  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement;
      if (sidebarRef.current && sidebarRef.current.contains(target)) {
        return;
      }
      if (target.closest('[data-nav-item="Clients"]')) {
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

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const categories: SegmentCategory[] = [
    {
      id: 'validity',
      name: 'Validity Based',
      items: [
        { id: 'all-clients', label: 'All Clients', filterKey: 'status', filterValue: '' },
        { id: 'active-clients', label: 'Active Clients', filterKey: 'status', filterValue: 'active' },
        { id: 'inactive-clients', label: 'Inactive Clients', filterKey: 'status', filterValue: 'expired' },
      ],
    },
    {
      id: 'purchase',
      name: 'Purchase Type Based',
      items: [
        { id: 'memberships', label: 'Memberships', filterKey: 'purchaseType', filterValue: 'membership' },
        { id: 'single-sessions', label: 'Single Sessions/1 Day Pass', filterKey: 'purchaseType', filterValue: 'single-session' },
        { id: 'events', label: 'Events', filterKey: 'purchaseType', filterValue: 'events' },
        { id: 'turfs', label: 'Turfs', filterKey: 'purchaseType', filterValue: 'turfs' },
        { id: 'store', label: 'Store', filterKey: 'purchaseType', filterValue: 'store' },
      ],
    },
    {
      id: 'service',
      name: 'Service Category',
      items: [
        { id: 'general-membership', label: 'General Membership', filterKey: 'serviceCategory', filterValue: 'general-membership' },
        { id: 'personal-training', label: 'Personal Training', filterKey: 'serviceCategory', filterValue: 'personal-training' },
        { id: 'group-training', label: 'Group Training', filterKey: 'serviceCategory', filterValue: 'group-training' },
        { id: 'nutrition-counselling', label: 'Nutrition Counselling', filterKey: 'serviceCategory', filterValue: 'nutrition-counselling' },
        { id: 'teachers-training', label: 'Teachers Training', filterKey: 'serviceCategory', filterValue: 'teachers-training' },
        { id: 'workshops-events', label: 'Workshops/Events', filterKey: 'serviceCategory', filterValue: 'workshops-events' },
        { id: 'trial', label: 'Trial', filterKey: 'serviceCategory', filterValue: 'trial' },
        { id: 'pt-trial', label: 'PT Trial', filterKey: 'serviceCategory', filterValue: 'pt-trial' },
      ],
    },
    {
      id: 'behaviour',
      name: 'Behaviour Based',
      items: [
        { id: 'referrers', label: 'Referrers', filterKey: 'behaviour', filterValue: 'referrers' },
        { id: 'irregular-member', label: 'Irregular Member', filterKey: 'behaviour', filterValue: 'irregular' },
        { id: 'one-time-purchasers', label: 'One-Time Purchasers', filterKey: 'behaviour', filterValue: 'one-time' },
      ],
    },
    {
      id: 'gender',
      name: 'Gender Based',
      items: [
        { id: 'male', label: 'Male', filterKey: 'gender', filterValue: 'male' },
        { id: 'female', label: 'Female', filterKey: 'gender', filterValue: 'female' },
        { id: 'not-specified', label: 'Not Specified', filterKey: 'gender', filterValue: 'other' },
      ],
    },
    {
      id: 'age',
      name: 'Age Group',
    },
    {
      id: 'custom',
      name: 'Custom Groups',
      items: [
        { id: 'batches', label: 'Batches', filterKey: 'batch', filterValue: 'batches' },
      ],
    },
    {
      id: 'archived',
      name: 'Archived',
      items: [
        { id: 'archived-clients', label: 'Archived Clients', filterKey: 'archived', filterValue: 'true' },
      ],
    },
  ];

  // Filter categories and sub-items based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories
      .map((cat) => {
        const matchesCategory = cat.name.toLowerCase().includes(q);
        const matchingItems = cat.items?.filter((item) =>
          item.label.toLowerCase().includes(q)
        );
        if (matchesCategory || (matchingItems && matchingItems.length > 0)) {
          return {
            ...cat,
            items: matchesCategory ? cat.items : matchingItems,
          };
        }
        return null;
      })
      .filter(Boolean) as SegmentCategory[];
  }, [categories, searchQuery]);

  const handleSelectSegment = (filterKey: string, filterValue: string) => {
    const params = new URLSearchParams();
    if (filterValue) {
      params.set(filterKey, filterValue);
    }
    navigate(`/admin/clients?${params.toString()}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={sidebarRef}
      className="fixed inset-y-0 left-24 z-40 w-56 sm:w-60 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-xl flex flex-col font-sans transition-transform duration-300 ease-in-out"
    >
      {/* Header */}
      <div className="pt-4 pb-3 px-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 text-center w-full">
          Client Segments
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 rounded sm:hidden cursor-pointer"
          title="Close segments"
        >
          <X size={16} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-3.5 pt-3 pb-2">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Segments Accordion List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        {filteredCategories.map((category) => {
          const isExpanded = !!expandedCategories[category.id] || Boolean(searchQuery.trim());
          return (
            <div key={category.id} className="border-b border-gray-100 dark:border-gray-800/60 last:border-0">
              <button
                type="button"
                onClick={() => toggleCategory(category.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2.5 text-xs transition-colors cursor-pointer rounded-sm ${
                  isExpanded
                    ? 'text-[#ff5e28] font-medium'
                    : 'text-gray-700 dark:text-gray-300 font-normal hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span className="truncate">{category.name}</span>
                {category.items && category.items.length > 0 && (
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 shrink-0 ml-1 ${
                      isExpanded ? 'rotate-180 text-[#ff5e28]' : 'text-gray-400'
                    }`}
                  />
                )}
              </button>

              {/* Sub items */}
              {isExpanded && category.items && (
                <div className="pl-4 pr-2 py-1 space-y-1.5 mb-1.5">
                  {category.items.map((item) => {
                    const isGenderFilter = item.filterKey === 'gender';
                    const isBehaviourFilter = item.filterKey === 'behaviour';
                    const isServiceFilter = item.filterKey === 'serviceCategory';
                    const isPurchaseFilter = item.filterKey === 'purchaseType';
                    const hasGenderParam = searchParams.get('gender') || searchParams.get('fgendr');
                    const hasBehaviourParam = searchParams.get('behaviour') || searchParams.get('fbhvtyp');
                    const hasServiceParam = searchParams.get('serviceCategory') || searchParams.get('fscat');
                    const hasPurchaseParam = searchParams.get('purchaseType') || searchParams.get('fptyp');
                    const hasOtherSegment =
                      hasGenderParam ||
                      hasBehaviourParam ||
                      hasServiceParam ||
                      hasPurchaseParam ||
                      searchParams.get('batch') ||
                      searchParams.get('archived') ||
                      searchParams.get('Archive');

                    let isSelected = false;
                    if (isGenderFilter) {
                      const currentGender = (
                        searchParams.get('gender') ||
                        (searchParams.get('fgendr') === '0'
                          ? 'male'
                          : searchParams.get('fgendr') === '1'
                          ? 'female'
                          : searchParams.get('fgendr') === '2'
                          ? 'other'
                          : null)
                      )?.toLowerCase();
                      isSelected = currentGender === item.filterValue;
                    } else if (isBehaviourFilter) {
                      const currentBehaviour = (
                        searchParams.get('behaviour') ||
                        (searchParams.get('fbhvtyp') === '0'
                          ? 'referrers'
                          : searchParams.get('fbhvtyp') === '1'
                          ? 'irregular'
                          : searchParams.get('fbhvtyp') === '2'
                          ? 'one-time'
                          : null)
                      )?.toLowerCase();
                      isSelected = currentBehaviour === item.filterValue;
                    } else if (isServiceFilter) {
                      const currentService = (
                        searchParams.get('serviceCategory') ||
                        (searchParams.get('fscat') === '0'
                          ? 'general-membership'
                          : searchParams.get('fscat') === '1'
                          ? 'personal-training'
                          : searchParams.get('fscat') === '2'
                          ? 'group-training'
                          : searchParams.get('fscat') === '3'
                          ? 'nutrition-counselling'
                          : searchParams.get('fscat') === '4'
                          ? 'teachers-training'
                          : searchParams.get('fscat') === '5'
                          ? 'workshops-events'
                          : searchParams.get('fscat') === '6'
                          ? 'trial'
                          : searchParams.get('fscat') === '7'
                          ? 'pt-trial'
                          : null)
                      )?.toLowerCase();
                      isSelected = currentService === item.filterValue;
                    } else if (isPurchaseFilter) {
                      const currentPurchase = (
                        searchParams.get('purchaseType') ||
                        (searchParams.get('fptyp') === '0'
                          ? 'membership'
                          : searchParams.get('fptyp') === '1'
                          ? 'single-session'
                          : searchParams.get('fptyp') === '2'
                          ? 'events'
                          : searchParams.get('fptyp') === '3'
                          ? 'turfs'
                          : searchParams.get('fptyp') === '4'
                          ? 'store'
                          : null)
                      )?.toLowerCase();
                      isSelected = currentPurchase === item.filterValue;
                    } else if (item.filterKey === 'status') {
                      const currentStatus = (
                        searchParams.get('status') ||
                        (searchParams.get('actsts') === '0'
                          ? 'active'
                          : searchParams.get('actsts') === '1'
                          ? 'expired'
                          : null)
                      )?.toLowerCase();
                      if (item.filterValue !== '') {
                        isSelected = currentStatus === item.filterValue;
                      } else {
                        isSelected = searchParams.get('status') === 'all';
                      }
                    } else if (item.filterValue !== '') {
                      isSelected = searchParams.get(item.filterKey) === item.filterValue;
                    } else {
                      isSelected = false;
                    }

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectSegment(item.filterKey, item.filterValue)}
                        className={`w-full text-left py-1 text-xs transition-colors cursor-pointer block ${
                          isSelected
                            ? 'text-[#ff5e28] font-medium'
                            : 'text-gray-700 dark:text-gray-300 hover:text-[#ff5e28] dark:hover:text-[#ff5e28]'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
