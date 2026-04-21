import multer from 'multer';
import express from 'express';
import { uploadResume } from '../controllers/resumeController.js';

const router = express.Router();
const upload = multer();

// 👇 This line is crucial: 'resume' must match the form field name
router.post('/upload', upload.single('resume'), uploadResume);

export default router;
