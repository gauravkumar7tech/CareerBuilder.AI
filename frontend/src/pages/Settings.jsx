import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { logActivity, triggerStatsUpdate } from '../utils/statsCalculator';

const Settings = () => {
  const { user, updateProfile } = useUser();
  const { updateTheme, theme, isDark } = useTheme();
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      streak: true,
      achievements: true,
      weeklyReport: true
    },
    privacy: {
      profilePublic: false,
      showProgress: true,
      showAchievements: true
    },
    learning: {
      dailyGoal: 30, // minutes
      reminderTime: '18:00',
      difficulty: 'intermediate',
      autoAdvance: true
    },
    appearance: {
      theme: 'light',
      language: 'en',
      timezone: 'auto'
    }
  });
  
  const [activeTab, setActiveTab] = useState('notifications');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        const loadedSettings = JSON.parse(savedSettings);
        setSettings(loadedSettings);

        // Sync with theme context
        if (loadedSettings.appearance?.theme) {
          updateTheme(loadedSettings.appearance.theme);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, [updateTheme]);

  const handleSettingChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));

    // If theme is changed, update immediately
    if (category === 'appearance' && setting === 'theme') {
      updateTheme(value);
      setMessage(`Theme changed to ${value === 'auto' ? 'auto (system)' : value} mode!`);
      setTimeout(() => setMessage(''), 2000);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('userSettings', JSON.stringify(settings));
      
      // Log activity
      logActivity('settings_updated', 0, {
        title: 'Updated settings',
        category: activeTab
      });

      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
      
      triggerStatsUpdate();
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      const defaultSettings = {
        notifications: {
          email: true,
          push: true,
          streak: true,
          achievements: true,
          weeklyReport: true
        },
        privacy: {
          profilePublic: false,
          showProgress: true,
          showAchievements: true
        },
        learning: {
          dailyGoal: 30,
          reminderTime: '18:00',
          difficulty: 'intermediate',
          autoAdvance: true
        },
        appearance: {
          theme: 'light',
          language: 'en',
          timezone: 'auto'
        }
      };
      setSettings(defaultSettings);
      setMessage('Settings reset to default values.');
    }
  };

  const clearAllData = () => {
    if (window.confirm('⚠️ This will delete ALL your learning data including progress, streaks, and roadmaps. This action cannot be undone. Are you sure?')) {
      if (window.confirm('🚨 FINAL WARNING: This will permanently delete everything. Type "DELETE" to confirm.')) {
        // Clear all learning data
        const keysToRemove = [
          'activityLog',
          'roadmapHistory',
          'totalTimeSpent',
          'userSettings'
        ];
        
        // Remove roadmap completion data
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('roadmap_') && key.endsWith('_completed')) {
            keysToRemove.push(key);
          }
        });
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        setMessage('All learning data has been cleared.');
        triggerStatsUpdate();
      }
    }
  };

  const tabs = [
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'privacy', name: 'Privacy', icon: '🔒' },
    { id: 'learning', name: 'Learning', icon: '📚' },
    { id: 'appearance', name: 'Appearance', icon: '🎨' },
    { id: 'data', name: 'Data', icon: '💾' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl mb-4">
            <span className="text-3xl">⚙️</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Customize your CareerBuilder.AI experience</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('Error') || message.includes('cleared')
              ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700'
              : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="text-xl">{tab.icon}</span>
                    <span className="font-medium">{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8">
              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Notification Preferences</h2>
                  <div className="space-y-6">
                    {Object.entries(settings.notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {key === 'email' && 'Receive email notifications'}
                            {key === 'push' && 'Browser push notifications'}
                            {key === 'streak' && 'Daily streak reminders'}
                            {key === 'achievements' && 'Achievement notifications'}
                            {key === 'weeklyReport' && 'Weekly progress reports'}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => handleSettingChange('notifications', key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Privacy Settings</h2>
                  <div className="space-y-6">
                    {Object.entries(settings.privacy).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {key === 'profilePublic' && 'Make your profile visible to other users'}
                            {key === 'showProgress' && 'Display your learning progress publicly'}
                            {key === 'showAchievements' && 'Show your achievements on profile'}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => handleSettingChange('privacy', key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Learning Tab */}
              {activeTab === 'learning' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Learning Preferences</h2>
                  <div className="space-y-6">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Daily Learning Goal (minutes)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="480"
                        value={settings.learning.dailyGoal}
                        onChange={(e) => handleSettingChange('learning', 'dailyGoal', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Daily Reminder Time
                      </label>
                      <input
                        type="time"
                        value={settings.learning.reminderTime}
                        onChange={(e) => handleSettingChange('learning', 'reminderTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Preferred Difficulty Level
                      </label>
                      <select
                        value={settings.learning.difficulty}
                        onChange={(e) => handleSettingChange('learning', 'difficulty', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Auto-advance to next lesson</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Automatically move to the next lesson when completed</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.learning.autoAdvance}
                          onChange={(e) => handleSettingChange('learning', 'autoAdvance', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Appearance & Language
                    </h2>
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        isDark
                          ? 'bg-gray-700 text-gray-300'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Theme
                      </label>
                      <select
                        value={settings.appearance.theme}
                        onChange={(e) =>
                          handleSettingChange('appearance', 'theme', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto (System)</option>
                      </select>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Language
                      </label>
                      <select
                        value={settings.appearance.language}
                        onChange={(e) =>
                          handleSettingChange('appearance', 'language', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                        <option value="zh">中文</option>
                      </select>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Timezone
                      </label>
                      <select
                        value={settings.appearance.timezone}
                        onChange={(e) =>
                          handleSettingChange('appearance', 'timezone', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="auto">Auto-detect</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="Europe/London">London</option>
                        <option value="Europe/Paris">Paris</option>
                        <option value="Asia/Tokyo">Tokyo</option>
                      </select>
                    </div>
                  </div>
                </div>
              )
            }


              {/* Data Tab */}
              {activeTab === 'data' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Data Management</h2>
                  <div className="space-y-6">
                    {/* Export Data */}
                    <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">Export Your Data</h3>
                      <p className="text-blue-700 dark:text-blue-400 mb-4">Download all your learning progress, roadmaps, and achievements.</p>
                      <button
                        onClick={() => {
                          const data = {
                            activityLog: localStorage.getItem('activityLog'),
                            roadmapHistory: localStorage.getItem('roadmapHistory'),
                            totalTimeSpent: localStorage.getItem('totalTimeSpent'),
                            settings: localStorage.getItem('userSettings'),
                            exportDate: new Date().toISOString()
                          };
                          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `careercraft-data-${new Date().toISOString().split('T')[0]}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                          setMessage('Data exported successfully!');
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        📥 Export Data
                      </button>
                    </div>

                    {/* Storage Usage */}
                    <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Storage Usage</h3>
                      <div className="space-y-2 text-gray-700 dark:text-gray-300">
                        <div className="flex justify-between">
                          <span>Activity Log:</span>
                          <span>{Math.round((localStorage.getItem('activityLog')?.length || 0) / 1024)} KB</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Roadmap History:</span>
                          <span>{Math.round((localStorage.getItem('roadmapHistory')?.length || 0) / 1024)} KB</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Settings:</span>
                          <span>{Math.round((localStorage.getItem('userSettings')?.length || 0) / 1024)} KB</span>
                        </div>
                      </div>
                    </div>

                    {/* Clear Data */}
                    <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">⚠️ Danger Zone</h3>
                      <p className="text-red-700 dark:text-red-400 mb-4">This action will permanently delete all your learning data and cannot be undone.</p>
                      <button
                        onClick={clearAllData}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        🗑️ Clear All Data
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="mt-8 flex justify-between">
                <button
                  onClick={resetSettings}
                  className="px-6 py-3 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                >
                  Reset to Default
                </button>
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="px-6 py-3 bg-indigo-600 dark:bg-indigo-700 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
