import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Tạo transporter với Gmail
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER, // Email Gmail
            pass: process.env.GMAIL_APP_PASSWORD // App Password từ Gmail
        }
    });
};

// Tạo OTP ngẫu nhiên
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // OTP 6 chữ số
};

// Gửi email OTP
export const sendOTPEmail = async (email, otp) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: email,
            subject: 'Mã OTP khôi phục mật khẩu - Smart Trọ',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333; text-align: center;">Smart Trọ</h2>
                    <h3 style="color: #007bff;">Khôi phục mật khẩu</h3>
                    <p>Xin chào,</p>
                    <p>Bạn đã yêu cầu khôi phục mật khẩu cho tài khoản của mình.</p>
                    <p>Mã OTP của bạn là:</p>
                    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
                    </div>
                    <p style="color: #dc3545; font-weight: bold;">Mã OTP này chỉ có hiệu lực trong 5 phút.</p>
                    <p>Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này.</p>
                    <hr style="border: none; height: 1px; background-color: #eee; margin: 20px 0;">
                    <p style="color: #666; font-size: 14px;">Trân trọng,<br>Đội ngũ Smart Trọ</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
};

// Gửi email thông báo đổi mật khẩu thành công
export const sendPasswordChangeNotification = async (email, fullName) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: email,
            subject: 'Thông báo thay đổi mật khẩu - Smart Trọ',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333; text-align: center;">Smart Trọ</h2>
                    <h3 style="color: #28a745;">Mật khẩu đã được thay đổi thành công!</h3>
                    <p>Xin chào <strong>${fullName}</strong>,</p>
                    <p>Mật khẩu tài khoản của bạn đã được thay đổi thành công vào lúc ${new Date().toLocaleString('vi-VN')}.</p>
                    <div style="background-color: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
                        <p style="margin: 0; color: #155724;">✅ Tài khoản của bạn hiện đã được bảo mật với mật khẩu mới.</p>
                    </div>
                    <p>Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ với chúng tôi ngay lập tức.</p>
                    <hr style="border: none; height: 1px; background-color: #eee; margin: 20px 0;">
                    <p style="color: #666; font-size: 14px;">Trân trọng,<br>Đội ngũ Smart Trọ</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Password change notification sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending password change notification:', error);
        return { success: false, error: error.message };
    }
};

// Gửi email xác thực tài khoản (verification email)
export const sendVerificationEmail = async (email, fullName, verificationToken) => {
    try {
        const transporter = createTransporter();
        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
        
        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: email,
            subject: 'Xác thực tài khoản - Smart Trọ',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333; text-align: center;">Smart Trọ</h2>
                    <h3 style="color: #007bff;">Chào mừng bạn đến với Smart Trọ!</h3>
                    <p>Xin chào <strong>${fullName}</strong>,</p>
                    <p>Cảm ơn bạn đã đăng ký tài khoản tại Smart Trọ. Để hoàn tất quá trình đăng ký, vui lòng xác thực email của bạn.</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationUrl}" 
                           style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                            🔗 Xác Thực Tài Khoản
                        </a>
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">
                        Nếu nút không hoạt động, bạn có thể copy link sau vào trình duyệt:<br>
                        <a href="${verificationUrl}" style="color: #007bff; word-break: break-all;">${verificationUrl}</a>
                    </p>
                    
                    <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                        <p style="margin: 0; color: #856404;">
                            ⚠️ <strong>Lưu ý:</strong> Link xác thực này có hiệu lực trong 24 giờ. Sau khi xác thực thành công, bạn sẽ được tự động đăng nhập.
                        </p>
                    </div>
                    
                    <p>Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email này.</p>
                    <hr style="border: none; height: 1px; background-color: #eee; margin: 20px 0;">
                    <p style="color: #666; font-size: 14px;">Trân trọng,<br>Đội ngũ Smart Trọ</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Verification email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending verification email:', error);
        return { success: false, error: error.message };
    }
};

// Gửi email cảnh báo tới chủ bài đăng
export const sendWarningEmail = async ({ to, ownerName, propertyTitle, reason, reportReason }) => {
      const getReasonInVietnamese = (reason) => {
        const reasonMapping = {
            'fake': 'Tin đăng giả mạo',
            'inappropriate': 'Nội dung không phù hợp',
            'spam': 'Spam hoặc lừa đảo',
            'duplicate': 'Tin đăng trùng lặp',
            'price': 'Giá cả không chính xác',
            'other': 'Lý do khác',
            // Fallback for existing Vietnamese reasons
            'Tin đăng giả mạo': 'Tin đăng giả mạo',
            'Nội dung không phù hợp': 'Nội dung không phù hợp',
            'Spam hoặc lừa đảo': 'Spam hoặc lừa đảo',
            'Tin đăng trùng lặp': 'Tin đăng trùng lặp',
            'Giá cả không chính xác': 'Giá cả không chính xác',
            'Lý do khác': 'Lý do khác'
        };

        return reasonMapping[reason] || reason;
    };
        
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: to,
            subject: 'Cảnh báo về bài đăng của bạn - Smart Trọ',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333; text-align: center;">Smart Trọ</h2>
                    <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0;">
                        <h3 style="color: #856404; margin-top: 0;">⚠️ Cảnh báo về bài đăng</h3>
                    </div>
                    
                    <p>Xin chào <strong>${ownerName}</strong>,</p>
                    <p>Chúng tôi nhận được báo cáo về bài đăng của bạn và cần thông báo đến bạn về vấn đề này.</p>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h2 style="color: #495057; margin-top: 0;">📋 Thông tin bài đăng:</h2>
                        <p><strong>Tiêu đề:</strong> ${propertyTitle}</p>
                        <p><strong>Lý do báo cáo:</strong> ${getReasonInVietnamese(reportReason)}</p>
                    </div>
                    
                    <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
                        <h2 style="color: #721c24; margin-top: 0;"> Lý do cảnh báo:</h2>
                        <p style="color: #721c24; margin: 0;">${reason}</p>
                    </div>

                    <h2 style="color: #007bff;">Hành động cần thiết:</h2>
                    <ul style="color: #495057;">
                        <li>Vui lòng kiểm tra và chỉnh sửa nội dung bài đăng để tuân thủ quy định</li>
                        <li>Đảm bảo thông tin chính xác và không vi phạm chính sách</li>
                        <li>Nếu có thắc mắc, vui lòng liên hệ bộ phận hỗ trợ</li>
                    </ul>
                    
                    <div style="background-color: #d1ecf1; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
                        <p style="margin: 0; color: #0c5460;">
                            ℹ️ <strong>Lưu ý:</strong> Đây là cảnh báo đầu tiên. Nếu tiếp tục vi phạm, bài đăng có thể bị xóa khỏi hệ thống.
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL}/profile/my-posts" 
                           style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                            Chỉnh sửa bài đăng
                        </a>
                    </div>
                    
                    <hr style="border: none; height: 1px; background-color: #eee; margin: 20px 0;">
                    <p style="color: #666; font-size: 14px;">
                        Cảm ơn bạn đã hợp tác cùng Smart Trọ.<br>
                        Đội ngũ hỗ trợ Smart Trọ
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Warning email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending warning email:', error);
        return { success: false, error: error.message };
    }
};

// Gửi email thông báo bài đăng bị xóa
export const sendPropertyHiddenEmail = async ({ to, ownerName, propertyTitle, reason, reportReason }) => {
        const getReasonInVietnamese = (reason) => {
        const reasonMapping = {
            'fake': 'Tin đăng giả mạo',
            'inappropriate': 'Nội dung không phù hợp',
            'spam': 'Spam hoặc lừa đảo',
            'duplicate': 'Tin đăng trùng lặp',
            'price': 'Giá cả không chính xác',
            'other': 'Lý do khác',
        };

        return reasonMapping[reason] || reason;
    };
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: to,
            subject: 'Bài đăng của bạn đã bị xóa - Smart Trọ',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333; text-align: center;">Smart Trọ</h2>
                    <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; border-left: 4px solid #dc3545; margin: 20px 0;">
                        <h3 style="color: #721c24; margin-top: 0;">Bài đăng đã bị xóa</h3>
                    </div>
                    
                    <p>Xin chào <strong>${ownerName}</strong>,</p>
                    <p>Chúng tôi rất tiếc phải thông báo rằng bài đăng của bạn đã bị xóa khỏi hệ thống do vi phạm chính sách.</p>

                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h4 style="color: #495057; margin-top: 0;">Thông tin bài đăng bị xóa:</h4>
                        <p><strong>Tiêu đề:</strong> ${propertyTitle}</p>
                        <p><strong>Lý do báo cáo:</strong> ${getReasonInVietnamese(reportReason)}</p>
                        <p><strong>Trạng thái:</strong> <span style="color: #dc3545; font-weight: bold;">Đã bị xóa</span></p>
                    </div>
                    
                    <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
                        <h2 style="color: #721c24; margin-top: 0;">Lý do xóa bài đăng:</h2>
                        <p style="color: #721c24; margin: 0;">${reason}</p>
                    </div>
                    
                    <h4 style="color: #dc3545;">Hậu quả:</h4>
                    <ul style="color: #495057;">
                        <li>Bài đăng không còn hiển thị công khai trên hệ thống</li>
                        <li>Người dùng khác không thể tìm kiếm hoặc xem bài đăng này</li>
                        <li>Bài đăng sẽ được đánh dấu là "đã xóa" trong quản lý của bạn</li>
                    </ul>
                    
                    <h4 style="color: #007bff;">📞 Liên hệ hỗ trợ:</h4>
                    <p style="color: #495057;">
                        Nếu bạn cho rằng đây là sự nhầm lẫn hoặc cần hỗ trợ thêm, vui lòng liên hệ:
                    </p>
                    <ul style="color: #495057;">
                        <li>Email: support@smarttro.com</li>
                        <li>Hotline: 1900-1234</li>
                    </ul>
                    
                    <div style="background-color: #d1ecf1; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
                        <p style="margin: 0; color: #0c5460;">
                            ℹ️ <strong>Lưu ý:</strong> Để tránh các vi phạm trong tương lai, vui lòng đọc kỹ quy định và chính sách của Smart Trọ trước khi đăng bài mới.
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL}/profile/my-posts" 
                           style="background-color: #6c757d; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                            📋 Xem bài đăng của tôi
                        </a>
                    </div>
                    
                    <hr style="border: none; height: 1px; background-color: #eee; margin: 20px 0;">
                    <p style="color: #666; font-size: 14px;">
                        Cảm ơn sự hiểu biết của bạn.<br>
                        Đội ngũ quản trị Smart Trọ
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Property hidden email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending property hidden email:', error);
        return { success: false, error: error.message };
    }
};

// Export tất cả functions
export default {
    generateOTP,
    sendOTPEmail,
    sendVerificationEmail,
    sendWarningEmail,
    sendPropertyHiddenEmail
};
