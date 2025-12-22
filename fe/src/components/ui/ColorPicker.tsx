import { useState } from 'react';

interface ColorPickerProps {
    label: string;
    value: string;
    onChange: (color: string) => void;
    presetColors?: string[];
}

const DEFAULT_PRESETS = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899',
    '#1F2937', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#F3F4F6'
];

export function ColorPicker({ label, value, onChange, presetColors = DEFAULT_PRESETS }: ColorPickerProps) {
    const [showPicker, setShowPicker] = useState(false);

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}
            </label>

            <div className="flex items-center gap-3">
                {/* Color Preview Button */}
                <button
                    type="button"
                    onClick={() => setShowPicker(!showPicker)}
                    className="w-12 h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-sm hover:scale-105 transition-transform"
                    style={{ background: value }}
                    aria-label={`Select ${label}`}
                />

                {/* Hex Input */}
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="#000000"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                {/* Native Color Picker */}
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-12 h-12 rounded-lg cursor-pointer"
                />
            </div>

            {/* Preset Colors */}
            {showPicker && (
                <div className="grid grid-cols-6 gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 max-w-full overflow-hidden">
                    {presetColors.map((color) => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => {
                                onChange(color);
                                setShowPicker(false);
                            }}
                            className="w-10 h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform"
                            style={{ background: color }}
                            aria-label={`Select color ${color}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
