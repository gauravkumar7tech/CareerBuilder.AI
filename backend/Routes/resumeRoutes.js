import multer from 'multer';
import express from 'express';
import { uploadResume } from '../controllers/resumecontrollers.js';

const router  = express.Router();

const upload = multer();

router.post('/upload',upload.single('resume'),uploadResume);

export default router;