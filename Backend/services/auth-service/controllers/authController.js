import bcrypt from 'bcryptjs';
import { User, OTP } from '../../../schemas/index.js';
import { generateOTP, sendOTPEmail, sendPasswordChangeNotification } from '../emailService.js';

// Regex pattern cho mật khẩu mạnh
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Gửi OTP qua email
export const sendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        // Validate email
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email là bắt buộc'
            });
        }

        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Email không hợp lệ'
            });
        }

        // Kiểm tra email có tồn tại trong hệ thống không
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Email không tồn tại trong hệ thống'
            });
        }

        // Xóa OTP cũ nếu có
        await OTP.deleteMany({ email });

        // Tạo OTP mới
        const otp = generateOTP();
        
        // Lưu OTP vào database
        const newOTP = new OTP({
            email,
            otp
        });
        await newOTP.save();

        // Gửi email
        const emailResult = await sendOTPEmail(email, otp);
        
        if (emailResult.success) {
            res.status(200).json({
                success: true,
                message: 'Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.',
                data: {
                    email,
                    expiresIn: '5 phút'
                }
            });
        } else {
            // Xóa OTP nếu gửi email thất bại
            await OTP.deleteOne({ email, otp });
            res.status(500).json({
                success: false,
                message: 'Không thể gửi email. Vui lòng thử lại sau.'
            });
        }

    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Xác minh OTP và đặt lại mật khẩu
export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        // Validate input
        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                errors: ['Email, mã OTP và mật khẩu mới là bắt buộc']
            });
        }

        // Validate email format
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                errors: ['Email không hợp lệ']
            });
        }

        // Validate OTP format (6 digits)
        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                success: false,
                errors: ['Mã OTP phải là 6 chữ số']
            });
        }

        // Validate password strength
        if (!PASSWORD_REGEX.test(newPassword)) {
            return res.status(400).json({
                success: false,
                errors: ['Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&)']
            });
        }

        // Tìm OTP trong database
        const otpRecord = await OTP.findOne({ 
            email, 
            otp,
            verified: false
        });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                errors: ['Mã OTP không hợp lệ hoặc đã hết hạn']
            });
        }

        // Kiểm tra user tồn tại
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                errors: ['Email không tồn tại trong hệ thống']
            });
        }

        // Hash mật khẩu mới
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Cập nhật mật khẩu
        await User.findByIdAndUpdate(user._id, {
            password: hashedPassword,
            updatedAt: new Date()
        });

        // Đánh dấu OTP đã được sử dụng
        await OTP.findByIdAndUpdate(otpRecord._id, {
            verified: true
        });

        // Gửi email thông báo đổi mật khẩu thành công
        await sendPasswordChangeNotification(email, user.fullName);

        res.status(200).json({
            success: true,
            message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập với mật khẩu mới.',
            data: {
                email: user.email,
                fullName: user.fullName
            }
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Xác minh OTP (không đặt lại mật khẩu)
export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Validate input
        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                errors: ['Email và mã OTP là bắt buộc']
            });
        }

        // Validate OTP format
        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                success: false,
                errors: ['Mã OTP phải là 6 chữ số']
            });
        }

        // Tìm OTP
        const otpRecord = await OTP.findOne({
            email,
            otp,
            verified: false
        });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                errors: ['Mã OTP không hợp lệ hoặc đã hết hạn']
            });
        }

        res.status(200).json({
            success: true,
            message: 'Mã OTP hợp lệ',
            data: {
                email,
                otpId: otpRecord._id
            }
        });

    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};
