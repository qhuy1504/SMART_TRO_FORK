import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import { myPropertiesAPI } from '../../../services/myPropertiesAPI';
import { locationAPI } from '../../../services/locationAPI';
import dayjs from 'dayjs';
import './EditPropertyModal.css';

const libraries = ['places'];

const mapContainerStyle = {
  width: '100%',
  height: '250px',
  borderRadius: '8px'
};

const mapOptions = {
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
};

const EditPropertyModal = ({ property, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const geocoderRef = useRef(null);
  
  // Google Maps
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries
  });

  // Location data
  const [locationData, setLocationData] = useState({
    provinces: [],
    districts: [],
    wards: [],
    loadingProvinces: false,
    loadingDistricts: false,
    loadingWards: false,
    geocoding: false
  });

  // Options data
  const categories = [
    { value: 'phong_tro', label: 'Phòng trọ' },
    { value: 'can_ho', label: 'Căn hộ' },
    { value: 'nha_nguyen_can', label: 'Nhà nguyên căn' },
    { value: 'chung_cu_mini', label: 'Chung cư mini' },
    { value: 'homestay', label: 'Homestay' }
  ];

  const maxOccupantsOptions = [
    { value: '1', label: '1 người' },
    { value: '2', label: '2 người' },
    { value: '3', label: '3 người' },
    { value: '4', label: '4 người' },
    { value: '5+', label: '5+ người' }
  ];

  const amenitiesList = [
    { value: 'wifi', label: 'Wi-Fi' },
    { value: 'parking', label: 'Bãi đỗ xe' },
    { value: 'elevator', label: 'Thang máy' },
    { value: 'security', label: 'Bảo vệ' },
    { value: 'laundry', label: 'Giặt ủi' },
    { value: 'kitchen', label: 'Nhà bếp' },
    { value: 'air_conditioner', label: 'Máy lạnh' },
    { value: 'water_heater', label: 'Máy nước nóng' },
    { value: 'refrigerator', label: 'Tủ lạnh' },
    { value: 'washing_machine', label: 'Máy giặt' },
    { value: 'tv', label: 'TV' },
    { value: 'desk', label: 'Bàn làm việc' },
    { value: 'wardrobe', label: 'Tủ quần áo' },
    { value: 'balcony', label: 'Ban công' }
  ];

  const houseRulesList = [
    { value: 'no_smoking', label: 'Không hút thuốc' },
    { value: 'no_pets', label: 'Không nuôi thú cưng' },
    { value: 'no_parties', label: 'Không tổ chức tiệc' },
    { value: 'quiet_hours', label: 'Giữ yên tĩnh sau giờ quy định' },
    { value: 'no_overnight_guests', label: 'Không có khách qua đêm' },
    { value: 'keep_clean', label: 'Giữ vệ sinh khu vực chung' },
    { value: 'remove_shoes', label: 'Cởi giày trước khi vào nhà' }
  ];

  useEffect(() => {
    if (property) {
      // Initialize form với tất cả dữ liệu property
      setFormData({
        title: property.title || '',
        category: property.category || 'phong_tro',
        contactName: property.contactName || '',
        contactPhone: property.contactPhone || '',
        description: property.description || '',
        rentPrice: property.rentPrice || '',
        promotionPrice: property.promotionPrice || '',
        deposit: property.deposit || '',
        area: property.area || '',
        electricPrice: property.electricPrice || '',
        waterPrice: property.waterPrice || '',
        maxOccupants: property.maxOccupants || '1',
        availableDate: property.availableDate ? dayjs(property.availableDate).format('YYYY-MM-DD') : '',
        
        // Tiện ích
        amenities: property.amenities || [],
        fullAmenities: property.fullAmenities || false,
        timeRules: property.timeRules || '',
        
        // Nội quy
        houseRules: property.houseRules || [],
        
        // Địa chỉ - cần convert từ name về code
      province: property.province || '',
      district: property.district || '',
      ward: property.ward || '',
      detailAddress: property.detailAddress || '',
      coordinates: property.coordinates || { lat: 16.0583, lng: 108.2772 },
        
        // Media
        images: property.images || [],
        video: property.video || null,
        existingImages: property.images || [], // Track existing images
        newImages: [], // Track new uploaded images
        removedImages: [] // Track removed images
      });
      
      loadLocationData();
    }
  }, [property]);

  const loadLocationData = async () => {
    try {
      // Load provinces
      setLocationData(prev => ({ ...prev, loadingProvinces: true }));
      const provinces = await locationAPI.getProvinces();
      console.log('Loaded provinces:', provinces);
      const provincesData = provinces.data || [];
      console.log('property:', property);
      // Tìm province code từ name
      const provinceData = provincesData.find(p => p.name === property.province);
      console.log('CODE province data:', provinceData);
      setLocationData(prev => ({
        ...prev,
        provinces: provincesData,
        loadingProvinces: false
      }));

      if (provinceData) {
        setFormData(prev => ({ ...prev, province: provinceData.code }));
        
        // Load districts
        setLocationData(prev => ({ ...prev, loadingDistricts: true }));
        const districts = await locationAPI.getDistricts(provinceData.code);
        const districtsData = districts.data?.districts || [];
        console.log('Loaded districts:', districtsData);
        
        // Tìm district code từ name
        const districtData = districtsData.find(d => d.name === property.location?.district);
        
        setLocationData(prev => ({
          ...prev,
          districts: districtsData,
          loadingDistricts: false
        }));

        if (districtData) {
          setFormData(prev => ({ ...prev, district: districtData.code }));
          
          // Load wards
          setLocationData(prev => ({ ...prev, loadingWards: true }));
          const wards = await locationAPI.getWards(districtData.code);
          const wardsData = wards.data || [];
          
          // Tìm ward code từ name
          const wardData = wardsData.find(w => w.name === property.location?.ward);
          
          setLocationData(prev => ({
            ...prev,
            wards: wardsData,
            loadingWards: false
          }));

          if (wardData) {
            setFormData(prev => ({ ...prev, ward: wardData.code }));
          }
        }
      }
    } catch (error) {
      console.error('Error loading location data:', error);
      setLocationData(prev => ({ 
        ...prev, 
        loadingProvinces: false,
        loadingDistricts: false,
        loadingWards: false 
      }));
    }
  };

  // Load districts when province changes
  useEffect(() => {
    const loadDistricts = async () => {
      if (!formData.province) {
        setLocationData(prev => ({ ...prev, districts: [], wards: [] }));
        setFormData(prev => ({ ...prev, district: '', ward: '' }));
        return;
      }

      try {
        setLocationData(prev => ({ ...prev, loadingDistricts: true }));
        const districts = await locationAPI.getDistricts(formData.province);
        setLocationData(prev => ({
          ...prev,
          districts: districts.data || [],
          loadingDistricts: false,
          wards: []
        }));
        setFormData(prev => ({ ...prev, district: '', ward: '' }));
      } catch (error) {
        console.error('Error loading districts:', error);
        setLocationData(prev => ({ ...prev, loadingDistricts: false }));
      }
    };

    if (formData.province) {
      loadDistricts();
    }
  }, [formData.province]);

  // Load wards when district changes
  useEffect(() => {
    const loadWards = async () => {
      if (!formData.district) {
        setLocationData(prev => ({ ...prev, wards: [] }));
        setFormData(prev => ({ ...prev, ward: '' }));
        return;
      }

      try {
        setLocationData(prev => ({ ...prev, loadingWards: true }));
        const wards = await locationAPI.getWards(formData.district);
        setLocationData(prev => ({
          ...prev,
          wards: wards.data || [],
          loadingWards: false
        }));
        setFormData(prev => ({ ...prev, ward: '' }));
      } catch (error) {
        console.error('Error loading wards:', error);
        setLocationData(prev => ({ ...prev, loadingWards: false }));
      }
    };

    if (formData.district) {
      loadWards();
    }
  }, [formData.district]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      if (name === 'fullAmenities') {
        setFormData(prev => ({
          ...prev,
          fullAmenities: checked,
          amenities: checked ? amenitiesList.map(item => item.value) : []
        }));
      } else if (name === 'amenities') {
        setFormData(prev => ({
          ...prev,
          amenities: checked
            ? [...prev.amenities, value]
            : prev.amenities.filter(item => item !== value)
        }));
      } else if (name === 'houseRules') {
        setFormData(prev => ({
          ...prev,
          houseRules: checked
            ? [...prev.houseRules, value]
            : prev.houseRules.filter(item => item !== value)
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: checked
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Image upload handler
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          newImages: [...prev.newImages, {
            file: file,
            url: event.target.result,
            name: file.name
          }]
        }));
      };
      reader.readAsDataURL(file);
    });

    if (errors.images) {
      setErrors(prev => ({ ...prev, images: '' }));
    }
  };

  // Video upload handler
  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({
        ...prev,
        video: {
          file: file,
          url: event.target.result,
          name: file.name
        }
      }));
    };
    reader.readAsDataURL(file);

    if (errors.video) {
      setErrors(prev => ({ ...prev, video: '' }));
    }
  };

  // Remove existing image
  const handleRemoveExistingImage = (index) => {
    const imageToRemove = formData.existingImages[index];
    setFormData(prev => ({
      ...prev,
      existingImages: prev.existingImages.filter((_, i) => i !== index),
      removedImages: [...prev.removedImages, imageToRemove]
    }));
  };

  // Remove new image
  const handleRemoveNewImage = (index) => {
    setFormData(prev => ({
      ...prev,
      newImages: prev.newImages.filter((_, i) => i !== index)
    }));
  };

  // Handle map click
  const handleMapClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    setFormData(prev => ({
      ...prev,
      coordinates: { lat, lng }
    }));

    toast.success(`Đã chọn vị trí: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
  };

  // Format date for backend
  const formatDateForBackend = (dateString) => {
    if (!dateString) return '';
    const date = dayjs(dateString);
    if (date.isValid()) {
      return date.format('DD-MM-YYYY');
    }
    return dateString;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Tìm tên từ code để gửi lên backend (tương tự NewProperty)
      const provinceData = locationData.provinces.find(p => p.code === formData.province);
      const districtData = locationData.districts.find(d => d.code === formData.district);
      const wardData = locationData.wards.find(w => w.code === formData.ward);

      const dataToSubmit = {
        ...formData,
        availableDate: formatDateForBackend(formData.availableDate),
        // Gửi location names
        province: provinceData?.name || formData.province,
        district: districtData?.name || formData.district,
        ward: wardData?.name || formData.ward,
        // Gửi thông tin về images thay đổi
        removedImages: formData.removedImages,
        // newImages sẽ được handle riêng nếu cần upload
      };

      console.log('Data to submit for update:', dataToSubmit);

      const response = await myPropertiesAPI.updateProperty(property._id, dataToSubmit);

      if (response.success) {
        toast.success('Cập nhật tin đăng thành công!');
        onSuccess();
      } else {
        if (response.errors) {
          setErrors(response.errors);
          toast.error('Có lỗi trong dữ liệu. Vui lòng kiểm tra lại.');
        } else {
          toast.error(response.message || 'Có lỗi xảy ra');
        }
      }
    } catch (error) {
      console.error('Error updating property:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
        toast.error('Có lỗi trong dữ liệu. Vui lòng kiểm tra lại.');
      } else {
        toast.error('Lỗi khi cập nhật tin đăng');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Chỉnh sửa tin đăng</h3>
          <button className="close-btn" onClick={onClose}>
            <i className="fa fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-content">
            {/* Thông tin chủ nhà */}
            <div className="form-section">
              <h4>Thông tin chủ nhà</h4>
              
              <div className="form-group">
                <label>Tiêu đề *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title || ''}
                  onChange={handleInputChange}
                  className={errors.title ? 'error' : ''}
                />
                {errors.title && <span className="error-text">{errors.title}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Danh mục thuê *</label>
                  <select
                    name="category"
                    value={formData.category || 'phong_tro'}
                    onChange={handleInputChange}
                    className={errors.category ? 'error' : ''}
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  {errors.category && <span className="error-text">{errors.category}</span>}
                </div>

                <div className="form-group">
                  <label>Tên người liên hệ *</label>
                  <input
                    type="text"
                    name="contactName"
                    value={formData.contactName || ''}
                    onChange={handleInputChange}
                    className={errors.contactName ? 'error' : ''}
                  />
                  {errors.contactName && <span className="error-text">{errors.contactName}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>Số điện thoại *</label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone || ''}
                  onChange={handleInputChange}
                  placeholder="VD: 0123456789"
                  className={errors.contactPhone ? 'error' : ''}
                />
                {errors.contactPhone && <span className="error-text">{errors.contactPhone}</span>}
              </div>

              <div className="form-group">
                <label>Mô tả *</label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  rows="4"
                  className={errors.description ? 'error' : ''}
                />
                {errors.description && <span className="error-text">{errors.description}</span>}
              </div>
            </div>

            {/* Thông tin cơ bản & giá */}
            <div className="form-section">
              <h4>Thông tin cơ bản & giá</h4>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Giá thuê (VNĐ/tháng) *</label>
                  <input
                    type="number"
                    name="rentPrice"
                    value={formData.rentPrice || ''}
                    onChange={handleInputChange}
                    className={errors.rentPrice ? 'error' : ''}
                  />
                  {errors.rentPrice && <span className="error-text">{errors.rentPrice}</span>}
                </div>

                <div className="form-group">
                  <label>Giá khuyến mãi (VNĐ/tháng)</label>
                  <input
                    type="number"
                    name="promotionPrice"
                    value={formData.promotionPrice || ''}
                    onChange={handleInputChange}
                    className={errors.promotionPrice ? 'error' : ''}
                  />
                  {errors.promotionPrice && <span className="error-text">{errors.promotionPrice}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tiền cọc (VNĐ)</label>
                  <input
                    type="number"
                    name="deposit"
                    value={formData.deposit || ''}
                    onChange={handleInputChange}
                    className={errors.deposit ? 'error' : ''}
                  />
                  {errors.deposit && <span className="error-text">{errors.deposit}</span>}
                </div>

                <div className="form-group">
                  <label>Diện tích (m²) *</label>
                  <input
                    type="number"
                    name="area"
                    value={formData.area || ''}
                    onChange={handleInputChange}
                    className={errors.area ? 'error' : ''}
                  />
                  {errors.area && <span className="error-text">{errors.area}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Giá điện (VNĐ/kWh)</label>
                  <input
                    type="number"
                    name="electricPrice"
                    value={formData.electricPrice || ''}
                    onChange={handleInputChange}
                    className={errors.electricPrice ? 'error' : ''}
                  />
                  {errors.electricPrice && <span className="error-text">{errors.electricPrice}</span>}
                </div>

                <div className="form-group">
                  <label>Giá nước (VNĐ/m³)</label>
                  <input
                    type="number"
                    name="waterPrice"
                    value={formData.waterPrice || ''}
                    onChange={handleInputChange}
                    className={errors.waterPrice ? 'error' : ''}
                  />
                  {errors.waterPrice && <span className="error-text">{errors.waterPrice}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tối đa người ở</label>
                  <select
                    name="maxOccupants"
                    value={formData.maxOccupants || '1'}
                    onChange={handleInputChange}
                  >
                    {maxOccupantsOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Ngày có thể vào ở</label>
                  <input
                    type="date"
                    name="availableDate"
                    value={formData.availableDate || ''}
                    onChange={handleInputChange}
                    min={dayjs().format('YYYY-MM-DD')}
                    className={errors.availableDate ? 'error' : ''}
                  />
                  {errors.availableDate && <span className="error-text">{errors.availableDate}</span>}
                </div>
              </div>
            </div>

            {/* Tiện ích */}
            <div className="form-section">
              <h4>Tiện ích cho thuê</h4>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="fullAmenities"
                    checked={formData.fullAmenities || false}
                    onChange={handleInputChange}
                  />
                  Full tiện ích
                </label>
              </div>

              <div className="amenities-grid">
                {amenitiesList.map((amenity) => (
                  <label
                    key={amenity.value}
                    className={`amenity-item ${formData.fullAmenities ? "disabled" : ""}`}
                  >
                    <input
                      type="checkbox"
                      name="amenities"
                      value={amenity.value}
                      checked={formData.amenities?.includes(amenity.value) || false}
                      onChange={handleInputChange}
                      disabled={formData.fullAmenities}
                    />
                    <span className="amenity-text">{amenity.label}</span>
                  </label>
                ))}
              </div>

              <div className="form-group">
                <label>Quy định giờ giấc</label>
                <textarea
                  name="timeRules"
                  value={formData.timeRules || ''}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>
            </div>

            {/* Nội quy */}
            <div className="form-section">
              <h4>Nội quy</h4>
              <div className="house-rules-grid">
                {houseRulesList.map(rule => (
                  <label key={rule.value}>
                    <input
                      type="checkbox"
                      name="houseRules"
                      value={rule.value}
                      checked={formData.houseRules?.includes(rule.value) || false}
                      onChange={handleInputChange}
                    />
                    {rule.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Địa chỉ */}
            <div className="form-section">
              <h4>Địa chỉ</h4>

              <div className="form-row">
                <div className="form-group">
                  <label>Tỉnh/Thành phố *</label>
                  <select
                    name="province"
                    value={formData.province || ''}
                    onChange={handleInputChange}
                    className={errors.province ? 'error' : ''}
                    disabled={locationData.loadingProvinces}
                  >
                    <option value="">
                      {locationData.loadingProvinces ? 'Đang tải...' : 'Chọn tỉnh/thành phố'}
                    </option>
                    {locationData.provinces.map(province => (
                      <option key={province.code} value={province.code}>
                        {province.name}
                      </option>
                    ))}
                  </select>
                  {errors.province && <span className="error-text">{errors.province}</span>}
                </div>

                <div className="form-group">
                  <label>Quận/Huyện *</label>
                  <select
                    name="district"
                    value={formData.district || ''}
                    onChange={handleInputChange}
                    className={errors.district ? 'error' : ''}
                    disabled={locationData.loadingDistricts || !formData.province}
                  >
                    <option value="">
                      {locationData.loadingDistricts ? 'Đang tải...' :
                        !formData.province ? 'Chọn tỉnh trước' : 'Chọn quận/huyện'}
                    </option>
                    {locationData.districts.map(district => (
                      <option key={district.code} value={district.code}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                  {errors.district && <span className="error-text">{errors.district}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phường/Xã *</label>
                  <select
                    name="ward"
                    value={formData.ward || ''}
                    onChange={handleInputChange}
                    className={errors.ward ? 'error' : ''}
                    disabled={locationData.loadingWards || !formData.district}
                  >
                    <option value="">
                      {locationData.loadingWards ? 'Đang tải...' :
                        !formData.district ? 'Chọn quận trước' : 'Chọn phường/xã'}
                    </option>
                    {locationData.wards.map(ward => (
                      <option key={ward.code} value={ward.code}>
                        {ward.name}
                      </option>
                    ))}
                  </select>
                  {errors.ward && <span className="error-text">{errors.ward}</span>}
                </div>

                <div className="form-group">
                  <label>Địa chỉ chi tiết *</label>
                  <input
                    type="text"
                    name="detailAddress"
                    value={formData.detailAddress || ''}
                    onChange={handleInputChange}
                    placeholder="VD: 123 Nguyễn Văn A"
                    className={errors.detailAddress ? 'error' : ''}
                  />
                  {errors.detailAddress && <span className="error-text">{errors.detailAddress}</span>}
                </div>
              </div>

              {/* Google Maps */}
              <div className="form-group">
                <label>Vị trí trên bản đồ</label>
                <div className="map-container" style={{ marginBottom: '15px' }}>
                  {!isLoaded ? (
                    <div className="map-loading-placeholder">
                      <i className="fa fa-spinner fa-spin"></i>
                      <span>Đang tải Google Maps...</span>
                    </div>
                  ) : loadError ? (
                    <div className="map-error-placeholder">
                      <i className="fa fa-exclamation-triangle"></i>
                      <span>Lỗi tải Google Maps</span>
                    </div>
                  ) : (
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={formData.coordinates}
                      zoom={15}
                      options={mapOptions}
                      onClick={handleMapClick}
                    >
                      <Marker
                        position={formData.coordinates}
                        draggable={true}
                        onDragEnd={handleMapClick}
                      />
                    </GoogleMap>
                  )}
                </div>
                
                <div className="coordinates-display">
                  <span>Vĩ độ: {formData.coordinates?.lat?.toFixed(6) || 'N/A'}</span>
                  <span>Kinh độ: {formData.coordinates?.lng?.toFixed(6) || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Hình ảnh và video */}
            <div className="form-section">
              <h4>Hình ảnh và video</h4>

              <div className="form-group">
                <label>Hình ảnh hiện tại</label>
                {formData.existingImages?.length > 0 && (
                  <div className="image-preview-grid">
                    {formData.existingImages.map((img, index) => (
                      <div key={index} className="image-preview">
                        <img src={img} alt={`Existing ${index}`} />
                        <button
                          type="button"
                          className="remove-image"
                          onClick={() => handleRemoveExistingImage(index)}
                        >
                          <i className="fa fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Thêm hình ảnh mới</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <i className="fa fa-upload"></i>
                  Chọn hình ảnh
                </button>

                {formData.newImages?.length > 0 && (
                  <div className="image-preview-grid" style={{ marginTop: '10px' }}>
                    {formData.newImages.map((img, index) => (
                      <div key={index} className="image-preview">
                        <img src={img.url} alt={`New ${index}`} />
                        <button
                          type="button"
                          className="remove-image"
                          onClick={() => handleRemoveNewImage(index)}
                        >
                          <i className="fa fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Video</label>
                {formData.video && typeof formData.video === 'string' && (
                  <div className="video-preview" style={{ marginBottom: '10px' }}>
                    <video controls style={{ maxWidth: '200px', height: 'auto' }}>
                      <source src={formData.video} />
                    </video>
                    <button
                      type="button"
                      className="remove-video"
                      onClick={() => setFormData(prev => ({ ...prev, video: null }))}
                    >
                      <i className="fa fa-times"></i>
                      Xóa video
                    </button>
                  </div>
                )}

                <input
                  type="file"
                  ref={videoInputRef}
                  onChange={handleVideoUpload}
                  accept="video/*"
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => videoInputRef.current?.click()}
                >
                  <i className="fa fa-video-camera"></i>
                  {formData.video ? 'Thay đổi video' : 'Chọn video'}
                </button>

                {formData.video && formData.video.url && (
                  <div className="video-preview" style={{ marginTop: '10px' }}>
                    <video controls style={{ maxWidth: '200px', height: 'auto' }}>
                      <source src={formData.video.url} type={formData.video.file?.type} />
                    </video>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              type="submit"
              className={`btn btn-primary ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              <i className="fa fa-save"></i>
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPropertyModal;