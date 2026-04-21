// Calculate user statistics dynamically for a specific user
export const calculateUserStats = (userId = null) => {
  // Get current user ID if not provided
  if (!userId) {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        userId = user.id || user._id;
      } catch (error) {
        console.error('Error getting user ID:', error);
        return {
          totalRoadmaps: 0,
          completedLessons: 0,
          currentStreak: 0,
          totalXP: 0,
          weeklyLessons: 0,
          timeSpentThisWeek: 0,
          lastActivityDate: null
        };
      }
    } else {
      return {
        totalRoadmaps: 0,
        completedLessons: 0,
        currentStreak: 0,
        totalXP: 0,
        weeklyLessons: 0,
        timeSpentThisWeek: 0,
        lastActivityDate: null
      };
    }
  }
  let stats = {
    totalRoadmaps: 0,
    completedLessons: 0,
    currentStreak: 0,
    totalXP: 0,
    weeklyLessons: 0,
    timeSpentThisWeek: 0,
    lastActivityDate: null
  };

  // Count all roadmaps from history for this specific user
  const roadmapHistory = localStorage.getItem('roadmapHistory');
  let allRoadmaps = [];

  if (roadmapHistory) {
    try {
      const allHistoryRoadmaps = JSON.parse(roadmapHistory);
      // Filter roadmaps by user ID
      allRoadmaps = allHistoryRoadmaps.filter(roadmap =>
        roadmap.userId === userId || roadmap.createdBy === userId
      );
    } catch (error) {
      console.error('Error parsing roadmap history:', error);
    }
  }

  // Also include current roadmap if not in history and belongs to this user
  const currentRoadmap = localStorage.getItem('currentRoadmap');
  if (currentRoadmap) {
    try {
      const current = JSON.parse(currentRoadmap);
      // Check if current roadmap belongs to this user
      if ((current.userId === userId || current.createdBy === userId)) {
        const isInHistory = allRoadmaps.some(r => r.id === current.id);
        if (!isInHistory) {
          allRoadmaps.push(current);
        }
      }
    } catch (error) {
      console.error('Error parsing current roadmap:', error);
    }
  }

  // Calculate stats from all roadmaps
  stats.totalRoadmaps = allRoadmaps.length;

  let totalCompletedLessons = 0;
  allRoadmaps.forEach(roadmap => {
    if (roadmap.id) {
      const completedSteps = localStorage.getItem(`roadmap_${roadmap.id}_completed`);
      if (completedSteps) {
        try {
          const completed = JSON.parse(completedSteps);
          totalCompletedLessons += completed.length;
        } catch (error) {
          console.error('Error parsing completed steps:', error);
        }
      }
    }
  });

  stats.completedLessons = totalCompletedLessons;

  // Enhanced XP calculation with bonuses
  let totalXP = 0;

  // Base XP: 10 per completed lesson
  totalXP += totalCompletedLessons * 10;

  // Streak bonus: 5 XP per day of current streak
  const currentStreak = getCurrentStreak(userId);
  totalXP += currentStreak * 5;

  // Roadmap completion bonus: 50 XP per completed roadmap
  allRoadmaps.forEach(roadmap => {
    if (roadmap.id) {
      const completedSteps = localStorage.getItem(`roadmap_${roadmap.id}_completed`);
      if (completedSteps) {
        try {
          const completed = JSON.parse(completedSteps);
          const totalSteps = roadmap.totalSteps || 0;
          if (totalSteps > 0 && completed.length >= totalSteps) {
            totalXP += 50; // Completion bonus
          }
        } catch (error) {
          console.error('Error calculating completion bonus:', error);
        }
      }
    }
  });

  // Time-based bonus: 1 XP per 10 minutes of study time
  const totalTimeSpent = getTotalTimeSpent();
  totalXP += Math.floor(totalTimeSpent / 10);

  stats.totalXP = totalXP;

  // Calculate streak
  stats.currentStreak = getCurrentStreak(userId);

  // Get weekly stats
  const weeklyData = getWeeklyStats(userId);
  stats.weeklyLessons = weeklyData.lessons;
  stats.timeSpentThisWeek = weeklyData.timeSpent;

  return stats;
};

