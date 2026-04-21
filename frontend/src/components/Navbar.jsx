import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import API from '../services/api';

function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, theme, isInitialized } = useTheme();

  // Debug theme state
  useEffect(() => {
    console.log('🧭 Navbar theme state:', { theme, isDark, isInitialized });
  }, [theme, isDark, isInitialized]);

  // Check if current path matches button
  const isActive = (path) => location.pathname === path;

  // Close dropdowns when clicking outside (but not input fields)
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't blur if clicking on input fields, textareas, or buttons
      const isInputElement = event.target.matches('input, textarea, button, select, [contenteditable]');
      const isInsideForm = event.target.closest('form');

      if (!isInputElement && !isInsideForm && document.activeElement) {
        // Only blur if the active element is a dropdown or navigation element
        const activeElement = document.activeElement;
        const isDropdownElement = activeElement.matches('.dropdown, .menu, [role="menu"], [role="menuitem"]');

        if (isDropdownElement) {
          activeElement.blur();
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Get user info from backend using cookie
        const { data } = await API.get('/auth/me');
        setUser(data.user);
      } catch {
        // User not authenticated or cookie expired
        setUser(null);
      }
    };

    // Only fetch user data if we're on a protected route
    const isProtectedRoute = location.pathname !== '/' &&
                            location.pathname !== '/login' &&
                            location.pathname !== '/register';

    if (isProtectedRoute) {
      fetchUser();
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      // Call logout endpoint to clear cookie
      await API.post('/auth/logout');
    } catch {
      // Even if logout fails, clear user state
    }

    // Clear user state and localStorage
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('resumeUploaded');
    localStorage.removeItem('currentRoadmap');

    navigate('/');
  };



  return (
    <nav className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 shadow-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 text-white hover:text-yellow-300 transition-colors duration-200">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-200">
                <span className="text-2xl">🚀</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">
                CareerBuilder.AI
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {user && (
                <>
                  <Link
                    to="/dashboard"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive('/dashboard')
                        ? 'bg-white/20 text-white shadow-lg'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    🏠 Dashboard
                  </Link>
                  <Link
                    to="/progress"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive('/progress')
                        ? 'bg-white/20 text-white shadow-lg'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    📊 Progress
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-8 gap-4">
            {user ? (
              <>
                {/* Direct Navigation Buttons */}
                <div className="flex items-center space-x-3">
                  {/* Profile Button */}
                  <Link
                    to="/profile"
                    className={`group relative overflow-hidden backdrop-blur-sm border rounded-2xl px-3 py-1 transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                      isActive('/profile')
                        ? 'bg-gradient-to-r from-indigo-500/30 to-purple-500/30 border-white/50 shadow-lg shadow-indigo-500/20'
                        : 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 border-white/20 hover:border-white/40 hover:shadow-indigo-500/20'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/30 group-hover:ring-white/50 transition-all duration-300">
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                              user?.profile?.firstName && user?.profile?.lastName
                                ? `${user.profile.firstName} ${user.profile.lastName}`
                                : user?.name || 'User'
                            )}&background=6366f1&color=fff&bold=true&size=40`}
                            alt={user?.profile?.firstName && user?.profile?.lastName
                              ? `${user.profile.firstName} ${user.profile.lastName}`
                              : user?.name || 'User'}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white group-hover:scale-110 transition-transform duration-300"></div>
                      </div>
                      <div className="hidden md:block">
                        <p className={`font-medium transition-colors duration-300 ${
                          isActive('/profile')
                            ? 'text-white'
                            : 'text-white group-hover:text-indigo-200'
                        }`}>My Profile</p>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/10 group-hover:to-purple-500/10 transition-all duration-300"></div>
                  </Link>

                  {/* Settings Button */}
                  <Link
                    to="/settings"
                    className={`group relative overflow-hidden backdrop-blur-sm border rounded-2xl px-3 py-1 transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                      isActive('/settings')
                        ? 'bg-gradient-to-r from-gray-500/30 to-slate-500/30 border-white/50 shadow-lg shadow-gray-500/20'
                        : 'bg-gradient-to-r from-gray-500/10 to-slate-500/10 hover:from-gray-500/20 hover:to-slate-500/20 border-white/20 hover:border-white/40 hover:shadow-gray-500/20'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isActive('/settings')
                            ? 'bg-white/30'
                            : 'bg-white/10 group-hover:bg-white/20'
                        }`}>
                          <svg className={`w-5 h-5 transition-all duration-300 ${
                            isActive('/settings')
                              ? 'rotate-90 text-gray-200'
                              : 'group-hover:rotate-90 group-hover:text-gray-200'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="hidden md:block">
                        <p className={`font-medium transition-colors duration-300 ${
                          isActive('/settings')
                            ? 'text-white'
                            : 'text-white group-hover:text-gray-200'
                        }`}>Settings</p>
                        <p className={`text-xs transition-colors duration-300 ${
                          isActive('/settings')
                            ? 'text-gray-200'
                            : 'text-white/70 group-hover:text-gray-300'
                        }`}>Preferences</p>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-500/0 to-slate-500/0 group-hover:from-gray-500/10 group-hover:to-slate-500/10 transition-all duration-300"></div>
                  </Link>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="group relative overflow-hidden bg-gradient-to-r from-red-500/10 to-pink-500/10 hover:from-red-500/25 hover:to-pink-500/25 backdrop-blur-sm border border-white/20 hover:border-red-300/50 rounded-2xl px-3 py-1 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/30"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-red-500/20 transition-all duration-300">
                          <svg className="w-5 h-5 group-hover:translate-x-1 group-hover:text-red-200 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </div>
                      </div>
                      <div className="hidden md:block">
                        <p className="text-white font-medium group-hover:text-red-200 transition-colors duration-300">Logout</p>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 to-pink-500/0 group-hover:from-red-500/10 group-hover:to-pink-500/10 transition-all duration-300"></div>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-white/80 hover:text-white transition-colors duration-200 font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <div className="dropdown dropdown-end">
                <label tabIndex={0} className="btn btn-ghost btn-circle text-white hover:bg-white/10">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                </label>
                <div tabIndex={0} className="dropdown-content mt-3 z-[1] w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                  {user ? (
                    <>
                      {/* Mobile User Header */}
                      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                              user?.profile?.firstName && user?.profile?.lastName
                                ? `${user.profile.firstName} ${user.profile.lastName}`
                                : user?.name || 'User'
                            )}&background=ffffff&color=6366f1&bold=true&size=48`}
                            alt={user?.profile?.firstName && user?.profile?.lastName
                              ? `${user.profile.firstName} ${user.profile.lastName}`
                              : user?.name || 'User'}
                            className="w-12 h-12 rounded-full"
                          />
                          <div>
                            <p className="font-semibold">
                              {user?.profile?.firstName && user?.profile?.lastName
                                ? `${user.profile.firstName} ${user.profile.lastName}`
                                : user?.name || 'User'}
                            </p>
                            <p className="text-sm opacity-80">{user?.email || 'user@example.com'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Menu Items */}
                      <div className="p-2">
                        <Link to="/dashboard" className="flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 rounded-xl transition-colors">
                          <span className="text-lg">🏠</span>
                          <span className="font-medium">Dashboard</span>
                        </Link>
                        <Link to="/progress" className="flex items-center space-x-3 px-4 py-3 hover:bg-green-50 rounded-xl transition-colors">
                          <span className="text-lg">📊</span>
                          <span className="font-medium">Progress</span>
                        </Link>
                        <Link to="/profile" className="flex items-center space-x-3 px-4 py-3 hover:bg-indigo-50 rounded-xl transition-colors">
                          <span className="text-lg">👤</span>
                          <span className="font-medium">Profile</span>
                        </Link>
                        <Link to="/settings" className="flex items-center space-x-3 px-4 py-3 hover:bg-purple-50 rounded-xl transition-colors">
                          <span className="text-lg">⚙️</span>
                          <span className="font-medium">Settings</span>
                        </Link>
                      </div>

                      {/* Mobile Logout */}
                      <div className="p-2 border-t border-gray-100">
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-3 px-4 py-3 hover:bg-red-50 rounded-xl transition-colors text-red-600 w-full text-left"
                        >
                          <span className="text-lg">🚪</span>
                          <span className="font-medium">Logout</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 space-y-2">
                      <Link to="/login" className="block w-full text-center py-3 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                        Login
                      </Link>
                      <Link to="/register" className="block w-full text-center py-3 px-4 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-colors">
                        Sign Up
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
export default Navbar;
