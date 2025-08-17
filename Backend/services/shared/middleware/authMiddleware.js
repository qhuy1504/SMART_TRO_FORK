/**
 * Auth Middleware - Xác thực JWT token
 */
import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
    try {
        if (process.env.BYPASS_AUTH === 'true') {
            const defaultId = process.env.DEFAULT_LANDLORD_ID || null;
            req.user = { userId: defaultId, role: 'landlord', bypass: true };
            return next();
        }
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        req.user = decoded;
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
