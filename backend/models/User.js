import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  // Basic Information
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },

  // Profile Information
  profile: {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    phone: { type: String, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer-not-to-say'] },
    location: {
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true }
    },
    bio: { type: String, maxlength: 500 },
    profilePicture: { type: String }, // URL to profile image
    socialLinks: {
      linkedin: { type: String, trim: true },
      github: { type: String, trim: true },
      portfolio: { type: String, trim: true },
      twitter: { type: String, trim: true }
    }
  },

  // Education & Career
  education: [{
    institution: { type: String, required: true },
    degree: { type: String, required: true },
    field: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    grade: { type: String },
    description: { type: String }
  }],

  experience: [{
    company: { type: String, required: true },
    position: { type: String, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    current: { type: Boolean, default: false },
    description: { type: String },
    skills: [{ type: String }]
  }],

  // Skills & Interests
  skills: [{
    name: { type: String, required: true },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
    category: { type: String } // e.g., 'programming', 'design', 'management'
  }],

  interests: [{ type: String }],
  careerGoals: { type: String, maxlength: 1000 },

  // Resume Data
  resume: {
    fileName: { type: String },
    filePath: { type: String },
    uploadDate: { type: Date },
    extractedText: { type: String },
    fileSize: { type: Number },
    mimeType: { type: String }
  },

  // Account Settings
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'light' },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' }
  },

  // Account Status
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  lastLogin: { type: Date },
  loginCount: { type: Number, default: 0 },

  // Subscription/Plan (for future monetization)
  subscription: {
    plan: { type: String, enum: ['free', 'premium', 'enterprise'], default: 'free' },
    startDate: { type: Date },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  if (this.profile?.firstName && this.profile?.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.name;
});

// Virtual for age
userSchema.virtual('age').get(function() {
  if (this.profile?.dateOfBirth) {
    return Math.floor((Date.now() - this.profile.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }
  return null;
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Update login info
userSchema.methods.updateLoginInfo = function() {
  this.lastLogin = new Date();
  this.loginCount += 1;
  return this.save();
};

// Compare password for login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Get public profile (exclude sensitive data)
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.preferences;
  delete userObject.subscription;
  return userObject;
};

// Indexes for better performance (email index is already created by unique: true)
userSchema.index({ 'profile.firstName': 1, 'profile.lastName': 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLogin: -1 });

export default mongoose.model('User', userSchema);
