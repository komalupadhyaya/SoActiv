import { useState, useMemo } from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
    src?: string | null;
    alt?: string;
    name?: string;
    userId?: string; // Preferred for stable color generation
    className?: string; // Allow overriding size/classes
    size?: 'sm' | 'md' | 'lg' | 'xl';
    forceInitials?: boolean; // Force showing initials even if src exists
    customColors?: {
        textColor?: string;
        backgroundColor?: string;
        backgroundType?: 'solid' | 'gradient';
        gradientStart?: string;
        gradientEnd?: string;
    };
}

const COLORS = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500',
    'bg-yellow-500', 'bg-lime-500', 'bg-green-500',
    'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500',
    'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500',
    'bg-pink-500', 'bg-rose-500'
];

const SIZE_CLASSES = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
    xl: 'w-12 h-12 text-lg'
};

/**
 * Generates a deterministic color class from a string key.
 */
function getAvatarColor(key: string): string {
    if (!key) return COLORS[0];
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % COLORS.length;
    return COLORS[index];
}

/**
 * Generates initials from a name string (max 2 characters).
 */
function getInitials(name?: string): string {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
    src,
    alt,
    name,
    userId,
    className = '',
    size = 'md',
    forceInitials = false,
    customColors
}: AvatarProps) {
    const [imgError, setImgError] = useState(false);

    // Determine color key: prefers userId, falls back to name or placeholder
    const colorKey = userId || name || 'default';
    const backgroundColor = useMemo(() => getAvatarColor(colorKey), [colorKey]);

    // Determine initials
    const initials = useMemo(() => getInitials(name), [name]);

    const sizeClass = SIZE_CLASSES[size];
    const baseClasses = `rounded-full flex items-center justify-center font-medium overflow-hidden shadow-sm flex-shrink-0 ${sizeClass} ${className}`;

    // Determine if we should show image or initials
    const showImage = !forceInitials && src && !imgError;

    // Build custom styles
    const customStyle: React.CSSProperties = {};
    if (customColors) {
        if (customColors.textColor) {
            customStyle.color = customColors.textColor;
        }
        if (customColors.backgroundType === 'gradient' && customColors.gradientStart && customColors.gradientEnd) {
            customStyle.background = `linear-gradient(135deg, ${customColors.gradientStart}, ${customColors.gradientEnd})`;
        } else if (customColors.backgroundColor) {
            customStyle.background = customColors.backgroundColor;
        }
    }

    if (showImage) {
        return (
            <div className={baseClasses}>
                <img
                    src={src?.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${src}` : src}
                    alt={alt || name || 'Avatar'}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                />
            </div>
        );
    }

    // Show initials or icon
    const defaultBgColor = backgroundColor;
    const finalStyle = customColors ? customStyle : { background: defaultBgColor };

    return (
        <div
            className={`${baseClasses} ${!customColors ? backgroundColor : ''}`}
            style={customColors ? finalStyle : undefined}
            aria-label={alt || name || 'User Avatar'}
            title={name}
        >
            {initials ? (
                <span>{initials}</span>
            ) : (
                <User className="w-1/2 h-1/2" />
            )}
        </div>
    );
}
