import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  getUserDashboard,
  updateUserPreferences,
  addUserSkill,
  updateUserSkill,
  deleteUserSkill,
  getUserAnalytics
} from '../controllers/userController.js';

const router = express.Router();

// Get user profile
router.get('/:userId/profile', getUserProfile);

// Update user profile
router.put('/:userId/profile', updateUserProfile);

// Get user dashboard data
router.get('/:userId/dashboard', getUserDashboard);

// Update user preferences
router.put('/:userId/preferences', updateUserPreferences);

// Skills management
router.post('/:userId/skills', addUserSkill);
router.put('/:userId/skills/:skillId', updateUserSkill);
router.delete('/:userId/skills/:skillId', deleteUserSkill);

// Get user analytics
router.get('/:userId/analytics', getUserAnalytics);

export default router;
