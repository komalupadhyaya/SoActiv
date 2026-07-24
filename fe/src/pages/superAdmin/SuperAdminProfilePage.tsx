import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Camera, Save, Loader2, Palette, Eye, EyeOff, X, Maximize2 } from 'lucide-react';
import { ColorPicker } from '../../components/ui/ColorPicker';
import { Avatar } from '../../components/ui/Avatar';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '').replace(/\/api\/v1$/, '');

interface ProfileFormOutputs {
    fullname: string;
    phone: string;
    email: string;
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
    avatar?: FileList;
}

/**
 * SuperAdmin Profile Page
 * Dedicated profile editor for SuperAdmin users only
 * Isolated from Admin (gym owner) profile to prevent cross-contamination
 */
export const SuperAdminProfilePage = () => {
    const { user, refreshUser } = useAuth();
    const { addToast } = useToast();
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [avatarSettings, setAvatarSettings] = useState({
        textColor: '#FFFFFF',
        backgroundColor: '#3B82F6',
        backgroundType: 'solid' as 'solid' | 'gradient',
        gradientStart: '#3B82F6',
        gradientEnd: '#8B5CF6'
    });

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors, isSubmitting }
    } = useForm<ProfileFormOutputs>();

    useEffect(() => {
        if (!user) return;

        reset({
            fullname: user.name || '',
            phone: user.phone || '',
            email: user.email || ''
        });

        // Only override preview if user hasn't selected a new local file waiting to be saved
        if (!selectedFile) {
            if (user.avatar) {
                const avatarUrl = user.avatar.startsWith('/uploads')
                    ? `${API_URL}${user.avatar}`
                    : user.avatar;
                setAvatarPreview(avatarUrl);
            } else {
                setAvatarPreview(null);
            }
        }

        if (user.avatarSettings) {
            setAvatarSettings({
                textColor: user.avatarSettings.textColor || '#FFFFFF',
                backgroundColor: user.avatarSettings.backgroundColor || '#3B82F6',
                backgroundType: user.avatarSettings.backgroundType || 'solid',
                gradientStart: user.avatarSettings.gradientStart || '#3B82F6',
                gradientEnd: user.avatarSettings.gradientEnd || '#8B5CF6'
            });
        }
    }, [user, reset, selectedFile]);

    const newPassword = watch('newPassword');

    const onSubmit = async (data: ProfileFormOutputs) => {
        try {
            const formData = new FormData();
            formData.append('fullname', data.fullname);
            formData.append('phone', data.phone || '');
            formData.append('avatarSettings', JSON.stringify(avatarSettings));

            if (selectedFile) {
                formData.append('avatar', selectedFile);
            }

            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            await axios.patch(`${API_URL}/api/v1/super-admin/profile`, formData, {
                withCredentials: true,
                headers
            });

            if (data.currentPassword && data.newPassword) {
                await axios.post(
                    `${API_URL}/api/v1/super-admin/change-password`,
                    {
                        oldPassword: data.currentPassword,
                        newPassword: data.newPassword
                    },
                    {
                        withCredentials: true,
                        headers
                    }
                );
                addToast('Password changed successfully', 'success');
            }

            addToast('Profile updated successfully', 'success');
            setSelectedFile(null); // Clear local selected file after successful save

            if (refreshUser) {
                await refreshUser();

                const token = localStorage.getItem('accessToken');
                const userResponse = await axios.get(
                    `${API_URL}/api/v1/super-admin/me`,
                    {
                        withCredentials: true,
                        headers: token ? { Authorization: `Bearer ${token}` } : {}
                    }
                );

                if (userResponse.data?.data?.avatar) {
                    const avatarUrl = userResponse.data.data.avatar.startsWith('/uploads')
                        ? `${API_URL}${userResponse.data.data.avatar}`
                        : userResponse.data.data.avatar;
                    setAvatarPreview(avatarUrl);
                }
            }
        } catch (error: any) {
            console.error('Update failed', error);
            addToast(
                error.response?.data?.message || 'Failed to update profile',
                'error'
            );
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // VALIDATION: Check size (2MB)
            if (file.size > 2 * 1024 * 1024) {
                addToast('Image size must be less than 2MB', 'error');
                e.target.value = '';
                return;
            }

            // VALIDATION: Check type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            if (!allowedTypes.includes(file.type)) {
                addToast('Only JPG, PNG, WEBP, or GIF images are allowed', 'error');
                e.target.value = '';
                return;
            }

            setSelectedFile(file);
            setAvatarPreview(URL.createObjectURL(file));
            addToast('New photo selected! Click "Save Changes" to save it permanently.', 'info');
        }
    };

    if (!user)
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin" />
            </div>
        );

    return (
        <div className="w-full max-w-7xl mx-auto py-3 px-2 sm:px-4 min-w-0 overflow-x-hidden">
            <div className="flex items-center justify-between mb-4 sm:mb-5">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                        My Profile
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Manage your account settings
                    </p>
                </div>
            </div>

            {/* MAIN GRID: left (profile+account), middle (edit details), right (avatar appearance) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-start min-w-0">
                {/* Left column */}
                <div className="lg:col-span-3 space-y-4 min-w-0">
                    <Card>
                        <CardHeader className="py-3 px-4">
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                Profile Picture
                            </h2>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center p-4 min-w-0">
                            <div className="relative group">
                                <div
                                    onClick={() => setIsImageModalOpen(true)}
                                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:opacity-90 hover:scale-105 transition-all shadow-md group relative flex items-center justify-center"
                                    title="Click to view full picture"
                                >
                                    {avatarPreview ? (
                                        <img
                                            src={avatarPreview}
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-2xl sm:text-3xl font-bold text-gray-400">
                                                {user.name?.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                    {/* Hover overlay indicator */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                        <Maximize2 size={20} />
                                    </div>
                                </div>
                                <label
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white cursor-pointer hover:bg-blue-700 transition-colors shadow-lg"
                                    title="Upload photo"
                                >
                                    <Camera size={14} />
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                    />
                                </label>
                            </div>
                            <p className="text-xs text-gray-500 mt-3 text-center">
                                Click picture to view • Click camera to upload
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2.5">
                                Account Info
                            </h3>
                            <div className="space-y-2.5 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                <div className="min-w-0">
                                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">
                                        Email
                                    </span>
                                    <p className="truncate font-medium text-gray-900 dark:text-gray-200" title={user.email}>
                                        {user.email}
                                    </p>
                                </div>
                                <div className="capitalize min-w-0">
                                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">
                                        Role
                                    </span>
                                    <p className="truncate font-medium text-gray-900 dark:text-gray-200">
                                        {user.role === 'superadmin'
                                            ? 'Super Admin'
                                            : user.role === 'admin'
                                                ? 'Gym Owner'
                                                : user.role === 'staff'
                                                    ? 'Staff Member'
                                                    : user.role}
                                    </p>
                                </div>
                                <div className="capitalize min-w-0">
                                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">
                                        Joined
                                    </span>
                                    <p className="font-medium text-gray-900 dark:text-gray-200">
                                        {new Date().toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Middle column: Edit Details */}
                <div className="lg:col-span-5 min-w-0">
                    <Card>
                        <CardHeader className="py-3 px-4">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                Edit Details
                            </h2>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-5 min-w-0">
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div className="space-y-3 min-w-0">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                                        <div className="min-w-0">
                                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                Full Name
                                            </label>
                                            <Input
                                                {...register('fullname', {
                                                    required: 'Full name is required'
                                                })}
                                                placeholder="Your Name"
                                                className="text-sm"
                                            />
                                            {errors.fullname && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    {errors.fullname.message}
                                                </p>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                Phone Number
                                            </label>
                                            <Input
                                                {...register('phone', {
                                                    required: 'Phone number is required',
                                                    pattern: {
                                                        value: /^[0-9]{10}$/,
                                                        message: 'Phone number must be exactly 10 digits'
                                                    }
                                                })}
                                                maxLength={10}
                                                placeholder="10-digit phone number"
                                                className="text-sm"
                                                onInput={(e: React.FormEvent<HTMLInputElement>) => {
                                                    e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '').slice(0, 10);
                                                }}
                                            />
                                            {errors.phone && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    {errors.phone.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700 min-w-0">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                        Change Password
                                    </h3>
                                    <p className="text-xs text-gray-500 mb-2">
                                        Leave blank if you don't want to change it.
                                    </p>

                                    <div className="space-y-3 min-w-0">
                                        <div className="min-w-0">
                                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                Current Password
                                            </label>
                                            <div className="relative min-w-0">
                                                <Input
                                                    type={showCurrentPassword ? 'text' : 'password'}
                                                    {...register('currentPassword')}
                                                    placeholder="Required to set new password"
                                                    className="pr-9 text-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                                >
                                                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                                            <div className="min-w-0">
                                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                    New Password
                                                </label>
                                                <div className="relative min-w-0">
                                                    <Input
                                                        type={showNewPassword ? 'text' : 'password'}
                                                        {...register('newPassword', {
                                                            minLength: {
                                                                value: 6,
                                                                message: 'Must be at least 6 characters'
                                                            }
                                                        })}
                                                        placeholder="New password"
                                                        className="pr-9 text-sm"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                                    >
                                                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                </div>
                                                {errors.newPassword && (
                                                    <p className="text-xs text-red-500 mt-1">
                                                        {errors.newPassword.message}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                    Confirm New Password
                                                </label>
                                                <div className="relative min-w-0">
                                                    <Input
                                                        type={showConfirmPassword ? 'text' : 'password'}
                                                        {...register('confirmPassword', {
                                                            validate: (val: string | undefined) => {
                                                                if (!newPassword) return true;
                                                                return (
                                                                    val === newPassword || 'Passwords do not match'
                                                                );
                                                            }
                                                        })}
                                                        placeholder="Confirm password"
                                                        className="pr-9 text-sm"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                                    >
                                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                </div>
                                                {errors.confirmPassword && (
                                                    <p className="text-xs text-red-500 mt-1">
                                                        {errors.confirmPassword.message}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700 min-w-0">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={isSubmitting}
                                        className="gap-2 text-sm px-4 py-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="animate-spin w-4 h-4" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={15} />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Right column: Avatar Appearance */}
                <div className="lg:col-span-4 min-w-0">
                    <Card>
                        <CardHeader className="py-3 px-4">
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Palette size={18} />
                                Avatar Appearance
                            </h2>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-5 space-y-3.5 min-w-0">
                            <div className="flex justify-center mb-3">
                                <Avatar
                                    name={user.name}
                                    userId={user.id}
                                    size="lg"
                                    forceInitials={true}
                                    customColors={avatarSettings}
                                />
                            </div>

                            <div className="min-w-0">
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Background Style
                                </label>
                                <div className="flex gap-2 min-w-0">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setAvatarSettings({
                                                ...avatarSettings,
                                                backgroundType: 'solid'
                                            })
                                        }
                                        className={`flex-1 min-w-0 px-3 py-1.5 text-xs font-medium rounded-lg border-2 transition-all ${avatarSettings.backgroundType === 'solid'
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 text-gray-700 dark:text-gray-300'
                                            }`}
                                    >
                                        Solid Color
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setAvatarSettings({
                                                ...avatarSettings,
                                                backgroundType: 'gradient'
                                            })
                                        }
                                        className={`flex-1 min-w-0 px-3 py-1.5 text-xs font-medium rounded-lg border-2 transition-all ${avatarSettings.backgroundType === 'gradient'
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 text-gray-700 dark:text-gray-300'
                                            }`}
                                    >
                                        Gradient
                                    </button>
                                </div>
                            </div>

                            <ColorPicker
                                label="Text Color"
                                value={avatarSettings.textColor}
                                onChange={(color) =>
                                    setAvatarSettings({ ...avatarSettings, textColor: color })
                                }
                            />

                            {avatarSettings.backgroundType === 'solid' && (
                                <ColorPicker
                                    label="Background Color"
                                    value={avatarSettings.backgroundColor}
                                    onChange={(color) =>
                                        setAvatarSettings({
                                            ...avatarSettings,
                                            backgroundColor: color
                                        })
                                    }
                                />
                            )}

                            {avatarSettings.backgroundType === 'gradient' && (
                                <div className="space-y-3 min-w-0">
                                    <ColorPicker
                                        label="Gradient Start"
                                        value={avatarSettings.gradientStart}
                                        onChange={(color) =>
                                            setAvatarSettings({
                                                ...avatarSettings,
                                                gradientStart: color
                                            })
                                        }
                                    />
                                    <ColorPicker
                                        label="Gradient End"
                                        value={avatarSettings.gradientEnd}
                                        onChange={(color) =>
                                            setAvatarSettings({
                                                ...avatarSettings,
                                                gradientEnd: color
                                            })
                                        }
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Image Popup Modal */}
            {isImageModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => setIsImageModalOpen(false)}
                >
                    <div
                        className="relative bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setIsImageModalOpen(false)}
                            className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300 transition-colors"
                            aria-label="Close"
                        >
                            <X size={18} />
                        </button>

                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 self-start">
                            Profile Picture
                        </h3>

                        <div className="w-full flex justify-center py-2">
                            {avatarPreview ? (
                                <img
                                    src={avatarPreview}
                                    alt="Profile Picture"
                                    className="max-h-[65vh] max-w-full rounded-xl object-contain shadow-lg border border-gray-200 dark:border-gray-700"
                                />
                            ) : (
                                <div className="flex flex-col items-center py-6 gap-3">
                                    <Avatar
                                        name={user.name}
                                        userId={user.id}
                                        size="xl"
                                        forceInitials={true}
                                        customColors={avatarSettings}
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        No custom photo uploaded yet
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 w-full pt-3 border-t border-gray-100 dark:border-gray-700">
                            <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm">
                                <Camera size={14} />
                                <span>Upload New Photo</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        handleAvatarChange(e);
                                        setIsImageModalOpen(false);
                                    }}
                                />
                            </label>
                            <Button
                                variant="secondary"
                                onClick={() => setIsImageModalOpen(false)}
                                className="text-xs px-4 py-2"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
