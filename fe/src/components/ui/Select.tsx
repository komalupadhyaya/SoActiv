import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';

interface SelectProps {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  value,
  onChange,
  placeholder = "Select an option",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}

      <div className="relative">
        {/* Custom Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={clsx(
            'relative w-full px-3 py-2 text-left border rounded-lg shadow-sm',
            'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600',
            'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500',
            'flex items-center justify-between',
            error && 'border-red-500'
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
          <ul
            className={clsx(
              'absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg shadow-lg',
              'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600',
              'ring-1 ring-black ring-opacity-5'
            )}
          >
            {options.map((option) => (
              <li
                key={option.value}
                onClick={() => {
                  onChange?.(option.value);
                  setIsOpen(false);
                }}
                className={clsx(
                  'px-3 py-2 cursor-pointer text-sm',
                  value === option.value
                    ? 'bg-orange-100 dark:bg-orange-900 text-whitesmoke'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700',
                  'flex items-center justify-between'
                )}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};