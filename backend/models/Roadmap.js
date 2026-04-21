import mongoose from 'mongoose';

const weeklyGoalSchema = new mongoose.Schema({
  week: { type: Number, required: true, min: 1, max: 52 },
  title: { type: String, required: true },
  description: { type: String },
  skills: [{ type: String }],
  resources: [{
    title: { type: String, required: true },
    url: { type: String },
    type: { type: String, enum: ['video', 'article', 'course', 'documentation', 'book', 'project'] },
    duration: { type: String }, // e.g., "2 hours", "1 week"
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'] }
  }],
  projects: [{
    title: { type: String, required: true },
    description: { type: String },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
    estimatedTime: { type: String },
    technologies: [{ type: String }]
  }],
  milestones: [{ type: String }],
  isCompleted: { type: Boolean, default: false },
  completedDate: { type: Date },
  notes: { type: String }
});

const roadmapSchema = new mongoose.Schema({
  // Basic Information
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },

  // Roadmap Content
  interests: [{ type: String, required: true }],
  targetRole: { type: String, trim: true },
  experienceLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  duration: { type: Number, default: 12 }, // weeks

  // AI Generation Info
  generatedBy: { type: String, enum: ['ai', 'template'], default: 'ai' },
  aiModel: { type: String, default: 'gemini-pro' },
  prompt: { type: String }, // Store the prompt used for generation

  // Roadmap Structure
  weeklyGoals: [weeklyGoalSchema],
  overallGoals: [{ type: String }],
  prerequisites: [{ type: String }],

  // Progress Tracking
  progress: {
    currentWeek: { type: Number, default: 1 },
    completedWeeks: { type: Number, default: 0 },
    totalWeeks: { type: Number, default: 12 },
    percentageComplete: { type: Number, default: 0 },
    startDate: { type: Date },
    estimatedEndDate: { type: Date },
    actualEndDate: { type: Date }
  },

  // Metadata
  tags: [{ type: String }],
  category: { type: String }, // e.g., 'web-development', 'data-science', 'mobile-development'
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },

  // Status & Sharing
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'paused', 'archived'],
    default: 'active'
  },
  isPublic: { type: Boolean, default: false },
  shareableLink: { type: String, unique: true, sparse: true },

  // Analytics
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },

  // Version Control
  version: { type: Number, default: 1 },
  parentRoadmap: { type: mongoose.Schema.Types.ObjectId, ref: 'Roadmap' },

  // Raw Content (for backward compatibility)
  rawContent: { type: String }, // Original AI-generated text
  resumeText: String, // Keep for backward compatibility
  roadmapText: String, // Keep for backward compatibility

  // User Customizations
  customizations: [{
    type: { type: String, enum: ['week_added', 'week_removed', 'week_modified', 'resource_added', 'note_added'] },
    description: { type: String },
    date: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for completion percentage
roadmapSchema.virtual('completionPercentage').get(function() {
  if (this.weeklyGoals.length === 0) return 0;
  const completedWeeks = this.weeklyGoals.filter(week => week.isCompleted).length;
  return Math.round((completedWeeks / this.weeklyGoals.length) * 100);
});

// Indexes for better performance
roadmapSchema.index({ userId: 1, createdAt: -1 });
roadmapSchema.index({ status: 1 });
roadmapSchema.index({ category: 1 });
roadmapSchema.index({ isPublic: 1, likes: -1 });

export default mongoose.model('Roadmap', roadmapSchema);
