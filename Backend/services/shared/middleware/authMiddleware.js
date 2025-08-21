/**
 * Auth Middleware - Xác thực JWT token
 */
import jwt from 'jsonwebtoken';
import LoginSession from '../../../schemas/LoginSession.js';

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        
        // Cập nhật last activity nếu có sessionToken
        if (decoded.sessionToken) {
            // Cập nhật last activity (không await để không làm chậm request)
            LoginSession.updateOne(
                { sessionToken: decoded.sessionToken, isActive: true },
                { $set: { lastActivity: new Date() } }
            ).catch(err => console.error('Failed to update last activity:', err));
        }
        
        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token đã hết hạn'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Token không hợp lệ'
        });
    }
};

export default authMiddleware;
