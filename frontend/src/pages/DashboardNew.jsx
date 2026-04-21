import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { calculateUserStats, getRecentActivities, calculateLevel, getLevelTitle } from '../utils/statsCalculator';
import ProfileCard from '../components/ProfileCard';

function Dashboard() {
  const { user } = useUser();
  const { theme, isDark } = useTheme();
  const [stats, setStats] = useState({
    totalRoadmaps: 0,
    completedLessons: 0,
    currentStreak: 0,
    totalXP: 0,
    weeklyLessons: 0,
    timeSpentThisWeek: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);

  // Load real-time stats
  useEffect(() => {
    if (user) {
      const updateStats = () => {
        const userId = user.id || user._id;
        const calculatedStats = calculateUserStats(userId);
        setStats(calculatedStats);

        const activities = getRecentActivities(userId);
        setRecentActivities(activities);
      };

      updateStats();

      // Set up interval to update stats every 30 seconds for real-time updates
      const interval = setInterval(updateStats, 30000);

      return () => clearInterval(interval);
    }
  }, [user]);

  // Also update when localStorage changes (for real-time updates)
  useEffect(() => {
    const handleStorageChange = () => {
      if (user) {
        const userId = user.id || user._id;
        const calculatedStats = calculateUserStats(userId);
        setStats(calculatedStats);

        const activities = getRecentActivities(userId);
        setRecentActivities(activities);
      }
    };

    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events when localStorage is updated in the same tab
    window.addEventListener('localStorageUpdate', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageUpdate', handleStorageChange);
    };
  }, [user]);

  // Listen for theme changes and force re-render
  // Listen for theme changes (optional: you can keep this if you want to log theme changes)
  useEffect(() => {
    const handleThemeChange = () => {
      console.log('📊 Dashboard detected theme change:', theme);
    };

    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, [theme]);
  // Check if user has a roadmap and resume
  const hasRoadmap = localStorage.getItem('currentRoadmap');
  const hasResume = localStorage.getItem('resumeUploaded');
  
  const quickActions = [
    hasResume
      ? { title: 'Manage Resumes', desc: 'View all resumes and their roadmaps', icon: '📄', link: '/resume/manage', color: 'bg-blue-500' }
      : { title: 'Upload Resume', desc: 'Upload your resume for AI analysis', icon: '📄', link: '/resume-upload', color: 'bg-blue-500' },
    hasRoadmap
      ? { title: 'View Roadmap', desc: 'Continue your learning journey', icon: '🗺️', link: '/roadmap/view', color: 'bg-purple-500' }
      : { title: 'Generate Roadmap', desc: 'Create a personalized learning path', icon: '🗺️', link: '/roadmap', color: 'bg-purple-500' },
    { title: 'View Progress', desc: 'Track your learning progress', icon: '📊', link: '/progress', color: 'bg-green-500' },
    { title: 'Profile Settings', desc: 'Update your profile information', icon: '⚙️', link: '/profile', color: 'bg-orange-500' }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-xl">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  Welcome back, {user.profile?.firstName || user.name || 'User'}! 👋
                </h1>
                <p className="text-indigo-100 text-lg">Ready to continue your learning journey?</p>
              </div>
              <div className="hidden md:block">
                <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center">
                  <span className="text-4xl">🚀</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                    Level {calculateLevel(stats.totalXP).level}
                  </p>
                  <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium">
                    {getLevelTitle(calculateLevel(stats.totalXP).level)}
                  </span>
                </div>
                <p className="text-3xl font-bold text-indigo-600">{stats.totalXP} XP</p>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>Progress to Level {calculateLevel(stats.totalXP).level + 1}</span>
                    <span>{calculateLevel(stats.totalXP).progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${calculateLevel(stats.totalXP).progressPercentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {calculateLevel(stats.totalXP).progressToNext} / {calculateLevel(stats.totalXP).xpNeededForNext} XP
                  </div>
                </div>
              </div>
              <div className="w-12 h-12  bg-indigo-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Current Streak</p>
                <p className="text-3xl font-bold text-orange-600">{stats.currentStreak} days</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🔥</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Completed</p>
                <p className="text-3xl font-bold text-green-600">{stats.completedLessons}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Roadmaps</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalRoadmaps}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🗺️</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="mb-10">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.link}
                  className="group p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-600 dark:hover:to-gray-700 transition-all duration-200 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                >
                  <div className="text-center">
                    <div className={`w-16 h-16 ${action.color} rounded-xl flex items-center justify-center text-white text-2xl group-hover:scale-110 transition-transform duration-200 mx-auto mb-3`}>
                      {action.icon}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-2">
                      {action.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">{action.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Current Roadmap */}
            {stats.totalRoadmaps > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Current Roadmap Progress</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Overall Progress</span>
                    <span className="font-bold text-indigo-600">
                      {stats.totalRoadmaps > 0 && stats.completedLessons > 0
                        ? Math.round((stats.completedLessons / (stats.completedLessons + 10)) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${stats.totalRoadmaps > 0 && stats.completedLessons > 0
                          ? Math.round((stats.completedLessons / (stats.completedLessons + 10)) * 100)
                          : 0}%`
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{stats.completedLessons} lessons completed</span>
                    <Link to="/roadmap/view" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                      View Full Roadmap →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Weekly Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">This Week's Progress</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">{stats.weeklyLessons}</div>
                  <div className="text-sm text-green-700 dark:text-green-300">Lessons Completed</div>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.timeSpentThisWeek >= 60
                      ? `${stats.timeSpentThisWeek}h`
                      : `${stats.timeSpentThisWeek}m`}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">Time Spent</div>
                </div>
              </div>
            </div>

            {/* Profile Card */}
            <ProfileCard />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Recent Activities */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Activities (24h)</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600 hover:shadow-md transition-shadow duration-200">
                    <div className="flex-shrink-0">
                      <span className="text-lg">{activity.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white break-words">{activity.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievement Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Achievements</h3>
              <div className="space-y-3">
                {stats.currentStreak >= 3 && (
                  <div className="flex items-center space-x-3 p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                    <span className="text-2xl">🔥</span>
                    <div>
                      <p className="font-medium text-orange-800 dark:text-orange-300">Streak Master</p>
                      <p className="text-sm text-orange-600 dark:text-orange-400">{stats.currentStreak} days learning streak!</p>
                    </div>
                  </div>
                )}
                {stats.completedLessons >= 10 && (
                  <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-300">Dedicated Learner</p>
                      <p className="text-sm text-green-600 dark:text-green-400">Completed {stats.completedLessons} lessons!</p>
                    </div>
                  </div>
                )}
                {stats.totalRoadmaps >= 2 && (
                  <div className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                    <span className="text-2xl">🗺️</span>
                    <div>
                      <p className="font-medium text-purple-800 dark:text-purple-300">Explorer</p>
                      <p className="text-sm text-purple-600 dark:text-purple-400">Created {stats.totalRoadmaps} learning paths!</p>
                    </div>
                  </div>
                )}
                {stats.currentStreak === 0 && stats.completedLessons === 0 && stats.totalRoadmaps === 0 && (
                  <div className="text-center py-8">
                    <span className="text-4xl mb-2 block">🌟</span>
                    <p className="text-gray-600 dark:text-gray-300">Start learning to unlock achievements!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