// Calculate current learning streak for specific user
export const calculateStreak = (userId = null) => {
  // Get current user ID if not provided
  if (!userId) {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        userId = user.id || user._id;
      } catch (error) {
        console.error('Error getting user ID:', error);
        return 0;
      }
    } else {
      return 0;
    }
  }

  const activityLog = localStorage.getItem('activityLog');
  if (!activityLog) return 0;

  const allActivities = JSON.parse(activityLog);
  // Filter activities for this user
  const activities = allActivities.filter(activity =>
    !activity.userId || activity.userId === userId
  );
  const today = new Date();
  let streak = 0;
  let currentDate = new Date(today);

  // Check each day backwards from today
  for (let i = 0; i < 365; i++) { // Max 365 days
    const dateString = currentDate.toISOString().split('T')[0];
    const hasActivity = activities.some(activity =>
      activity.date === dateString && activity.type === 'lesson_completed'
    );

    if (hasActivity) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (i === 0) {
      // If no activity today, check yesterday
      currentDate.setDate(currentDate.getDate() - 1);
      const yesterdayString = currentDate.toISOString().split('T')[0];
      const hasYesterdayActivity = activities.some(activity =>
        activity.date === yesterdayString && activity.type === 'lesson_completed'
      );

      if (hasYesterdayActivity) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break; // Streak is broken
      }
    } else {
      break; // Streak is broken
    }
  }

  // Store the calculated streak with timestamp for caching
  const streakData = {
    streak,
    lastCalculated: new Date().toISOString(),
    calculatedDate: new Date().toISOString().split('T')[0]
  };
  localStorage.setItem('currentStreakCache', JSON.stringify(streakData));

  return streak;
};

// Get cached streak or recalculate if needed
export const getCurrentStreak = (userId = null) => {
  const cached = localStorage.getItem('currentStreakCache');
  const today = new Date().toISOString().split('T')[0];

  if (cached) {
    try {
      const streakData = JSON.parse(cached);
      // If calculated today, use cached value
      if (streakData.calculatedDate === today) {
        return streakData.streak;
      }
    } catch (error) {
      console.error('Error parsing streak cache:', error);
    }
  }

  // Recalculate if no cache or cache is old
  return calculateStreak(userId);
};

// Get weekly statistics for specific user
export const getWeeklyStats = (userId = null) => {
  // Get current user ID if not provided
  if (!userId) {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        userId = user.id || user._id;
      } catch (error) {
        console.error('Error getting user ID:', error);
      }
    }
  }

  const activityLog = localStorage.getItem('activityLog');
  if (!activityLog) return { lessons: 0, timeSpent: 0 };

  const allActivities = JSON.parse(activityLog);
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const weeklyActivities = allActivities.filter(activity => {
    const activityDate = new Date(activity.timestamp);
    const isRecent = activityDate >= oneWeekAgo;
    const isUserActivity = !activity.userId || activity.userId === userId;
    return isRecent && isUserActivity;
  });

  const lessons = weeklyActivities.filter(a => a.type === 'lesson_completed').length;
  const timeSpentMinutes = weeklyActivities.reduce((total, activity) => {
    return total + (activity.timeSpent || 0);
  }, 0);

  // Return time in hours with decimal precision
  return {
    lessons,
    timeSpent: timeSpentMinutes >= 60
      ? Math.round((timeSpentMinutes / 60) * 10) / 10 // Round to 1 decimal place
      : timeSpentMinutes
  };
};

// Enhanced time tracking system
export const startLessonTimer = (lessonId) => {
  const startTime = Date.now();
  localStorage.setItem(`lesson_timer_${lessonId}`, startTime.toString());
  return startTime;
};

export const endLessonTimer = (lessonId) => {
  const startTimeStr = localStorage.getItem(`lesson_timer_${lessonId}`);
  if (!startTimeStr) return 0;

  const startTime = parseInt(startTimeStr);
  const endTime = Date.now();
  const timeSpentMs = endTime - startTime;
  const timeSpentMinutes = Math.round(timeSpentMs / (1000 * 60));

  // Clean up timer
  localStorage.removeItem(`lesson_timer_${lessonId}`);

  return Math.max(1, timeSpentMinutes); // Minimum 1 minute
};

