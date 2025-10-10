import express from 'express';
import paymentHistoryController from '../controllers/paymentHistoryController.js';
import authMiddleware from '../../shared/middleware/authMiddleware.js';

const router = express.Router();

// Middleware xác thực cho tất cả routes
router.use(authMiddleware);

// Routes
router.get('/', paymentHistoryController.getPaymentHistory);
router.get('/:orderId', paymentHistoryController.getOrderDetail);

export default router;
