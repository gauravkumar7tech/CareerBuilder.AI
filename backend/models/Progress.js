import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roadmapId: { type: mongoose.Schema.Types.ObjectId, ref: 'Roadmap', required: true },
  
  // Weekly Progress
  weeklyProgress: [{
    week: { type: Number, required: true },
    status: { type: String, enum: ['not_started', 'in_progress', 'completed'], default: 'not_started' },
    startDate: { type: Date },
    completedDate: { type: Date },
    timeSpent: { type: Number, default: 0 }, // in minutes
    
    // Completed Resources
    completedResources: [{
      resourceId: { type: String },
      title: { type: String },
      completedDate: { type: Date, default: Date.now },
      rating: { type: Number, min: 1, max: 5 },
      notes: { type: String }
    }],
    
    // Completed Projects
    completedProjects: [{
      projectId: { type: String },
      title: { type: String },
      completedDate: { type: Date, default: Date.now },
      githubUrl: { type: String },
      liveUrl: { type: String },
      description: { type: String },
      technologies: [{ type: String }],
      rating: { type: Number, min: 1, max: 5 }
    }],
    
    // Weekly Notes & Reflections
    notes: { type: String },
    challenges: [{ type: String }],
    achievements: [{ type: String }],
    nextWeekGoals: [{ type: String }]
  }],
  
  // Overall Progress
  overallProgress: {
    totalTimeSpent: { type: Number, default: 0 }, // in minutes
    completedWeeks: { type: Number, default: 0 },
    totalWeeks: { type: Number, default: 12 },
    currentStreak: { type: Number, default: 0 }, // consecutive days of activity
    longestStreak: { type: Number, default: 0 },
    lastActivityDate: { type: Date }
  },
  
  // Skills Development
  skillsProgress: [{
    skillName: { type: String, required: true },
    initialLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
    currentLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
    targetLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
    progressPercentage: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  }],
  
  // Achievements & Badges
  achievements: [{
    type: { type: String, required: true }, // e.g., 'first_week_completed', 'streak_7_days'
    title: { type: String, required: true },
    description: { type: String },
    earnedDate: { type: Date, default: Date.now },
    icon: { type: String } // icon name or URL
  }],
  
  // Learning Analytics
  analytics: {
    averageTimePerWeek: { type: Number, default: 0 },
    preferredLearningDays: [{ type: String }], // ['monday', 'tuesday', etc.]
    mostProductiveTime: { type: String }, // 'morning', 'afternoon', 'evening'
    learningPattern: { type: String }, // 'consistent', 'weekend_warrior', 'intensive'
    completionRate: { type: Number, default: 0 } // percentage of started tasks completed
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for current week progress
progressSchema.virtual('currentWeekProgress').get(function() {
  const currentWeek = this.overallProgress.completedWeeks + 1;
  return this.weeklyProgress.find(week => week.week === currentWeek);
});

// Virtual for completion percentage
progressSchema.virtual('completionPercentage').get(function() {
  return Math.round((this.overallProgress.completedWeeks / this.overallProgress.totalWeeks) * 100);
});

// Method to update streak
progressSchema.methods.updateStreak = function() {
  const today = new Date();
  const lastActivity = this.overallProgress.lastActivityDate;
  
  if (lastActivity) {
    const daysDiff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      // Consecutive day
      this.overallProgress.currentStreak += 1;
      if (this.overallProgress.currentStreak > this.overallProgress.longestStreak) {
        this.overallProgress.longestStreak = this.overallProgress.currentStreak;
      }
    } else if (daysDiff > 1) {
      // Streak broken
      this.overallProgress.currentStreak = 1;
    }
    // If daysDiff === 0, same day activity, don't change streak
  } else {
    // First activity
    this.overallProgress.currentStreak = 1;
    this.overallProgress.longestStreak = 1;
  }
  
  this.overallProgress.lastActivityDate = today;
  return this.save();
};

// Method to add achievement
progressSchema.methods.addAchievement = function(type, title, description, icon) {
  // Check if achievement already exists
  const existingAchievement = this.achievements.find(ach => ach.type === type);
  if (!existingAchievement) {
    this.achievements.push({ type, title, description, icon });
    return this.save();
  }
  return Promise.resolve(this);
};

// Indexes for better performance
progressSchema.index({ userId: 1, roadmapId: 1 }, { unique: true });
progressSchema.index({ 'overallProgress.lastActivityDate': -1 });
progressSchema.index({ 'overallProgress.completedWeeks': -1 });

export default mongoose.model('Progress', progressSchema);
