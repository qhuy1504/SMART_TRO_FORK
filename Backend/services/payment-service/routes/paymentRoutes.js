/**
 * Payment Routes - Routes cho thanh toán
 */
import express from 'express';
import paymentController from '../controllers/paymentController.js';
import authMiddleware from '../../shared/middleware/authMiddleware.js';
import sepayAuth from '../middleware/sepayAuth.js';

const router = express.Router();

// Tạo đơn hàng thanh toán (yêu cầu auth)
router.post('/create-order', authMiddleware, paymentController.createPaymentOrder);

// Kiểm tra trạng thái thanh toán (yêu cầu auth)
router.get('/status/:orderId', authMiddleware, paymentController.checkPaymentStatus);

// Webhook SePay (yêu cầu xác thực API key)
router.post('/sepay/webhook', sepayAuth, paymentController.sepayWebhook);

export default router;
