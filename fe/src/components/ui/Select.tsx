import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';

interface SelectProps {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  searchable = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  // Automatically searchable if searchable prop is true or we have 6 or more options
  const isSearchable = searchable || options.length >= 6;

  const filteredOptions = isSearchable
    ? options.filter((o) => o.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  const handleOpenToggle = () => {
    if (!disabled) {
      const nextOpen = !isOpen;
      setIsOpen(nextOpen);
      if (!nextOpen) {
        setSearchQuery('');
      }
    }
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (isOpen && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}

      <div className="relative">
        {/* Custom Trigger */}
        <button
          type="button"
          onClick={handleOpenToggle}
          disabled={disabled}
          className={clsx(
            'relative w-full px-3 py-2 text-left border rounded-lg shadow-sm',
            'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600',
            'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500',
            'flex items-center justify-between',
            error && 'border-red-500',
            disabled && 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700'
          )}
        >
          <span className="block truncate">
            {selectedOption?.label || placeholder}
          </span>
          {isOpen ? (
            <ChevronUp size={16} className="text-gray-400" />
          ) : (
            <ChevronDown size={16} className="text-gray-400" />
          )}
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div
            className={clsx(
              'absolute z-50 mt-1 w-full max-h-60 overflow-hidden flex flex-col rounded-lg shadow-lg',
              'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600',
              'ring-1 ring-black ring-opacity-5'
            )}
          >
            {isSearchable && (
              <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                  autoFocus
                />
              </div>
            )}
            <ul className="overflow-y-auto max-h-48 divide-y divide-gray-100 dark:divide-gray-700">
              {filteredOptions.length === 0 ? (
                <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                  No results found
                </li>
              ) : (
                filteredOptions.map((option) => (
                  <li
                    key={option.value}
                    onClick={() => {
                      onChange?.(option.value);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={clsx(
                      'px-3 py-2 cursor-pointer text-sm transition-colors',
                      value === option.value
                        ? 'bg-orange-100 dark:bg-orange-900 text-orange-900 dark:text-orange-100'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100',
                      'flex items-center justify-between'
                    )}
                  >
                    {option.label}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};