import Property from '../../../schemas/Property.js';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { fetchProvinces, fetchDistricts, fetchWards } from "../../shared/utils/locationService.js";

const myPropertiesController = {
  // Lấy danh sách tin đăng của user hiện tại
  getMyProperties: async (req, res) => {
    try {
      const userId = req.user.userId; // Từ middleware auth
      
      // Pagination params
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Filter params
      const status = req.query.status || 'all';
      const sortBy = req.query.sortBy || 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      const search = req.query.search || '';

      // Build query
      let query = { owner: userId };

      // Status filter - CẬP NHẬT để sử dụng status thay vì isForRent
      if (status !== 'all') {
        if (status === 'hidden') {
          query.status = 'inactive';
        } else if (status === 'available') {
          query.status = 'available';
        } else if (status === 'rented') {
          query.status = 'rented';
        } else if (status === 'maintenance') {
          query.status = 'maintenance';
        } else if (status === 'draft') {
          query.status = 'draft';
        } else {
          // Nếu filter theo approval status
          query.approvalStatus = status;
          query.status = { $ne: 'inactive' }; // Không bao gồm status inactive
        }
      }

      // Search filter
      if (search.trim()) {
        query.title = { $regex: search, $options: 'i' };
      }

      // Build sort object
      const sortObj = {};
      sortObj[sortBy] = sortOrder;

      // Lấy data
      const [properties, total, provinces] = await Promise.all([
        Property.find(query)
          .sort(sortObj)
          .skip(skip)
          .limit(limit)
          .populate('owner', 'name email phone')
          .lean(),
        Property.countDocuments(query),
        fetchProvinces(),
      
      ]);

      // Map tỉnh
      const provinceMap = new Map(provinces.map(p => [String(p.code), p.name]));

      // Lấy districts & wards phụ thuộc provinceCode, districtCode
      const districtMap = new Map();
      const wardMap = new Map();

      for (const property of properties) {
        if (property.province && !districtMap.has(property.district)) {
          const districts = await fetchDistricts(property.province);
          districts.forEach(d => districtMap.set(String(d.code), d.name));
        }
        if (property.district && !wardMap.has(property.ward)) {
          const wards = await fetchWards(property.district);
          wards.forEach(w => wardMap.set(String(w.code), w.name));
        }
      }


      // Transform data for frontend - CẬP NHẬT để sử dụng status
  const transformedProperties = properties.map(property => ({
        _id: property._id,
        title: property.title,
        category: property.category,
        rentPrice: property.rentPrice,
        promotionPrice: property.promotionPrice,
        area: property.area,
        images: property.images,
        approvalStatus: property.approvalStatus,
        status: property.status,
        isActive: property.status !== 'inactive',
        location: {
          provinceName: provinceMap.get(String(property.province)) || "",
          districtName: districtMap.get(String(property.district)) || "",
          wardName: wardMap.get(String(property.ward)) || "",
          detailAddress: property.detailAddress
        },
        views: property.stats?.views || 0,
        favorites: property.stats?.favorites || 0,
        createdAt: property.createdAt,
        updatedAt: property.updatedAt
      }));
      console.log("Transformed properties:", transformedProperties);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        message: 'Lấy danh sách tin đăng thành công',
        data: {
          properties: transformedProperties,
          pagination: {
            page,
            limit,
            total,
            totalPages
          }
        }
      });

    } catch (error) {
      console.error('Error in getMyProperties:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách tin đăng',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Lấy thông tin tin đăng để edit
  getPropertyForEdit: async (req, res) => {
    try {
      const { propertyId } = req.params;
      const userId = req.user.userId;

      const property = await Property.findOne({
        _id: propertyId,
        owner: userId
      }).lean();
      console.log("Fetched property for edit:", property);

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tin đăng hoặc bạn không có quyền chỉnh sửa'
        });
      }

      // Transform data for edit form - CẬP NHẬT để sử dụng status
      const editData = {
        _id: property._id,
        title: property.title,
        category: property.category,
        contactName: property.contactName,
        contactPhone: property.contactPhone,
        description: property.description,
        rentPrice: property.rentPrice,
        promotionPrice: property.promotionPrice,
        deposit: property.deposit,
        area: property.area,
        electricPrice: property.electricPrice,
        waterPrice: property.waterPrice,
        maxOccupants: property.maxOccupants,
        availableDate: property.availableDate,
        amenities: property.amenities,
        fullAmenities: property.fullAmenities,
        timeRules: property.timeRules,
        houseRules: property.houseRules,
        location: property.location,
        images: property.images,
        video: property.video,
        status: property.status, // Thay isForRent bằng status
        approvalStatus: property.approvalStatus,
        province: property.province || '',
        district: property.district || '',
        ward: property.ward || ''
      };

      res.json({
        success: true,
        message: 'Lấy thông tin tin đăng thành công',
        data: editData
      });

    } catch (error) {
      console.error('Error in getPropertyForEdit:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thông tin tin đăng',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Cập nhật tin đăng
  updateProperty: async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: errors.mapped()
        });
      }

      const { propertyId } = req.params;
      const userId = req.user.userId;

      // Check if property exists and belongs to user
      const existingProperty = await Property.findOne({
        _id: propertyId,
        owner: userId
      });

      if (!existingProperty) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tin đăng hoặc bạn không có quyền chỉnh sửa'
        });
      }

      // Prepare update data
      const updateData = {
        title: req.body.title,
        contactName: req.body.contactName,
        contactPhone: req.body.contactPhone,
        description: req.body.description,
        rentPrice: parseFloat(req.body.rentPrice),
        area: parseFloat(req.body.area),
        electricPrice: req.body.electricPrice ? parseFloat(req.body.electricPrice) : undefined,
        waterPrice: req.body.waterPrice ? parseFloat(req.body.waterPrice) : undefined,
        maxOccupants: req.body.maxOccupants,
        timeRules: req.body.timeRules,
        updatedAt: new Date()
      };

      // Optional fields
      if (req.body.promotionPrice) {
        updateData.promotionPrice = parseFloat(req.body.promotionPrice);
      }
      if (req.body.deposit) {
        updateData.deposit = parseFloat(req.body.deposit);
      }
      if (req.body.availableDate) {
        updateData.availableDate = req.body.availableDate;
      }

      // Arrays
      if (req.body.amenities) {
        updateData.amenities = Array.isArray(req.body.amenities) 
          ? req.body.amenities 
          : [req.body.amenities];
      }
      if (req.body.houseRules) {
        updateData.houseRules = Array.isArray(req.body.houseRules) 
          ? req.body.houseRules 
          : [req.body.houseRules];
      }

      // Boolean fields
      if (req.body.fullAmenities !== undefined) {
        updateData.fullAmenities = req.body.fullAmenities === 'true';
      }

      // Location update
      if (req.body.province || req.body.district || req.body.ward || req.body.detailAddress) {
        updateData.location = {
          province: req.body.province || existingProperty.location?.province,
          district: req.body.district || existingProperty.location?.district,
          ward: req.body.ward || existingProperty.location?.ward,
          detailAddress: req.body.detailAddress || existingProperty.location?.detailAddress
        };
      }

      // Coordinates update
      if (req.body.coordinates) {
        const coords = JSON.parse(req.body.coordinates);
        updateData.coordinates = {
          type: 'Point',
          coordinates: [coords.lng, coords.lat]
        };
      }

      // Reset approval status to pending when updated (except admin)
      if (req.user.role !== 'admin') {
        updateData.approvalStatus = 'pending';
      }

      // Update property
      const updatedProperty = await Property.findByIdAndUpdate(
        propertyId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        message: 'Cập nhật tin đăng thành công. Tin đăng sẽ được admin duyệt lại.',
        data: updatedProperty
      });

    } catch (error) {
      console.error('Error in updateProperty:', error);
      
      if (error.name === 'ValidationError') {
        const validationErrors = {};
        for (let field in error.errors) {
          validationErrors[field] = error.errors[field].message;
        }
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: validationErrors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật tin đăng',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Xóa tin đăng
  deleteProperty: async (req, res) => {
    try {
      const { propertyId } = req.params;
      const userId = req.user.userId;

      const property = await Property.findOne({
        _id: propertyId,
        owner: userId
      });

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tin đăng hoặc bạn không có quyền xóa'
        });
      }

      // Soft delete - chỉ đánh dấu là đã xóa
      await Property.findByIdAndUpdate(propertyId, {
        isDeleted: true,
        deletedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Xóa tin đăng thành công'
      });

    } catch (error) {
      console.error('Error in deleteProperty:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa tin đăng',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Thay đổi trạng thái ẩn/hiện tin đăng - CẬP NHẬT để sử dụng status
  togglePropertyStatus: async (req, res) => {
    try {
      const { propertyId } = req.params;
      console.log('Toggling property status:', propertyId);
      const userId = req.user.userId;

      const property = await Property.findOne({
        _id: propertyId,
        owner: userId
      });

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tin đăng hoặc bạn không có quyền thay đổi'
        });
      }

      // Toggle status giữa available và inactive
      const newStatus = property.status === 'inactive' ? 'available' : 'inactive';

      const updatedProperty = await Property.findByIdAndUpdate(
        propertyId,
        { 
          $set: { 
            status: newStatus,
            updatedAt: new Date()
          }
        },
        { new: true }
      );

      res.json({
        success: true,
        message: `Đã ${newStatus === 'available' ? 'hiện' : 'ẩn'} tin đăng`,
        data: {
          status: updatedProperty.status,
          isActive: updatedProperty.status !== 'inactive' // Tương thích với frontend
        }
      });

    } catch (error) {
      console.error('Error in togglePropertyStatus:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi thay đổi trạng thái tin đăng',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Thống kê tin đăng của user - CẬP NHẬT để sử dụng status
  getMyPropertiesStats: async (req, res) => {
    try {
      const userId = req.user.userId;

      const stats = await Property.aggregate([
        { $match: { owner: userId, isDeleted: { $ne: true } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: {
              $sum: {
                $cond: [{ $eq: ['$approvalStatus', 'pending'] }, 1, 0]
              }
            },
            approved: {
              $sum: {
                $cond: [{ $eq: ['$approvalStatus', 'approved'] }, 1, 0]
              }
            },
            rejected: {
              $sum: {
                $cond: [{ $eq: ['$approvalStatus', 'rejected'] }, 1, 0]
              }
            },
            // CẬP NHẬT: Đếm theo status thay vì isForRent
            hidden: {
              $sum: {
                $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0]
              }
            },
            available: {
              $sum: {
                $cond: [{ $eq: ['$status', 'available'] }, 1, 0]
              }
            },
            rented: {
              $sum: {
                $cond: [{ $eq: ['$status', 'rented'] }, 1, 0]
              }
            },
            maintenance: {
              $sum: {
                $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0]
              }
            },
            draft: {
              $sum: {
                $cond: [{ $eq: ['$status', 'draft'] }, 1, 0]
              }
            },
            totalViews: { $sum: '$stats.views' },
            totalFavorites: { $sum: '$stats.favorites' }
          }
        }
      ]);

      const result = stats[0] || {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        hidden: 0,
        available: 0,
        rented: 0,
        maintenance: 0,
        draft: 0,
        totalViews: 0,
        totalFavorites: 0
      };

      res.json({
        success: true,
        message: 'Lấy thống kê thành công',
        data: result
      });

    } catch (error) {
      console.error('Error in getMyPropertiesStats:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thống kê',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

export default myPropertiesController;