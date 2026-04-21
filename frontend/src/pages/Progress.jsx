import { useState, useEffect } from 'react';
import ProgressChart from '../components/ProgressChart';
import { calculateUserStats } from '../utils/statsCalculator';
import API from '../services/api';

const Progress = () => {
  const [progressData, setProgressData] = useState(null);
  const [timeframe, setTimeframe] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      fetchProgressData();
    }
  }, [timeframe]);

  const fetchProgressData = async () => {
    try {
      setLoading(true);

      // Get real user stats
      const userStats = calculateUserStats();

      // Generate dynamic weekly progress based on activity
      const activityLog = localStorage.getItem('activityLog');
      let weeklyProgress = [
        { label: 'Week 1', value: 0 },
        { label: 'Week 2', value: 0 },
        { label: 'Week 3', value: 0 },
        { label: 'Week 4', value: 0 }
      ];

      if (activityLog) {
        const activities = JSON.parse(activityLog);
        const now = new Date();

        // Calculate progress for each week
        for (let week = 0; week < 4; week++) {
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - (week + 1) * 7);
          const weekEnd = new Date(now);
          weekEnd.setDate(now.getDate() - week * 7);

          const weekActivities = activities.filter(activity => {
            const activityDate = new Date(activity.date);
            return activityDate >= weekStart && activityDate <= weekEnd;
          });

          weeklyProgress[3 - week].value = Math.min(weekActivities.length * 20, 100);
        }
      }

      // Get roadmap data for skills progress
      const roadmapData = localStorage.getItem('currentRoadmap');
      let skillsProgress = [
        { label: 'Getting Started', value: 0 },
        { label: 'Foundation', value: 0 },
        { label: 'Intermediate', value: 0 },
        { label: 'Advanced', value: 0 }
      ];

      if (roadmapData) {
        const roadmap = JSON.parse(roadmapData);
        const completedSteps = localStorage.getItem(`roadmap_${roadmap.id}_completed`);

        if (completedSteps && roadmap.content.phases) {
          const completed = JSON.parse(completedSteps);

          roadmap.content.phases.forEach((phase, phaseIndex) => {
            const phaseSteps = phase.steps.length;
            const phaseCompleted = completed.filter(stepId =>
              stepId.startsWith(`${phaseIndex}-`)
            ).length;

            const percentage = Math.round((phaseCompleted / phaseSteps) * 100);

            if (skillsProgress[phaseIndex]) {
              skillsProgress[phaseIndex] = {
                label: phase.title,
                value: percentage
              };
            }
          });
        }
      }

      const transformedData = {
        overall: {
          percentage: userStats.completedLessons > 0 ? Math.min(userStats.completedLessons * 5, 100) : 0,
          label: 'Overall Progress',
          description: 'Progress across your learning journey'
        },
        weeklyProgress,
        skillsProgress,
        timeSpent: userStats.timeSpentThisWeek,
        roadmapsCompleted: userStats.totalRoadmaps,
        currentStreak: userStats.currentStreak
      };

      setProgressData(transformedData);
    } catch (error) {
      console.error('Error fetching progress data:', error);
      // Fallback to basic data
      const userStats = calculateUserStats();
      setProgressData({
        overall: { percentage: 0, label: 'Overall Progress', description: 'Start your learning journey' },
        weeklyProgress: [
          { label: 'Week 1', value: 0 },
          { label: 'Week 2', value: 0 },
          { label: 'Week 3', value: 0 },
          { label: 'Week 4', value: 0 }
        ],
        skillsProgress: [
          { label: 'Getting Started', value: 0 },
          { label: 'Foundation', value: 0 },
          { label: 'Intermediate', value: 0 },
          { label: 'Advanced', value: 0 }
        ],
        timeSpent: userStats.timeSpentThisWeek,
        roadmapsCompleted: userStats.totalRoadmaps,
        currentStreak: userStats.currentStreak
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-xl">Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">📊 Your Progress</h1>
          <p className="text-gray-600 text-lg">Track your learning journey and achievements</p>
        </div>

        {/* Timeframe Selector */}
        <div className="mb-8">
          <div className="flex space-x-4">
            {['7d', '30d', '90d', '1y'].map((period) => (
              <button
                key={period}
                onClick={() => setTimeframe(period)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  timeframe === period
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                {period === '7d' ? 'Last 7 days' : 
                 period === '30d' ? 'Last 30 days' :
                 period === '90d' ? 'Last 3 months' : 'Last year'}
              </button>
            ))}
          </div>
        </div>

        {progressData && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Overall Progress</p>
                    <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{progressData.overall.percentage}%</p>
                  </div>
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">📈</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Time Spent</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{progressData.timeSpent}h</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">⏰</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Roadmaps</p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{progressData.roadmapsCompleted}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🗺️</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Current Streak</p>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{progressData.currentStreak} days</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🔥</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Weekly Progress */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Weekly Progress</h3>
                <ProgressChart data={progressData.weeklyProgress} type="line" />
              </div>

              {/* Skills Progress */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Skills Progress</h3>
                <ProgressChart data={progressData.skillsProgress} type="bar" />
              </div>
            </div>

            {/* Detailed Progress */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Learning Path Progress</h3>
              <div className="space-y-6">
                {progressData.skillsProgress.map((skill, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">{skill.label}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{skill.value}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${skill.value}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Progress;
