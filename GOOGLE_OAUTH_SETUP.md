# Hướng dẫn setup Google OAuth

## Bước 1: Tạo Google Cloud Project và OAuth Client ID

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Bật Google+ API hoặc Google Identity Services API
4. Đi tới "Credentials" trong sidebar
5. Click "Create Credentials" > "OAuth client ID"
6. Chọn "Web application"
7. Thêm authorized origins:
   - http://localhost:3000 (cho development)
   - https://yourdomain.com (cho production)
8. Thêm authorized redirect URIs:
   - http://localhost:3000 (cho development)
   - https://yourdomain.com (cho production)

## Bước 2: Cập nhật environment variables

### Frontend (.env)
```
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_from_step_1
```

### Backend (.env)
```
GOOGLE_CLIENT_ID=your_google_client_id_from_step_1
```

## Bước 3: Test Google OAuth

1. Khởi động backend: `npm start` trong thư mục Backend
2. Khởi động frontend: `npm start` trong thư mục Frontend
3. Truy cập http://localhost:3000/login
4. Click nút "Sign in with Google"
5. Chọn tài khoản Google để đăng nhập
6. Kiểm tra xem có redirect về trang chủ không

## Chú ý

- Google Client ID phải giống nhau ở frontend và backend
- Đảm bảo authorized origins và redirect URIs được cấu hình đúng
- Trong production, thay localhost bằng domain thực tế
