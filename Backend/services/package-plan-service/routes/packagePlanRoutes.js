/**
 * Package Plan Routes - Routes cho quản lý gói tin đăng
 */
import express from 'express';
import packagePlanController from '../controllers/packagePlanController.js';
import authMiddleware from '../../shared/middleware/authMiddleware.js';

const router = express.Router();

// Lấy danh sách các gói tin (public)
router.get('/plans', packagePlanController.getPackagePlans);

// Lấy thông tin chi tiết một gói (public)
router.get('/plans/:planId', packagePlanController.getPackagePlanById);

// Lấy danh sách loại tin để tạo gói (public)
router.get('/properties-packages', packagePlanController.getPropertiesPackages);

// Admin: Lấy tất cả gói tin (bao gồm inactive)
router.get('/admin/plans', authMiddleware, packagePlanController.getAllPackagePlans);

// Admin: Khởi tạo gói tin mặc định
router.post('/initialize-default', authMiddleware, packagePlanController.initializeDefaultPackages);

// Admin: Tạo gói tin mới
router.post('/plans', authMiddleware, packagePlanController.createPackagePlan);

// Admin: Cập nhật gói tin
router.put('/plans/:planId', authMiddleware, packagePlanController.updatePackagePlan);

// Admin: Xóa gói tin
router.delete('/plans/:planId', authMiddleware, packagePlanController.deletePackagePlan);

// Admin: Toggle trạng thái gói tin
router.patch('/plans/:planId/status', authMiddleware, packagePlanController.togglePackagePlanStatus);

export default router;