// Log user activity with enhanced time tracking
export const logActivity = (type, data = {}) => {
  // Get current user ID
  let userId = null;
  const userData = localStorage.getItem('user');
  if (userData) {
    try {
      const user = JSON.parse(userData);
      userId = user.id || user._id;
    } catch (error) {
      console.error('Error getting user ID for activity log:', error);
    }
  }

  const activityLog = localStorage.getItem('activityLog') || '[]';
  const activities = JSON.parse(activityLog);

  const today = new Date().toISOString().split('T')[0];

  // Calculate realistic time spent based on activity type
  let timeSpent = data.timeSpent;
  if (!timeSpent) {
    switch (type) {
      case 'lesson_completed':
        timeSpent = data.actualTimeSpent || Math.floor(Math.random() * 20) + 10; // 10-30 minutes
        break;
      case 'roadmap_generated':
        timeSpent = Math.floor(Math.random() * 10) + 5; // 5-15 minutes
        break;
      case 'profile_updated':
        timeSpent = Math.floor(Math.random() * 5) + 2; // 2-7 minutes
        break;
      default:
        timeSpent = 5; // Default 5 minutes
    }
  }

  const newActivity = {
    id: Date.now(),
    type,
    date: today,
    timestamp: new Date().toISOString(),
    timeSpent,
    userId, // Add user ID to activity
    ...data
  };

  activities.push(newActivity);

  // Keep only last 100 activities to prevent storage bloat
  if (activities.length > 100) {
    activities.splice(0, activities.length - 100);
  }

  localStorage.setItem('activityLog', JSON.stringify(activities));

  // Update total time spent
  updateTotalTimeSpent(timeSpent);

  // Trigger real-time updates
  triggerStatsUpdate();
};

// Track total time spent
const updateTotalTimeSpent = (additionalMinutes) => {
  const currentTotal = localStorage.getItem('totalTimeSpent') || '0';
  const newTotal = parseInt(currentTotal) + additionalMinutes;
  localStorage.setItem('totalTimeSpent', newTotal.toString());
};

// Get total time spent
export const getTotalTimeSpent = () => {
  const total = localStorage.getItem('totalTimeSpent') || '0';
  return parseInt(total);
};

// Calculate user level based on XP
export const calculateLevel = (totalXP) => {
  // Level formula: Level = floor(sqrt(XP / 100))
  // Level 1: 100 XP, Level 2: 400 XP, Level 3: 900 XP, etc.
  const level = Math.floor(Math.sqrt(totalXP / 100)) + 1;
  const currentLevelXP = Math.pow(level - 1, 2) * 100;
  const nextLevelXP = Math.pow(level, 2) * 100;
  const progressToNext = totalXP - currentLevelXP;
  const xpNeededForNext = nextLevelXP - currentLevelXP;

  return {
    level,
    currentLevelXP,
    nextLevelXP,
    progressToNext,
    xpNeededForNext,
    progressPercentage: Math.round((progressToNext / xpNeededForNext) * 100)
  };
};

// Get level title based on level number
export const getLevelTitle = (level) => {
  const titles = {
    1: "Beginner",
    2: "Learner",
    3: "Student",
    4: "Apprentice",
    5: "Developer",
    6: "Skilled",
    7: "Expert",
    8: "Master",
    9: "Guru",
    10: "Legend"
  };

  if (level >= 10) return "Legend";
  return titles[level] || "Beginner";
};

// Trigger real-time updates across the app
export const triggerStatsUpdate = () => {
  // Dispatch custom event to notify components of data changes
  window.dispatchEvent(new CustomEvent('localStorageUpdate'));
};

// Clean up data from other users (optional - for performance)
export const cleanupOtherUsersData = (currentUserId) => {
  try {
    // Clean activity log
    const activityLog = localStorage.getItem('activityLog');
    if (activityLog) {
      const activities = JSON.parse(activityLog);
      const userActivities = activities.filter(activity =>
        !activity.userId || activity.userId === currentUserId
      );
      localStorage.setItem('activityLog', JSON.stringify(userActivities));
    }

    // Clean roadmap history
    const roadmapHistory = localStorage.getItem('roadmapHistory');
    if (roadmapHistory) {
      const roadmaps = JSON.parse(roadmapHistory);
      const userRoadmaps = roadmaps.filter(roadmap =>
        !roadmap.userId || roadmap.userId === currentUserId || roadmap.createdBy === currentUserId
      );
      localStorage.setItem('roadmapHistory', JSON.stringify(userRoadmaps));
    }

    // Clear cached streak data to force recalculation
    localStorage.removeItem('currentStreakCache');

    console.log('✅ Cleaned up data from other users');
  } catch (error) {
    console.error('Error cleaning up other users data:', error);
  }
};

