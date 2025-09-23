import express from 'express';
import chatbotController from '../controllers/chatbotController.js';
import authMiddleware from '../../shared/middleware/authMiddleware.js';
import optionalAuthMiddleware from '../../shared/middleware/optionalAuthMiddleware.js';

const router = express.Router();

// Routes cho chatbot - sử dụng optional auth để hỗ trợ cả anonymous và authenticated users
router.post('/message', optionalAuthMiddleware, chatbotController.processMessage);
router.post('/chat', optionalAuthMiddleware, chatbotController.processGuidedChat);


export default router;
