/**
 * User Routes - Định nghĩa API endpoints
 */
import express from 'express';
import userController from '../controllers/userController.js';
import upload from '../upload.js';
import authMiddleware from '../../shared/middleware/authMiddleware.js';
import adminMiddleware from '../../shared/middleware/adminMiddleware.js';
import validationMiddleware from '../../shared/middleware/validationMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', 
    upload.single('avatar'),
    validationMiddleware.validateRegister,
    userController.register
);

// Lấy user mặc định (landlord) để hiển thị khi chưa đăng nhập
router.get('/default', userController.getDefaultUser);

// Xác thực email
router.get('/verify-email', userController.verifyEmail);

router.post('/login', 
    validationMiddleware.validateLogin,
    userController.login
);

// Protected routes (require authentication)
router.get('/profile', 
    authMiddleware,
    userController.getProfile
);

router.put('/profile', 
    authMiddleware,
    upload.single('avatar'),
    validationMiddleware.validateUpdateProfile,
    userController.updateProfile
);

// Đổi mật khẩu (require authentication)
router.put('/change-password', 
    authMiddleware,
    userController.changePassword
);

// Session Management Routes
// Lấy danh sách phiên đăng nhập hiện tại
router.get('/sessions/active', 
    authMiddleware,
    userController.getActiveSessions
);

// Lấy lịch sử đăng nhập
router.get('/sessions/history', 
    authMiddleware,
    userController.getLoginHistory
);

// Đăng xuất phiên cụ thể
router.delete('/sessions/:sessionId', 
    authMiddleware,
    userController.logoutSession
);

// Đăng xuất tất cả phiên khác
router.post('/sessions/logout-others', 
    authMiddleware,
    userController.logoutAllOtherSessions
);

// Admin only routes
router.get('/', 
    authMiddleware,
    adminMiddleware,
    userController.getUsers
);

router.get('/:id', 
    authMiddleware,
    adminMiddleware,
    userController.getUserById
);

export default router;
