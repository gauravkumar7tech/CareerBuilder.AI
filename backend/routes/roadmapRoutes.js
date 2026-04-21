import express from 'express';
import {
  generateRoadmap,
  getUserRoadmaps,
  getRoadmap,
  updateRoadmap,
  deleteRoadmap
} from '../controllers/roadmapController.js';

const router = express.Router();

// Generate new roadmap
router.post('/generate', generateRoadmap);

// Get user's roadmaps (must come before /:roadmapId to avoid conflicts)
router.get('/user/:userId', getUserRoadmaps);

// Update roadmap
router.put('/:roadmapId', updateRoadmap);

// Delete roadmap
router.delete('/:roadmapId', deleteRoadmap);

// Get specific roadmap (must come last to avoid conflicts with other routes)
router.get('/:roadmapId', getRoadmap);

export default router;
