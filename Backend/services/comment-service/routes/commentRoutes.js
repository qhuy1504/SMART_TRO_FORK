import express from 'express';
import {
  createComment,
  getCommentsByProperty,
  updateComment,
  deleteComment,
  toggleLike,
  getCommentStats,
  getUserRecentComments,
  getPropertyCommentsCount
} from '../controllers/commentController.js';
import authMiddleware from '../../shared/middleware/authMiddleware.js';

const router = express.Router();

// Routes cho comments theo property
router.get('/property/:propertyId', getCommentsByProperty);
router.get('/property/:propertyId/stats', getCommentStats);
router.get('/property/:propertyId/count', getPropertyCommentsCount);
router.post('/property/:propertyId', authMiddleware, createComment);

// Routes cho comment operations
router.put('/:commentId', authMiddleware, updateComment);
router.delete('/:commentId', authMiddleware, deleteComment);
router.post('/:commentId/like', authMiddleware, toggleLike);

// Routes cho user
router.get('/user/recent', authMiddleware, getUserRecentComments);

export default router;
