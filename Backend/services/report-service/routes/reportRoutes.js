import express from 'express';
import {
  reportProperty,
  getPropertyReports,
  handlePropertyReport,
  getReportDetail,
  getReportStats
} from '../controllers/reportController.js';
import { authenticateToken } from '../../../shared/middleware/auth.js';
import authMiddleware from '../../shared/middleware/authMiddleware.js';

const router = express.Router();

// Routes công khai (không cần đăng nhập)
// Báo cáo tin đăng
router.post('/property/:propertyId', reportProperty);

// Routes dành cho admin (cần đăng nhập và quyền admin)
// Lấy danh sách báo cáo
router.get('/property', authMiddleware, getPropertyReports);

// Lấy chi tiết báo cáo
router.get('/property/:reportId/detail', authMiddleware, getReportDetail);

// Xử lý báo cáo (approve, reject, reviewing)
router.put('/property/:reportId/handle', authMiddleware, handlePropertyReport);

// Thống kê báo cáo
router.get('/stats', authMiddleware, getReportStats);

export default router;
