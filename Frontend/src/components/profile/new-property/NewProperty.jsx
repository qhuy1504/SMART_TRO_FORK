import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { toast } from 'react-toastify';

import { postAPI } from '../../../services/propertiesAPI';
import { locationAPI } from '../../../services/locationAPI';
import './../ProfilePages.css';
import './NewProperty.css';

const libraries = ['places'];

const mapContainerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '8px'
};

const defaultCenter = {
  lat: 16.0583,
  lng: 108.2772
};

const mapOptions = {
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
};

const NewProperty = () => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const geocoderRef = useRef(null);
  
  // Cấu hình dayjs
  dayjs.extend(relativeTime);
  dayjs.locale("vi");

  // Load Google Maps script
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries
  });

  // Form state
  const [formData, setFormData] = useState({
    // Thông tin chủ nhà
    title: '',
    category: 'phong_tro',
    contactName: '',
    contactPhone: '',
    description: '',

    // Thông tin cơ bản & giá
    rentPrice: '',
    promotionPrice: '',
    deposit: '',
    area: '',
    electricPrice: '',
    waterPrice: '',
    maxOccupants: '1',
    availableDate: '',

    // Tiện ích
    amenities: [],
    fullAmenities: false,
    timeRules: '',

    // Nội quy
    houseRules: [],

    // Địa chỉ
    province: '',
    district: '',
    ward: '',
    detailAddress: '',
    coordinates: defaultCenter,

    // Media
    images: [],
    video: null,

    // Trạng thái
    isForRent: true
  });

  const [errors, setErrors] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [showMap, setShowMap] = useState(false);

  // Location data from API
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

  // Get user's current location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast.warn('Trình duyệt không hỗ trợ định vị!');
      setFormData(prev => ({
        ...prev,
        coordinates: defaultCenter
      }));
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          coordinates: { lat: latitude, lng: longitude }
        }));
        setGettingLocation(false);
        toast.success('Đã lấy vị trí hiện tại thành công!');
        console.log('User location:', { lat: latitude, lng: longitude });
      },
      (error) => {
        console.error('Error getting user location:', error);
        setGettingLocation(false);

        let errorMessage = '';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Người dùng từ chối chia sẻ vị trí';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Không thể xác định vị trí';
            break;
          case error.TIMEOUT:
            errorMessage = 'Hết thời gian chờ định vị';
            break;
          default:
            errorMessage = 'Lỗi không xác định khi định vị';
            break;
        }

        toast.error(`${errorMessage}. Sử dụng vị trí mặc định.`);
        setFormData(prev => ({
          ...prev,
          coordinates: defaultCenter
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  // Initialize user location when component mounts
  useEffect(() => {
    getUserLocation();
  }, []);

  // Handle modal show/hide và Google Maps
  useEffect(() => {
    if (showModal && isLoaded) {
      // Delay để modal render hoàn toàn trước khi hiển thị map
      const timer = setTimeout(() => {
        setShowMap(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setShowMap(false);
    }
  }, [showModal, isLoaded]);

  // Load provinces when component mounts
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        setLocationData(prev => ({ ...prev, loadingProvinces: true }));
        const provinces = await locationAPI.getProvinces();
        console.log('Provinces data:', provinces);
        setLocationData(prev => ({
          ...prev,
          provinces: provinces.data || [],
          loadingProvinces: false
        }));
      } catch (error) {
        console.error('Error loading provinces:', error);
        setLocationData(prev => ({ ...prev, loadingProvinces: false }));
      }
    };

    loadProvinces();
  }, []);

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

    loadDistricts();
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

    loadWards();
  }, [formData.district]);

  // Geocode address when all address fields are filled
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.province && formData.district && formData.ward && formData.detailAddress.trim()) {
        geocodeAddress();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData.province, formData.district, formData.ward, formData.detailAddress, isLoaded]);

  // Handle input changes
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
    } else if (name === 'availableDate') {
      if (value) {
        const inputDate = dayjs(value);
        const today = dayjs();

        if (inputDate.isBefore(today, 'day')) {
          setErrors(prev => ({
            ...prev,
            [name]: 'Ngày không được nhỏ hơn ngày hiện tại'
          }));
        } else {
          setErrors(prev => ({
            ...prev,
            [name]: ''
          }));
        }
      }

      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Convert date format for backend
  const formatDateForBackend = (dateString) => {
    if (!dateString) return '';
    const date = dayjs(dateString);
    if (date.isValid()) {
      return date.format('DD-MM-YYYY');
    }
    return dateString;
  };

  // Image upload handler
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);

        // kiểm tra tổng ảnh cũ + mới
    if (formData.images.length + files.length > 5) {
      setErrors(prev => ({
        ...prev,
        images: "Bạn chỉ được chọn tối đa 5 ảnh."
      }));
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, {
            file: file,
            url: event.target.result,
            name: file.name
          }]
        }));
      };
      reader.readAsDataURL(file);
    });

    if (errors.images) {
      setErrors(prev => ({
        ...prev,
        images: ''
      }));
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
      setErrors(prev => ({
        ...prev,
        video: ''
      }));
    }
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

  // Geocode address using Google Geocoding API
  const geocodeAddress = async () => {
    if (!isLoaded || !window.google || !formData.province || !formData.district || !formData.ward || !formData.detailAddress) {
      return;
    }

    const provinceData = locationData.provinces.find(p => p.code === formData.province);
    const districtData = locationData.districts.find(d => d.code === formData.district);
    const wardData = locationData.wards.find(w => w.code === formData.ward);

    if (!provinceData || !districtData || !wardData) {
      return;
    }

    const fullAddress = `${formData.detailAddress}, ${wardData.name}, ${districtData.name}, ${provinceData.name}, Vietnam`;

    try {
      setLocationData(prev => ({ ...prev, geocoding: true }));

      // Initialize geocoder if not already done
      if (!geocoderRef.current) {
        geocoderRef.current = new window.google.maps.Geocoder();
      }

      geocoderRef.current.geocode({ address: fullAddress }, (results, status) => {
        setLocationData(prev => ({ ...prev, geocoding: false }));

        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();

          setFormData(prev => ({
            ...prev,
            coordinates: { lat, lng }
          }));

          toast.success('Đã tìm thấy vị trí địa chỉ!');
          console.log('Geocoded address:', fullAddress, 'to coordinates:', { lat, lng });
        } else {
          console.error('Geocoding failed:', status);
          // Fallback to province/city center
          if (provinceData.name.toLowerCase().includes('hồ chí minh')) {
            setFormData(prev => ({ ...prev, coordinates: { lat: 10.8231, lng: 106.6297 } }));
          } else if (provinceData.name.toLowerCase().includes('hà nội')) {
            setFormData(prev => ({ ...prev, coordinates: { lat: 21.0285, lng: 105.8542 } }));
          } else if (provinceData.name.toLowerCase().includes('đà nẵng')) {
            setFormData(prev => ({ ...prev, coordinates: { lat: 16.0471, lng: 108.2068 } }));
          }
          toast.info('Không tìm thấy địa chỉ chính xác. Sử dụng vị trí ước tính.');
        }
      });
    } catch (error) {
      console.error('Error geocoding address:', error);
      setLocationData(prev => ({ ...prev, geocoding: false }));
      toast.error('Lỗi khi tìm kiếm địa chỉ');
    }
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      toast.info('Đang xử lý đăng tin...', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
      });

      // Tìm tên từ code để gửi lên backend
    const provinceData = locationData.provinces.find(p => p.code === formData.province);
    const districtData = locationData.districts.find(d => d.code === formData.district);
    const wardData = locationData.wards.find(w => w.code === formData.ward);

     
    const dataToSubmit = {
      ...formData,
      availableDate: formatDateForBackend(formData.availableDate),
      // Gửi cả code và name để backend có thể chọn
      province: provinceData?.name || formData.province,
      district: districtData?.name || formData.district,
      ward: wardData?.name || formData.ward,
      // Hoặc tạo object location
      location: {
        province: provinceData?.name || formData.province,
        district: districtData?.name || formData.district,
        ward: wardData?.name || formData.ward,
        detailAddress: formData.detailAddress,
        coordinates: formData.coordinates
      }
    };

    console.log('Data to submit:', dataToSubmit);

      const result = await postAPI.createPost(dataToSubmit);

      if (result.success) {
        toast.success(`Đăng tin thành công! "${formData.title}" - Trạng thái: Chờ admin duyệt`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
        });

        setShowModal(false);

        // Reset form
        setFormData({
          title: '',
          category: 'phong_tro',
          contactName: '',
          contactPhone: '',
          description: '',
          rentPrice: '',
          promotionPrice: '',
          deposit: '',
          area: '',
          electricPrice: '',
          waterPrice: '',
          maxOccupants: '1',
          availableDate: '',
          amenities: [],
          fullAmenities: false,
          timeRules: '',
          houseRules: [],
          province: '',
          district: '',
          ward: '',
          detailAddress: '',
          coordinates: defaultCenter,
          images: [],
          video: null,
          isForRent: true
        });

        setErrors({});
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (videoInputRef.current) videoInputRef.current.value = '';
        getUserLocation();

      } else {
        if (result.errors) {
          setErrors(result.errors);
          const errorCount = Object.keys(result.errors).length;
          toast.error(`${result.message || 'Dữ liệu không hợp lệ'}\nCó ${errorCount} lỗi cần sửa. Vui lòng kiểm tra lại form.`, {
            position: "top-right",
            autoClose: 7000,
            hideProgressBar: false,
          });

          setTimeout(() => {
            const firstErrorField = document.querySelector('.error');
            if (firstErrorField) {
              firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
              firstErrorField.focus();
            }
          }, 100);
        } else {
          toast.error(`${result.message || 'Có lỗi xảy ra khi đăng tin'}`, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
          });
        }
      }
    } catch (error) {
      console.error('Error creating post:', error);

      if (error.response) {
        const responseData = error.response.data;

        if (error.response.status === 400 && responseData.errors) {
          setErrors(responseData.errors);
          const errorCount = Object.keys(responseData.errors).length;

          toast.error(`${responseData.message || 'Dữ liệu không hợp lệ'}\nCó ${errorCount} lỗi cần sửa. Vui lòng kiểm tra lại form.`, {
            position: "top-right",
            autoClose: 7000,
            hideProgressBar: false,
          });

          setTimeout(() => {
            const firstErrorField = document.querySelector('.error');
            if (firstErrorField) {
              firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
              firstErrorField.focus();
            }
          }, 100);
        } else {
          let errorMessage = 'Lỗi server: ';
          if (error.response.status === 401) {
            errorMessage += 'Vui lòng đăng nhập lại';
          } else if (error.response.status === 413) {
            errorMessage += 'File upload quá lớn';
          } else {
            errorMessage += responseData?.message || 'Lỗi không xác định từ server';
          }

          toast.error(errorMessage, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
          });
        }
      } else if (error.request) {
        toast.error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet.', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
        });
      } else {
        toast.error(`Lỗi không xác định: ${error.message}`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle loading and error states
  if (loadError) {
    console.error('Error loading Google Maps:', loadError);
  }

  return (
    <div className="profile-page">
      <div className="page-header">
        <h2>
          <i className="fa fa-plus-circle"></i>
          {t('profile.newPost.title') || 'Đăng tin mới'}
        </h2>
        <p>{t('profile.newPost.subtitle') || 'Tạo tin đăng cho thuê phòng trọ'}</p>
      </div>

      <div className="content-card-new-property">
        <button
          className="btn btn-primary btn-lg"
          onClick={() => setShowModal(true)}
        >
          <i className="fa fa-plus"></i>
          Tạo tin đăng mới
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="post-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tạo tin đăng mới</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <i className="fa fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="post-new-property">
              <div className="form-content">
                {/* Thông tin chủ nhà */}
                <div className="form-section">
                  <h4>Thông tin chủ nhà</h4>
                  <p className="hint">Nhập các thông tin về người cho thuê</p>

                  <div className="form-group">
                    <label>Tiêu đề *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="VD: Cho thuê phòng trọ 18m2 giá rẻ tại Bình Thành"
                      className={errors.title ? 'error' : ''}
                    />
                    {errors.title && <span className="error-text">{errors.title}</span>}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Danh mục thuê *</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                      >
                        {categories.map(cat => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Tên người liên hệ *</label>
                      <input
                        type="text"
                        name="contactName"
                        value={formData.contactName}
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
                      value={formData.contactPhone}
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
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Nhập mô tả về nhà cho thuê..."
                      rows="4"
                      className={errors.description ? 'error' : ''}
                    />
                    {errors.description && <span className="error-text">{errors.description}</span>}
                  </div>
                </div>

                {/* Thông tin cơ bản & giá */}
                <div className="form-section">
                  <h4>Thông tin cơ bản & giá</h4>
                  <p className="hint">Nhập các thông tin về phòng cho thuê</p>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Giá thuê (VNĐ/tháng) *</label>
                      <input
                        type="number"
                        name="rentPrice"
                        value={formData.rentPrice}
                        onChange={handleInputChange}
                        placeholder="VD: 3000000"
                        className={errors.rentPrice ? 'error' : ''}
                      />
                      {errors.rentPrice && <span className="error-text">{errors.rentPrice}</span>}
                    </div>

                    <div className="form-group">
                      <label>Giá thuê khuyến mãi (VNĐ/tháng)</label>
                      <input
                        type="number"
                        name="promotionPrice"
                        value={formData.promotionPrice}
                        onChange={handleInputChange}
                        placeholder="VD: 2500000"
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
                        value={formData.deposit}
                        onChange={handleInputChange}
                        placeholder="VD: 3000000"
                        className={errors.deposit ? 'error' : ''}
                      />
                      {errors.deposit && <span className="error-text">{errors.deposit}</span>}
                    </div>

                    <div className="form-group">
                      <label>Diện tích (m²) *</label>
                      <input
                        type="number"
                        name="area"
                        value={formData.area}
                        onChange={handleInputChange}
                        placeholder="VD: 18"
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
                        value={formData.electricPrice}
                        onChange={handleInputChange}
                        placeholder="VD: 3500"
                        className={errors.electricPrice ? 'error' : ''}
                      />
                      {errors.electricPrice && <span className="error-text">{errors.electricPrice}</span>}
                    </div>

                    <div className="form-group">
                      <label>Giá nước (VNĐ/m³)</label>
                      <input
                        type="number"
                        name="waterPrice"
                        value={formData.waterPrice}
                        onChange={handleInputChange}
                        placeholder="VD: 15000"
                        className={errors.waterPrice ? 'error' : ''}
                      />
                      {errors.waterPrice && <span className="error-text">{errors.waterPrice}</span>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Tối đa người ở/phòng</label>
                      <select
                        name="maxOccupants"
                        value={formData.maxOccupants}
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
                        value={formData.availableDate}
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
                        checked={formData.fullAmenities}
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
                          checked={formData.amenities.includes(amenity.value)}
                          onChange={handleInputChange}
                          disabled={formData.fullAmenities}
                        />
                        <span className="amenity-text-post">{amenity.label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="form-group">
                    <label>Quy định giờ giấc</label>
                    <textarea
                      name="timeRules"
                      value={formData.timeRules}
                      onChange={handleInputChange}
                      placeholder="VD: Giờ giấc tự do, tắt đèn 22h..."
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
                          checked={formData.houseRules.includes(rule.value)}
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
                        value={formData.province}
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
                        value={formData.district}
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
                        value={formData.ward}
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
                        value={formData.detailAddress}
                        onChange={handleInputChange}
                        placeholder="VD: 123 Nguyễn Văn A"
                        className={errors.detailAddress ? 'error' : ''}
                      />
                      {errors.detailAddress && <span className="error-text">{errors.detailAddress}</span>}
                    </div>
                  </div>

                  {/* Google Maps */}
                  <div className="form-group">
                    <label>
                      Vị trí trên bản đồ
                      {(gettingLocation || locationData.geocoding) && (
                        <span className="geocoding-status">
                          {gettingLocation ? ' - Đang lấy vị trí hiện tại...' : ' - Đang tìm địa chỉ...'}
                        </span>
                      )}
                    </label>

                    <div className="map-container" style={{ marginBottom: '15px', height: '300px' }}>
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
                      ) : showMap ? (
                        <GoogleMap
                          key={mapKey}
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
                      ) : (
                        <div className="map-loading-placeholder">
                          <i className="fa fa-spinner fa-spin"></i>
                          <span>Đang khởi tạo bản đồ...</span>
                        </div>
                      )}
                    </div>

                    <div className="coordinates-info">
                      <div className="coordinate-display">
                        <div className="coordinate-item">
                          <i className="fa fa-map-marker"></i>
                          <span>Vĩ độ: {formData.coordinates?.lat?.toFixed(6) || 'N/A'}</span>
                        </div>
                        <div className="coordinate-item">
                          <i className="fa fa-compass"></i>
                          <span>Kinh độ: {formData.coordinates?.lng?.toFixed(6) || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="location-actions">
                        <p className="address-hint">
                          💡 Nhấp vào bản đồ để chọn vị trí chính xác hoặc kéo marker để di chuyển
                        </p>
                        <div className="location-buttons">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={getUserLocation}
                            disabled={gettingLocation}
                          >
                            <i className={`fa ${gettingLocation ? 'fa-spinner fa-spin' : 'fa-location-arrow'}`}></i>
                            {gettingLocation ? 'Đang định vị...' : 'Lấy vị trí hiện tại'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                coordinates: defaultCenter
                              }));
                              toast.info('Đã đặt lại vị trí về trung tâm Việt Nam');
                            }}
                          >
                            <i className="fa fa-refresh"></i>
                            Đặt lại vị trí mặc định
                          </button>
                          {formData.province && formData.district && formData.ward && formData.detailAddress && (
                            <button
                              type="button"
                              className="btn btn-info btn-sm"
                              onClick={geocodeAddress}
                              disabled={locationData.geocoding}
                            >
                              <i className={`fa ${locationData.geocoding ? 'fa-spinner fa-spin' : 'fa-search'}`}></i>
                              {locationData.geocoding ? 'Đang tìm...' : 'Tìm theo địa chỉ'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hình ảnh và video */}
                <div className="form-section">
                  <h4>Hình ảnh và video</h4>

                  <div className="form-group">
                    <label>Hình ảnh (tối đa 5 ảnh) *</label>
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
                      className="btn btn-secondary"
                      onClick={() => fileInputRef.current.click()}
                    >
                      <i className="fa fa-upload"></i>
                      Chọn hình ảnh
                    </button>
                    {errors.images && <span className="error-text">{errors.images}</span>}

                    {formData.images.length > 0 && (
                      <div className="image-preview-grid">
                        {formData.images.map((img, index) => (
                          <div key={index} className="image-preview">
                            <img src={img.url} alt={`Preview ${index}`} />
                            <button
                              type="button"
                              className="remove-image"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  images: prev.images.filter((_, i) => i !== index)
                                }));
                              }}
                            >
                              <i className="fa fa-times"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Video (tùy chọn)</label>
                    <input
                      type="file"
                      ref={videoInputRef}
                      onChange={handleVideoUpload}
                      accept="video/*"
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => videoInputRef.current.click()}
                    >
                      <i className="fa fa-video-camera"></i>
                      Chọn video
                    </button>
                    {errors.video && <span className="error-text">{errors.video}</span>}

                    {formData.video && (
                      <div className="video-preview">
                        <video controls style={{ maxWidth: '300px', height: 'auto' }}>
                          <source src={formData.video.url} type={formData.video.file.type} />
                        </video>
                        <button
                          type="button"
                          className="remove-video"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              video: null
                            }));
                          }}
                        >
                          <i className="fa fa-times"></i>
                          Xóa video
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit buttons */}
              <div className="form-actions-management">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className={`btn btn-primary ${isSubmitting ? 'loading' : ''}`}
                  disabled={isSubmitting}
                >
                  <i className="fa fa-paper-plane"></i>
                  {isSubmitting ? 'Đang đăng tin...' : 'Đăng tin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewProperty;