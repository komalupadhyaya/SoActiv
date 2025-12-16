
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { User, Camera, Save, ArrowLeft } from 'lucide-react';
import { useStaff } from '../../hooks/useStaff';

interface ProfileFormOutputs {
    fullName: string;
    phone: string;
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
    avatar?: FileList;
}

export const ProfileEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const { updateProfile } = useStaff();
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    // Default values will be reset when user data loads
    const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<ProfileFormOutputs>();

    // Security Check & Initial Data Load
    useEffect(() => {
        // 1. If not logged in, auth context handles redirect usually, but good to be safe
        if (!user) return;

        // 2. Strict ID Check: Staff can ONLY edit their own profile
        // We use user.id (which comes from _id in validUser)
        // Check both id and _id to be safe depending on interface
        const currentUserId = user.id || user._id;

        if (id !== currentUserId) {
            // Redirect to their own profile view (or dashboard) to prevent unauthorized access
            navigate('/staff/profile', { replace: true });
            return;
        }

        // 3. Load Data
        reset({
            fullName: user.name || '',
            phone: user.phone || '',
        });
        setAvatarPreview(user.avatar || null);

    }, [user, id, navigate, reset]);

    const newPassword = watch('newPassword');

    const onSubmit = async (data: ProfileFormOutputs) => {
        const formData = new FormData();
        formData.append('fullName', data.fullName);
        formData.append('phone', data.phone);

        if (data.currentPassword && data.newPassword) {
            formData.append('currentPassword', data.currentPassword);
            formData.append('newPassword', data.newPassword);
        }

        if (data.avatar && data.avatar.length > 0) {
            formData.append('avatar', data.avatar[0]);
        }

        const success = await updateProfile(formData);

        if (success) {
            if (refreshUser) {
                await refreshUser();
            }
            navigate('/staff/profile');
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    if (!user) return null; // Or loading spinner

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <Button
                variant="ghost"
                className="mb-6 flex items-center gap-2"
                onClick={() => navigate('/staff/profile')}
            >
                <ArrowLeft size={16} /> Back to Profile
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Col: Avatar & Basic Info */}
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Picture</h2>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center p-6">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-orange-100 dark:border-orange-900/30">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                            <User size={48} className="text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 p-2 bg-orange-500 rounded-full text-white cursor-pointer hover:bg-orange-600 transition-colors shadow-lg">
                                    <Camera size={16} />
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        {...register('avatar')}
                                        onChange={(e) => {
                                            register('avatar').onChange(e); // Sync with react-hook-form
                                            handleAvatarChange(e);
                                        }}
                                    />
                                </label>
                            </div>
                            <p className="text-xs text-gray-500 mt-4 text-center">
                                Click camera icon to upload.<br />JPG, PNG or GIF allowed.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Read-Only Info</h3>
                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <div>
                                    <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500">Email</span>
                                    {user.email}
                                </div>
                                <div className="capitalize">
                                    <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500">Role</span>
                                    {user.role}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Col: Form */}
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Profile</h2>
                            <p className="text-sm text-gray-500">Update your personal details and password</p>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                {/* Personal Details */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white border-b pb-2">Personal Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                            <Input
                                                {...register('fullName', { required: 'Full name is required' })}
                                                placeholder="John Doe"
                                            />
                                            {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                                            <Input
                                                {...register('phone')}
                                                placeholder="+1 234 567 890"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Password Change */}
                                <div className="space-y-4 pt-4">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white border-b pb-2 flex items-center justify-between">
                                        Change Password
                                        <span className="text-xs font-normal text-gray-500">(Leave blank to keep current)</span>
                                    </h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                                            <Input
                                                type="password"
                                                {...register('currentPassword')}
                                                placeholder="Required to set new password"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                                                <Input
                                                    type="password"
                                                    {...register('newPassword', {
                                                        minLength: { value: 6, message: 'Must be at least 6 characters' }
                                                    })}
                                                    placeholder="Min 6 chars"
                                                />
                                                {errors.newPassword && <p className="text-xs text-red-500 mt-1">{errors.newPassword.message}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                                                <Input
                                                    type="password"
                                                    {...register('confirmPassword', {
                                                        validate: (val: string | undefined) => {
                                                            if (!newPassword) return true;
                                                            return val === newPassword || 'Passwords do not match';
                                                        }
                                                    })}
                                                    placeholder="Confirm new password"
                                                />
                                                {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end pt-6 border-t border-gray-100 dark:border-gray-800">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="mr-3"
                                        onClick={() => navigate('/staff/profile')}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={isSubmitting}
                                        className="gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>Saving...</>
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
            </div>
        </div>
    );
};
