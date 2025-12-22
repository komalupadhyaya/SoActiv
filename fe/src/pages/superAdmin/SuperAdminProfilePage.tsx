import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Camera, Save, Loader2, Palette } from 'lucide-react';
import { ColorPicker } from '../../components/ui/ColorPicker';
import { Avatar } from '../../components/ui/Avatar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

        if (user.avatar) {
            const avatarUrl = user.avatar.startsWith('/uploads')
                ? `${API_URL}${user.avatar}`
                : user.avatar;
            setAvatarPreview(avatarUrl);
        } else {
            setAvatarPreview(null);
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
    }, [user, reset]);

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
        }
    };

    if (!user)
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin" />
            </div>
        );

    return (
        <div className="max-w-7xl  py-4 px-2">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        My Profile
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage your account settings
                    </p>
                </div>
            </div>

            {/* MAIN GRID: left (profile+account), middle (edit details), right (avatar appearance) */}
            <div className="grid grid-cols-1 lg:grid-cols-[20%_50%_30%] gap-6 items-start">
                {/* Left column */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Profile Picture
                            </h2>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center p-6">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                    {avatarPreview ? (
                                        <img
                                            src={avatarPreview}
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-3xl font-bold text-gray-400">
                                                {user.name?.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                                    <Camera size={16} />
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                    />
                                </label>
                            </div>
                            <p className="text-xs text-gray-500 mt-4 text-center">
                                Click camera icon to upload new photo
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                                Account Info
                            </h3>
                            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                                <div>
                                    <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                                        Email
                                    </span>
                                    {user.email}
                                </div>
                                <div className="capitalize">
                                    <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                                        Role
                                    </span>
                                    {user.role === 'superadmin'
                                        ? 'Super Admin'
                                        : user.role === 'admin'
                                            ? 'Gym Owner'
                                            : user.role === 'staff'
                                                ? 'Staff Member'
                                                : user.role}
                                </div>
                                <div className="capitalize">
                                    <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                                        Joined
                                    </span>
                                    {new Date().toLocaleDateString()}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Middle column: Edit Details */}
                <div>
                    <Card>
                        <CardHeader>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Edit Details
                            </h2>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Full Name
                                            </label>
                                            <Input
                                                {...register('fullname', {
                                                    required: 'Full name is required'
                                                })}
                                                placeholder="Your Name"
                                            />
                                            {errors.fullname && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    {errors.fullname.message}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Phone Number
                                            </label>
                                            <Input
                                                {...register('phone')}
                                                placeholder="+1 234 567 890"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-gray-700">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        Change Password
                                    </h3>
                                    <p className="text-xs text-gray-500 mb-4">
                                        Leave blank if you don't want to change it.
                                    </p>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Current Password
                                            </label>
                                            <Input
                                                type="password"
                                                {...register('currentPassword')}
                                                placeholder="Required to set new password"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    New Password
                                                </label>
                                                <Input
                                                    type="password"
                                                    {...register('newPassword', {
                                                        minLength: {
                                                            value: 6,
                                                            message: 'Must be at least 6 characters'
                                                        }
                                                    })}
                                                    placeholder="Min 6 chars"
                                                />
                                                {errors.newPassword && (
                                                    <p className="text-xs text-red-500 mt-1">
                                                        {errors.newPassword.message}
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Confirm New Password
                                                </label>
                                                <Input
                                                    type="password"
                                                    {...register('confirmPassword', {
                                                        validate: (val: string | undefined) => {
                                                            if (!newPassword) return true;
                                                            return (
                                                                val === newPassword || 'Passwords do not match'
                                                            );
                                                        }
                                                    })}
                                                    placeholder="Confirm new password"
                                                />
                                                {errors.confirmPassword && (
                                                    <p className="text-xs text-red-500 mt-1">
                                                        {errors.confirmPassword.message}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-6 border-t border-gray-100 dark:border-gray-700">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={isSubmitting}
                                        className="gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="animate-spin w-4 h-4" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={16} />
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
                <div>
                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Palette size={18} />
                                Avatar Appearance
                            </h2>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex justify-center mb-4">
                                <Avatar
                                    name={user.name}
                                    userId={user.id}
                                    size="xl"
                                    forceInitials={true}
                                    customColors={avatarSettings}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Background Style
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setAvatarSettings({
                                                ...avatarSettings,
                                                backgroundType: 'solid'
                                            })
                                        }
                                        className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${avatarSettings.backgroundType === 'solid'
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
                                        className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${avatarSettings.backgroundType === 'gradient'
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
                                <div className="space-y-4">
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
        </div>
    );
};
