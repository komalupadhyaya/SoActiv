import { useAuth } from '../../contexts/AuthContext';

export const UserProfilePage: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
        <div className="text-center">
          <svg
            className="w-20 h-20 mx-auto text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <h2 className="text-3xl font-bold mt-6 text-gray-800 dark:text-gray-100">Not Signed In</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Please log in to view your profile.
          </p>
        </div>
      </div>
    );
  }

  // ✅ Safe fallbacks
  const displayName = user.name || user.email.split('@')[0] || 'User';
  const displayEmail = user.email || '—';

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ff5c33' fill-opacity='0.5'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Cover */}
      <div
        className="h-32 md:h-40 bg-gradient-to-r from-orange-400 via-red-500 to-pink-500"
        style={{ backgroundColor: '#ff5c33' }}
      />

      {/* Profile Content */}
      <div className="px-6 pb-8">
        <div className="flex flex-col md:flex-row -mt-20 md:-mt-24 items-center md:items-start gap-6 md:gap-8 px-6">
          {/* Avatar */}
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
              displayName
            )}&background=ff5c33&color=fff&size=120`}
            alt="Profile"
            className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white dark:border-gray-800 shadow-xl"
          />

          {/* Info */}
          <div className="text-center md:text-left mt-2">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-100 dark:text-white">
              {displayName}
            </h2>
            <p className="text-3xl md:text-4xl font-bold text-gray-100 dark:text-white">
              {displayEmail}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Member since{' '}
              {new Date(user.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
              })}
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="mt-10 px-6">
          <h3 className="text-xl font-bold mb-6 flex items-center text-gray-800 dark:text-white">
            <span
              className="inline-block w-1 h-6 mr-3 rounded-full"
              style={{ backgroundColor: '#ff5c33' }}
            ></span>
            Personal Information
          </h3>

          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-base">
            <div>
              <dt className="font-semibold text-gray-700 dark:text-gray-300">Full Name</dt>
              <dd className="text-gray-900 dark:text-gray-100">{displayName}</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-700 dark:text-gray-300">Email</dt>
              <dd className="text-gray-900 dark:text-gray-100 truncate">{displayEmail}</dd>
            </div>
            {user.phone && (
              <div>
                <dt className="font-semibold text-gray-700 dark:text-gray-300">Phone</dt>
                <dd className="text-gray-900 dark:text-gray-100">{user.phone}</dd>
              </div>
            )}
            <div>
              <dt className="font-semibold text-gray-700 dark:text-gray-300">Joined</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {new Date(user.createdAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};