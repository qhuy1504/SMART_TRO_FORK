import api from './api';

// API cho đăng tin mới
export const postAPI = {
  // Tạo tin đăng mới
  createPost: async (postData) => {
    const formData = new FormData();
    
    // Basic information
    formData.append('title', postData.title);
    formData.append('category', postData.category);
    formData.append('contactName', postData.contactName);
    formData.append('contactPhone', postData.contactPhone);
    formData.append('description', postData.description);
    
    // Pricing information
    formData.append('rentPrice', postData.rentPrice);
    if (postData.promotionPrice) formData.append('promotionPrice', postData.promotionPrice);
    if (postData.deposit) formData.append('deposit', postData.deposit);
    formData.append('area', postData.area);
    if (postData.electricPrice) formData.append('electricPrice', postData.electricPrice);
    if (postData.waterPrice) formData.append('waterPrice', postData.waterPrice);
    formData.append('maxOccupants', postData.maxOccupants);
    if (postData.availableDate) formData.append('availableDate', postData.availableDate);
    
    // Address information
    formData.append('province', postData.province);
    formData.append('district', postData.district);
    formData.append('ward', postData.ward);
    formData.append('detailAddress', postData.detailAddress);
    if (postData.coordinates) {
      formData.append('coordinates', JSON.stringify(postData.coordinates));
    }
    
    // Amenities and rules
    formData.append('amenities', JSON.stringify(postData.amenities));
    formData.append('fullAmenities', postData.fullAmenities);
    if (postData.timeRules) formData.append('timeRules', postData.timeRules);
    formData.append('houseRules', JSON.stringify(postData.houseRules));
    
    // Status
    formData.append('isForRent', postData.isForRent);
    
    // Media files
    if (postData.images && postData.images.length > 0) {
      postData.images.forEach((image, index) => {
        if (image && image.file) {
          formData.append('images', image.file);
        }
      });
    }
    
    if (postData.video && postData.video.file) {
      formData.append('video', postData.video.file);
    }
    
    const response = await api.post('/properties', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Lấy danh sách tin đăng của user
  getMyPosts: async (params = {}) => {
    const response = await api.get('/properties/my/properties', { params });
    return response.data;
  },

  // Cập nhật tin đăng
  updatePost: async (id, postData) => {
    const response = await api.put(`/properties/${id}`, postData);
    return response.data;
  },

  // Xóa tin đăng
  deletePost: async (id) => {
    const response = await api.delete(`/properties/${id}`);
    return response.data;
  },

  // Admin APIs - Duyệt bài
  
  // Lấy danh sách tin đăng chờ duyệt (Admin only)
  getPendingPosts: async (params = {}) => {
    const response = await api.get('/properties/admin/pending', { params });
    return response.data;
  },

  // Duyệt tin đăng (Admin only)
  approvePost: async (id, adminNote = '') => {
    const response = await api.put(`/properties/admin/approve/${id}`, {
      adminNote
    });
    return response.data;
  },

  // Từ chối tin đăng (Admin only)
  rejectPost: async (id, rejectionReason) => {
    const response = await api.put(`/properties/admin/reject/${id}`, {
      rejectionReason
    });
    return response.data;
  },

  // Lấy tất cả tin đăng (Admin only)
  getAllPosts: async (params = {}) => {
    const response = await api.get('/properties/admin/all', { params });
    return response.data;
  },

  // Thay đổi trạng thái featured (Admin only)
  toggleFeatured: async (id) => {
    const response = await api.put(`/properties/admin/featured/${id}`);
    return response.data;
  },

  // Upload hình ảnh
  uploadImages: async (images) => {
    const formData = new FormData();
    images.forEach((image, index) => {
      formData.append('images', image.file);
    });
    
    const response = await api.post('/upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Upload video
  uploadVideo: async (video) => {
    const formData = new FormData();
    formData.append('video', video.file);
    
    const response = await api.post('/upload/video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};

export default postAPI;
