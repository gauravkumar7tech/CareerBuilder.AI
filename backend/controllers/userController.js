import User from '../models/User.js';
import Roadmap from '../models/Roadmap.js';
import Progress from '../models/Progress.js';

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user statistics
    const roadmapCount = await Roadmap.countDocuments({ userId });
    const completedRoadmaps = await Roadmap.countDocuments({ userId, status: 'completed' });
    const activeRoadmaps = await Roadmap.countDocuments({ userId, status: 'active' });
    
    // Get recent activity
    const recentRoadmaps = await Roadmap.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('title status progress createdAt updatedAt');
    
    const stats = {
      totalRoadmaps: roadmapCount,
      completedRoadmaps,
      activeRoadmaps,
      completionRate: roadmapCount > 0 ? Math.round((completedRoadmaps / roadmapCount) * 100) : 0
    };
    
    res.json({
      user,
      stats,
      recentActivity: recentRoadmaps
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updates.password;
    delete updates.email;
    delete updates.isVerified;
    delete updates.subscription;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ user, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

// Get user dashboard data
export const getUserDashboard = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user basic info
    const user = await User.findById(userId).select('name email profile lastLogin');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get roadmap statistics
    const totalRoadmaps = await Roadmap.countDocuments({ userId });
    const activeRoadmaps = await Roadmap.countDocuments({ userId, status: 'active' });
    const completedRoadmaps = await Roadmap.countDocuments({ userId, status: 'completed' });
    
    // Get recent roadmaps
    const recentRoadmaps = await Roadmap.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(3)
      .select('title status progress createdAt category interests');
    
    // Get progress data
    const progressData = await Progress.find({ userId })
      .populate('roadmapId', 'title category')
      .sort({ 'overallProgress.lastActivityDate': -1 })
      .limit(5);
    
    // Calculate overall statistics
    const totalTimeSpent = progressData.reduce((sum, p) => sum + (p.overallProgress.totalTimeSpent || 0), 0);
    const averageCompletion = progressData.length > 0 
      ? Math.round(progressData.reduce((sum, p) => sum + (p.overallProgress.completedWeeks / p.overallProgress.totalWeeks * 100), 0) / progressData.length)
      : 0;
    
    // Get current streak
    const currentStreak = progressData.length > 0 
      ? Math.max(...progressData.map(p => p.overallProgress.currentStreak || 0))
      : 0;
    
    const dashboardData = {
      user: {
        name: user.name,
        email: user.email,
        fullName: user.fullName,
        profilePicture: user.profile?.profilePicture,
        lastLogin: user.lastLogin
      },
      statistics: {
        totalRoadmaps,
        activeRoadmaps,
        completedRoadmaps,
        completionRate: totalRoadmaps > 0 ? Math.round((completedRoadmaps / totalRoadmaps) * 100) : 0,
        totalTimeSpent: Math.round(totalTimeSpent / 60), // Convert to hours
        averageCompletion,
        currentStreak
      },
      recentRoadmaps,
      recentProgress: progressData.slice(0, 3)
    };
    
    res.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
};

// Update user preferences
export const updateUserPreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    const { preferences } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { preferences, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('preferences');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ preferences: user.preferences, message: 'Preferences updated successfully' });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ message: 'Failed to update preferences' });
  }
};

// Add user skill
export const addUserSkill = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, level, category } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if skill already exists
    const existingSkill = user.skills.find(skill => skill.name.toLowerCase() === name.toLowerCase());
    if (existingSkill) {
      return res.status(400).json({ message: 'Skill already exists' });
    }
    
    user.skills.push({ name, level, category });
    await user.save();
    
    res.json({ skills: user.skills, message: 'Skill added successfully' });
  } catch (error) {
    console.error('Error adding skill:', error);
    res.status(500).json({ message: 'Failed to add skill' });
  }
};

// Update user skill
export const updateUserSkill = async (req, res) => {
  try {
    const { userId, skillId } = req.params;
    const updates = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const skill = user.skills.id(skillId);
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }
    
    Object.assign(skill, updates);
    await user.save();
    
    res.json({ skills: user.skills, message: 'Skill updated successfully' });
  } catch (error) {
    console.error('Error updating skill:', error);
    res.status(500).json({ message: 'Failed to update skill' });
  }
};

// Delete user skill
export const deleteUserSkill = async (req, res) => {
  try {
    const { userId, skillId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.skills.id(skillId).remove();
    await user.save();
    
    res.json({ skills: user.skills, message: 'Skill deleted successfully' });
  } catch (error) {
    console.error('Error deleting skill:', error);
    res.status(500).json({ message: 'Failed to delete skill' });
  }
};

// Get user analytics
export const getUserAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeframe = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    // Get roadmaps created in timeframe
    const roadmapsCreated = await Roadmap.find({
      userId,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: 1 });
    
    // Get progress data
    const progressData = await Progress.find({ userId })
      .populate('roadmapId', 'title category');
    
    // Calculate analytics
    const analytics = {
      roadmapsCreated: roadmapsCreated.length,
      categoriesExplored: [...new Set(roadmapsCreated.map(r => r.category))].length,
      totalTimeSpent: progressData.reduce((sum, p) => sum + (p.overallProgress.totalTimeSpent || 0), 0),
      averageCompletionRate: progressData.length > 0 
        ? Math.round(progressData.reduce((sum, p) => sum + (p.overallProgress.completedWeeks / p.overallProgress.totalWeeks * 100), 0) / progressData.length)
        : 0,
      roadmapsByCategory: roadmapsCreated.reduce((acc, roadmap) => {
        acc[roadmap.category] = (acc[roadmap.category] || 0) + 1;
        return acc;
      }, {}),
      progressOverTime: roadmapsCreated.map(roadmap => ({
        date: roadmap.createdAt,
        category: roadmap.category,
        title: roadmap.title
      }))
    };
    
    res.json({ analytics, timeframe });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
};
