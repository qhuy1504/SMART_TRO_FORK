import api from './api';

export const locationAPI = {
  // Lấy danh sách tỉnh/thành phố
  getProvinces: async () => {
    try {
      const response = await api.get('/locations/provinces');
      // console.log('Provinces response data:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching provinces:', error);
      throw error;
    }
  },

  // Lấy danh sách quận/huyện theo tỉnh
  getDistricts: async (provinceCode) => {
    try {
      const response = await api.get(`/locations/provinces/${provinceCode}/districts`);
      return response.data;
    } catch (error) {
      console.error('Error fetching districts:', error);
      throw error;
    }
  },

  // Lấy danh sách phường/xã theo quận
  getWards: async (districtCode) => {
    try {
      const response = await api.get(`/locations/districts/${districtCode}/wards`);
      return response.data;
    } catch (error) {
      console.error('Error fetching wards:', error);
      throw error;
    }
  },

  // Lấy thông tin chi tiết địa chỉ
  getAddressDetail: async (provinceCode, districtCode, wardCode) => {
    try {
      const response = await api.get(`/locations/address-detail/${provinceCode}/${districtCode}/${wardCode}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching address detail:', error);
      throw error;
    }
  },

    // New geocoding methods với address object
  geocodeAddress: async (addressObject) => {
    try {
      const response = await api.post('/locations/geocode', { address: addressObject });
      console.log('Geocode locationAPI:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error geocoding address:', error);
      if (error.response?.status === 429) {
        throw new Error('Quá nhiều yêu cầu, vui lòng thử lại sau');
      }
      throw error;
    }
  }

};


