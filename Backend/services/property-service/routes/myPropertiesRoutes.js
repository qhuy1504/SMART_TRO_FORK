import express from 'express';
import { body } from 'express-validator';
import authMiddleware from '../../shared/middleware/authMiddleware.js';
import myPropertiesController from '../controllers/myPropertiesController.js';

const router = express.Router();

// Validation rules for updating property
const updatePropertyValidation = [
  body('title')
    .notEmpty()
    .withMessage('Tiêu đề là bắt buộc')
    .isLength({ min: 10, max: 200 })
    .withMessage('Tiêu đề phải từ 10-200 ký tự'),
  
  body('description')
    .notEmpty()
    .withMessage('Mô tả là bắt buộc')
    .isLength({ min: 50, max: 2000 })
    .withMessage('Mô tả phải từ 50-2000 ký tự'),
  
  body('contactName')
    .notEmpty()
    .withMessage('Tên người liên hệ là bắt buộc')
    .isLength({ min: 2, max: 50 })
    .withMessage('Tên người liên hệ phải từ 2-50 ký tự'),
  
  body('contactPhone')
    .notEmpty()
    .withMessage('Số điện thoại là bắt buộc')
    .matches(/^[0-9]{10,11}$/)
    .withMessage('Số điện thoại không hợp lệ'),
  
  body('rentPrice')
    .isFloat({ min: 100000 })
    .withMessage('Giá thuê phải lớn hơn 100,000 VNĐ'),
  
  body('area')
    .isFloat({ min: 1 })
    .withMessage('Diện tích phải lớn hơn 0'),
  
  body('promotionPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Giá khuyến mãi phải là số dương')
    .custom((value, { req }) => {
      if (value && req.body.rentPrice && parseFloat(value) >= parseFloat(req.body.rentPrice)) {
        throw new Error('Giá khuyến mãi phải nhỏ hơn giá thuê gốc');
      }
      return true;
    }),
  
  body('deposit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Tiền cọc phải là số không âm'),
  
  body('electricPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Giá điện phải là số không âm'),
  
  body('waterPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Giá nước phải là số không âm')
];

// Routes
router.get('/', authMiddleware, myPropertiesController.getMyProperties);
router.get('/stats', authMiddleware, myPropertiesController.getMyPropertiesStats);
router.get('/:propertyId/edit', authMiddleware, myPropertiesController.getPropertyForEdit);
router.put('/:propertyId', authMiddleware, updatePropertyValidation, myPropertiesController.updateProperty);
router.delete('/:propertyId', authMiddleware, myPropertiesController.deleteProperty);
router.patch('/:propertyId/toggle-status', authMiddleware, myPropertiesController.togglePropertyStatus);

export default router;