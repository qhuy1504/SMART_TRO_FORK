import express from 'express';
import { body } from 'express-validator';
import propertiesPackageController from '../controllers/propertiesPackageController.js';
import authMiddleware from '../../shared/middleware/authMiddleware.js';
import { adminMiddleware } from '../../shared/middleware/adminMiddleware.js';

const router = express.Router();

// Validation rules
const packageValidation = [
  body('name')
    .notEmpty()
    .withMessage('Tên gói không được để trống')
    .isIn(['tin_thuong', 'tin_vip_1', 'tin_vip_2', 'tin_vip_3', 'tin_vip_noi_bat', 'tin_vip_dac_biet'])
    .withMessage('Loại gói không hợp lệ'),
  
  body('displayName')
    .notEmpty()
    .withMessage('Tên hiển thị không được để trống')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Tên hiển thị phải có từ 1-100 ký tự')
    .matches(/^[A-Za-z0-9ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]+$/)
    .withMessage('Tên hiển thị chỉ được chứa chữ cái, số và khoảng trắng'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 0, max: 500 })
    .withMessage('Mô tả không được vượt quá 500 ký tự')
    .custom((value) => {
      if (value && !/^[A-Za-z0-9ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s.,!?()-]+$/.test(value)) {
        throw new Error('Mô tả chỉ được chứa chữ cái, số, khoảng trắng và các dấu câu cơ bản');
      }
      return true;
    }),
  
  body('dailyPrice')
    .isInt({ min: 0 })
    .withMessage('Giá hàng ngày phải là số nguyên dương'),
  
  body('freePushCount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Số lượt đẩy miễn phí phải là số nguyên dương'),
  
  body('priority')
    .isInt({ min: 1, max: 6 })
    .withMessage('Độ ưu tiên phải là số từ 1-6'),
  
  body('color')
    .notEmpty()
    .withMessage('Màu sắc không được để trống')
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Màu sắc phải là mã hex hợp lệ'),
  
  body('textStyle')
    .optional()
    .isIn(['normal', 'uppercase', 'bold'])
    .withMessage('Kiểu chữ không hợp lệ'),
  
  body('stars')
    .optional()
    .isInt({ min: 0, max: 5 })
    .withMessage('Số sao phải là số từ 0-5'),
  
  body('features')
    .optional()
    .isArray()
    .withMessage('Tính năng phải là mảng')
    .custom((features) => {
      if (features && Array.isArray(features)) {
        // Check if array is not empty
        if (features.length === 0) {
          throw new Error('Phải có ít nhất một tính năng');
        }
        
        for (let i = 0; i < features.length; i++) {
          const feature = features[i];
          
          if (typeof feature !== 'string') {
            throw new Error(`Tính năng thứ ${i + 1} phải là chuỗi text`);
          }
          
          const trimmedFeature = feature.trim();
          
          if (trimmedFeature.length === 0) {
            throw new Error(`Tính năng thứ ${i + 1} không được để trống. Vui lòng nhập nội dung hoặc xóa trường này`);
          }
          
          if (trimmedFeature.length < 3) {
            throw new Error(`Tính năng thứ ${i + 1} phải có ít nhất 3 ký tự`);
          }
          
          if (trimmedFeature.length > 200) {
            throw new Error(`Tính năng thứ ${i + 1} không được vượt quá 200 ký tự`);
          }
          
          if (!/^[A-Za-z0-9ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s.,!?()-]+$/.test(trimmedFeature)) {
            throw new Error(`Tính năng thứ ${i + 1} chỉ được chứa chữ cái, số, khoảng trắng và các dấu câu cơ bản`);
          }
        }
      }
      return true;
    }),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Trạng thái hoạt động phải là boolean')
];

const priceCalculationValidation = [
  // Validation tùy chọn: có thể dùng packageId hoặc packageName
  body('packageId')
    .optional()
    .isMongoId()
    .withMessage('Package ID không hợp lệ'),
  
  body('packageName')
    .optional()
    .notEmpty()
    .withMessage('Tên gói không được để trống'),
  
  // Custom validation: phải có ít nhất một trong hai
  body().custom((body) => {
    if (!body.packageId && !body.packageName) {
      throw new Error('Phải cung cấp packageId hoặc packageName');
    }
    return true;
  }),
  
  body('duration')
    .isInt({ min: 1 })
    .withMessage('Thời gian phải là số nguyên dương'),
  
  body('durationType')
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Loại thời gian không hợp lệ')
];

/**
 * @route   GET /api/property-packages
 * @desc    Lấy tất cả gói tin đăng
 * @access  Public
 */
router.get('/', propertiesPackageController.getAllPackages);

/**
 * @route   GET /api/property-packages/:id
 * @desc    Lấy gói tin đăng theo ID
 * @access  Public
 */
router.get('/:id', propertiesPackageController.getPackageById);

/**
 * @route   POST /api/property-packages/calculate-price
 * @desc    Tính giá gói tin đăng
 * @access  Private (Authenticated users)
 */
router.post('/calculate-price', 
  authMiddleware, 
  priceCalculationValidation, 
  propertiesPackageController.calculatePackagePrice
);

/**
 * @route   POST /api/property-packages/initialize
 * @desc    Khởi tạo dữ liệu mẫu (Development only)
 * @access  Private (Admin only)
 */
router.post('/initialize', 
  authMiddleware, 
  adminMiddleware, 
  propertiesPackageController.initializePackages
);

/**
 * @route   POST /api/property-packages
 * @desc    Tạo gói tin đăng mới
 * @access  Private (Admin only)
 */
router.post('/', 
  authMiddleware, 
  adminMiddleware, 
  packageValidation, 
  propertiesPackageController.createPackage
);

/**
 * @route   PUT /api/property-packages/:id
 * @desc    Cập nhật gói tin đăng
 * @access  Private (Admin only)
 */
router.put('/:id', 
  authMiddleware, 
  adminMiddleware, 
  packageValidation, 
  propertiesPackageController.updatePackage
);

/**
 * @route   DELETE /api/property-packages/:id
 * @desc    Xóa gói tin đăng
 * @access  Private (Admin only)
 */
router.delete('/:id', 
  authMiddleware, 
  adminMiddleware, 
  propertiesPackageController.deletePackage
);

export default router;