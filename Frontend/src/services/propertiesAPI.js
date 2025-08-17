import api from './api';

// API cho bất động sản (dùng trong chọn property khi tạo phòng)
export const propertiesAPI = {
  getMyProperties: async (params = {}) => {
    const response = await api.get('/properties/my/properties', { params });
    return response.data; // { success, data: { properties, pagination } }
  },
  getProperty: async (id) => {
    const response = await api.get(`/properties/${id}`);
    return response.data;
  },
  searchProperties: async (query = {}) => {
    const response = await api.get('/properties/search', { params: query });
    return response.data;
  }
};

export default propertiesAPI;