// Initialize default data for new users
export const initializeNewUser = (userId) => {
  try {
    // Initialize empty activity log if none exists
    if (!localStorage.getItem('activityLog')) {
      localStorage.setItem('activityLog', JSON.stringify([]));
    }

    // Initialize empty roadmap history if none exists
    if (!localStorage.getItem('roadmapHistory')) {
      localStorage.setItem('roadmapHistory', JSON.stringify([]));
    }

    // Clear any cached data to ensure fresh start
    localStorage.removeItem('currentStreakCache');
    localStorage.removeItem('totalTimeSpent');

    // Log welcome activity for new user
    logActivity('welcome', {
      title: 'Welcome to CareerCraft.AI!',
      description: 'Your learning journey begins now'
    });

    console.log('✅ Initialized new user data');
  } catch (error) {
    console.error('Error initializing new user:', error);
  }
};

// Reset all stats for current user (for testing)
export const resetUserStats = () => {
  try {
    // Clear all cached data
    localStorage.removeItem('currentStreakCache');
    localStorage.removeItem('totalTimeSpent');

    // Reset activity log to empty
    localStorage.setItem('activityLog', JSON.stringify([]));

    // Reset roadmap history to empty
    localStorage.setItem('roadmapHistory', JSON.stringify([]));

    // Clear current roadmap
    localStorage.removeItem('currentRoadmap');

    // Clear all roadmap completion data
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('roadmap_') && (key.includes('_completed') || key.includes('_timer'))) {
        localStorage.removeItem(key);
      }
    });

    console.log('✅ Reset all user stats');

    // Trigger update
    triggerStatsUpdate();
  } catch (error) {
    console.error('Error resetting user stats:', error);
  }
};

// Get recent activities for display (only from last 24 hours) for specific user
export const getRecentActivities = (userId = null) => {
  // Get current user ID if not provided
  if (!userId) {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        userId = user.id || user._id;
      } catch (error) {
        console.error('Error getting user ID:', error);
      }
    }
  }

  const activityLog = localStorage.getItem('activityLog');
  if (!activityLog) {
    return [
      { id: 1, type: 'welcome', title: 'Welcome to CareerCraft.AI!', time: 'Just now', icon: '🎉' },
      { id: 2, type: 'tip', title: 'Complete your first lesson to start your streak', time: '1 minute ago', icon: '💡' }
    ];
  }

  const activities = JSON.parse(activityLog);
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  // Filter activities from last 24 hours (show all activities, not just user-specific)
  const recentActivities = activities.filter(activity => {
    const activityDate = new Date(activity.timestamp);
    return activityDate >= oneDayAgo;
  });

  // If no activities in last 24 hours, show welcome message
  if (recentActivities.length === 0) {
    return [
      { id: 1, type: 'info', title: 'No recent activity in the last 24 hours', time: 'Today', icon: '📅' },
      { id: 2, type: 'tip', title: 'Complete a lesson to see your activity here', time: 'Tip', icon: '💡' }
    ];
  }

  return recentActivities
    .slice(-5) // Get last 5 activities from the filtered list
    .reverse() // Show newest first
    .map(activity => ({
      id: activity.id,
      type: activity.type,
      title: getActivityTitle(activity),
      time: getTimeAgo(activity.timestamp),
      icon: getActivityIcon(activity.type)
    }));
};

// Helper functions
const getActivityTitle = (activity) => {
  switch (activity.type) {
    case 'lesson_completed':
      return activity.lessonTitle || 'Completed a lesson';
    case 'roadmap_generated':
      return 'Generated new learning roadmap';
    case 'profile_updated':
      return 'Updated profile information';
    case 'streak_milestone':
      return `Reached ${activity.streakDays} day streak!`;
    default:
      return 'Activity completed';
  }
};

const getActivityIcon = (type) => {
  switch (type) {
    case 'lesson_completed': return '✅';
    case 'roadmap_generated': return '🗺️';
    case 'profile_updated': return '👤';
    case 'streak_milestone': return '🔥';
    case 'achievement': return '🏆';
    default: return '📝';
  }
};

const getTimeAgo = (timestamp) => {
  const now = new Date();
  const activityTime = new Date(timestamp);
  const diffInMinutes = Math.floor((now - activityTime) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
};
