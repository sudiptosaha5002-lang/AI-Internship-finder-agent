import express from 'express';
import multer from 'multer';
import { parseResume, generateQuestions, evaluateAnswer, saveInterviewAnalytics } from '../controllers/interviewController.js';

const router = express.Router();

// Setup Multer for memory storage (for pdf parsing)
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload-resume', upload.single('resume'), parseResume);
router.post('/generate-questions', generateQuestions);
router.post('/evaluate-response', evaluateAnswer);
router.post('/save-analytics', saveInterviewAnalytics);

export default router;
