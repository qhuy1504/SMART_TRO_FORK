import express from 'express';
import { sendOTP, resetPassword, verifyOTP } from '../controllers/authController.js';

const router = express.Router();

// Route gửi OTP
router.post('/send-otp', sendOTP);

// Route xác minh OTP
router.post('/verify-otp', verifyOTP);

// Route đặt lại mật khẩu
router.post('/reset-password', resetPassword);

export default router;
