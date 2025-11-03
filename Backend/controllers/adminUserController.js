import User from '../schemas/User.js';

// Get all users with filters
export const getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, role, status, search } = req.query;
        
        // Build filter query
        const filter = {};
        
        if (role && role !== 'all') {
            filter.role = role;
        }
        
        if (status && status !== 'all') {
            filter.status = status;
        }
        
        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phoneNumber: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Get total count
        const total = await User.countDocuments(filter);
        
        // Get paginated users
        const users = await User.find(filter)
            .select('fullName email phoneNumber avatar role status createdAt')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        
        // Get statistics
        const stats = {
            total: await User.countDocuments(),
            landlord: await User.countDocuments({ role: 'landlord' }),
            user: await User.countDocuments({ role: 'user' }),
            admin: await User.countDocuments({ role: 'admin' }),
            active: await User.countDocuments({ status: 'active' }),
            blocked: await User.countDocuments({ status: 'blocked' })
        };
        
        res.status(200).json({
            success: true,
            data: {
                users,
                stats,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalUsers: total,
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách người dùng',
            error: error.message
        });
    }
};

// Toggle block/unblock user
export const toggleBlockUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }
        
        // Don't allow blocking admin users
        if (user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Không thể khóa tài khoản quản trị viên'
            });
        }
        
        // Toggle status
        user.status = user.status === 'active' ? 'blocked' : 'active';
        await user.save();
        
        res.status(200).json({
            success: true,
            message: user.status === 'blocked' ? 'Đã khóa người dùng' : 'Đã mở khóa người dùng',
            data: {
                userId: user._id,
                status: user.status
            }
        });
    } catch (error) {
        console.error('Error toggling block user:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thay đổi trạng thái người dùng',
            error: error.message
        });
    }
};

// Get user details
export const getUserDetails = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId)
            .select('-password')
            .populate('properties', 'title status')
            .populate('contracts', 'contractNumber status');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }
        
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error getting user details:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin người dùng',
            error: error.message
        });
    }
};

// Update user role
export const updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;
        
        if (!['user', 'landlord', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Vai trò không hợp lệ'
            });
        }
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }
        
        user.role = role;
        await user.save();
        
        res.status(200).json({
            success: true,
            message: 'Đã cập nhật vai trò người dùng',
            data: {
                userId: user._id,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật vai trò người dùng',
            error: error.message
        });
    }
};
