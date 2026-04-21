import { useUser } from '../contexts/UserContext';

function ProfileCard() {
  const { user } = useUser();

  if (!user || !user.profile) {
    return null;
  }

  const { profile } = user;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Profile</h3>
      
      {/* Profile Header */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-indigo-100">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
              profile.firstName && profile.lastName
                ? `${profile.firstName} ${profile.lastName}`
                : user.name
            )}&background=6366f1&color=fff&bold=true&size=64`}
            alt={profile.firstName && profile.lastName
              ? `${profile.firstName} ${profile.lastName}`
              : user.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h4 className="text-lg font-semibold text-gray-900">
            {profile.firstName && profile.lastName 
              ? `${profile.firstName} ${profile.lastName}` 
              : user.name}
          </h4>
          <p className="text-gray-600">{user.email}</p>
          {profile.phone && (
            <p className="text-gray-500 text-sm">{profile.phone}</p>
          )}
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <div className="mb-4">
          <h5 className="font-medium text-gray-700 mb-2">About</h5>
          <p className="text-gray-600 text-sm leading-relaxed">{profile.bio}</p>
        </div>
      )}

      {/* Location */}
      {(profile.location?.city || profile.location?.state || profile.location?.country) && (
        <div className="mb-4">
          <h5 className="font-medium text-gray-700 mb-2">Location</h5>
          <p className="text-gray-600 text-sm">
            {[profile.location.city, profile.location.state, profile.location.country]
              .filter(Boolean)
              .join(', ')}
          </p>
        </div>
      )}

      {/* Social Links */}
      {(profile.socialLinks?.linkedin || profile.socialLinks?.github || profile.socialLinks?.portfolio || profile.socialLinks?.twitter) && (
        <div className="mb-4">
          <h5 className="font-medium text-gray-700 mb-3">Connect</h5>
          <div className="flex flex-wrap gap-2">
            {profile.socialLinks.linkedin && (
              <a
                href={profile.socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm hover:bg-blue-100 transition-colors"
              >
                <span>💼</span>
                <span>LinkedIn</span>
              </a>
            )}
            {profile.socialLinks.github && (
              <a
                href={profile.socialLinks.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors"
              >
                <span>🐙</span>
                <span>GitHub</span>
              </a>
            )}
            {profile.socialLinks.portfolio && (
              <a
                href={profile.socialLinks.portfolio}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 bg-purple-50 text-purple-700 px-3 py-2 rounded-lg text-sm hover:bg-purple-100 transition-colors"
              >
                <span>🌐</span>
                <span>Portfolio</span>
              </a>
            )}
            {profile.socialLinks.twitter && (
              <a
                href={profile.socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 bg-sky-50 text-sky-700 px-3 py-2 rounded-lg text-sm hover:bg-sky-100 transition-colors"
              >
                <span>🐦</span>
                <span>Twitter</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Edit Profile Link */}
      <div className="pt-4 border-t border-gray-100">
        <a
          href="/profile"
          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
        >
          Edit Profile →
        </a>
      </div>
    </div>
  );
}

export default ProfileCard;
