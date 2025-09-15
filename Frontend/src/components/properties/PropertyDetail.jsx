import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { propertyDetailAPI } from '../../services/propertyDetailAPI';
import { myPropertiesAPI } from '../../services/myPropertiesAPI';
import propertiesAPI from '../../services/propertiesAPI';
import { locationAPI } from '../../services/locationAPI';
import { reportsAPI } from '../../services/reportsAPI';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import {
  FaMapMarkerAlt,
  FaRuler,
  FaUsers,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaEye,
  FaHeart,
  FaRegHeart,
  FaPhone,
  FaEnvelope,
  FaUser,
  FaChevronLeft,
  FaChevronRight,
  FaExpand,
  FaPlay,
  FaClock,
  FaHome,
  FaCheck,
  FaTimes,
  FaShare,
  FaFlag,
  FaImage,
  FaVideo,
  FaMap,
  FaSearch,
  FaAngleLeft,
  FaAngleRight,
  FaNewspaper,
  FaUserPlus,
  FaArrowUp,
  FaSync
} from 'react-icons/fa';
import Comments from './Comments';
import './PropertyDetail.css';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toggleFavorite, isFavorited } = useFavorites();

  // States
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0); // New state for combined media
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalActiveTab, setModalActiveTab] = useState('images'); // 'images', 'videos', 'map'
  const [isTabChanging, setIsTabChanging] = useState(false);
  const [relatedProperties, setRelatedProperties] = useState([]);
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [addressInfo, setAddressInfo] = useState({
    provinceName: '',
    districtName: '',
    wardName: ''
  });
  const [localIsFavorited, setLocalIsFavorited] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({
    reason: '',
    description: '',
    contactEmail: ''
  });
  const [captchaValue, setCaptchaValue] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  // States cho chức năng tìm kiếm và carousel
  const [nearbyProperties, setNearbyProperties] = useState([]);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [suggestedSearches, setSuggestedSearches] = useState([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [showGoToTop, setShowGoToTop] = useState(false);


  // Load property detail
  useEffect(() => {
    if (id) {
      loadPropertyDetail();
      loadRelatedProperties();
      loadFeaturedProperties();
    }
  }, [id]);

  // Debug: Theo dõi thay đổi favorite status
  useEffect(() => {
    if (property?._id) {
      const contextIsFavorited = isFavorited(property._id);
      const finalStatus = property.isFavorited || contextIsFavorited;
      setLocalIsFavorited(finalStatus);

    }
  }, [property?._id, property?.isFavorited, isFavorited]);

  // Load nearby properties và tạo gợi ý tìm kiếm
  useEffect(() => {
    if (property && addressInfo.districtName) {
      loadNearbyProperties();
      generateSuggestedSearches();
    }
  }, [property, addressInfo]);

  // Update meta tags for social sharing
  useEffect(() => {
    if (property) {
      // Update page title
      document.title = `${property.title} - ${formatPrice(property.rentPrice)}/tháng`;

      // Update or create Open Graph meta tags
      const updateMetaTag = (property, content) => {
        let tag = document.querySelector(`meta[property="${property}"]`);
        if (!tag) {
          tag = document.createElement('meta');
          tag.setAttribute('property', property);
          document.head.appendChild(tag);
        }
        tag.setAttribute('content', content);
      };

      const updateNameMetaTag = (name, content) => {
        let tag = document.querySelector(`meta[name="${name}"]`);
        if (!tag) {
          tag = document.createElement('meta');
          tag.setAttribute('name', name);
          document.head.appendChild(tag);
        }
        tag.setAttribute('content', content);
      };

      // Open Graph tags for Facebook
      updateMetaTag('og:title', property.title);
      updateMetaTag('og:description', `${formatPrice(property.rentPrice)}/tháng • ${property.area}m² • ${property.detailAddress}`);
      updateMetaTag('og:image', property.images?.[0] || '');
      updateMetaTag('og:url', window.location.href);
      updateMetaTag('og:type', 'website');
      updateMetaTag('og:site_name', 'Smart Tro');

      // Twitter Card tags
      updateNameMetaTag('twitter:card', 'summary_large_image');
      updateNameMetaTag('twitter:title', property.title);
      updateNameMetaTag('twitter:description', `${formatPrice(property.rentPrice)}/tháng • ${property.area}m² • ${property.detailAddress}`);
      updateNameMetaTag('twitter:image', property.images?.[0] || '');
    }

    // Cleanup function
    return () => {
      // Reset title when component unmounts
      document.title = 'Smart Tro';
    };
  }, [property]);

  useEffect(() => {
    const handleScroll = () => {
      setShowGoToTop(window.pageYOffset > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Generate captcha when modal opens
  useEffect(() => {
    if (showReportModal) {
      generateCaptcha();
    }
  }, [showReportModal]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Generate simple math captcha
  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const answer = num1 + num2;
    setCaptchaAnswer(answer.toString());
    setCaptchaQuestion(`${num1} + ${num2} = ?`);
  };

  // Handle report modal
  const handleOpenReportModal = () => {
    setReportForm({
      reason: '',
      description: '',
      contactEmail: user?.email || ''
    });
    setCaptchaValue('');
    setShowReportModal(true);
  };

  const handleReportFormChange = (field, value) => {
    setReportForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitReport = async () => {
    // Validation
    if (!reportForm.reason) {
      toast.error('Vui lòng chọn lý do báo cáo');
      return;
    }

    if (reportForm.reason === 'other' && !reportForm.description.trim()) {
      toast.error('Vui lòng nhập mô tả chi tiết');
      return;
    }

    if (!reportForm.contactEmail.trim()) {
      toast.error('Vui lòng nhập email liên hệ');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(reportForm.contactEmail)) {
      toast.error('Email không hợp lệ');
      return;
    }

    if (captchaValue !== captchaAnswer) {
      toast.error('Mã xác minh không đúng');
      return;
    }

    try {
      setReportSubmitting(true);

      const reportData = {
        propertyId: property._id,
        propertyTitle: property.title,
        reason: reportForm.reason,
        description: reportForm.description,
        contactEmail: reportForm.contactEmail,
        reportedBy: user?._id,
        propertyOwner: property.owner?._id
      };

      await reportsAPI.reportProperty(property._id, reportData);

      toast.success('Báo cáo của bạn đã được gửi thành công. Chúng tôi sẽ xem xét và phản hồi trong thời gian sớm nhất.');
      setShowReportModal(false);

      // Reset form
      setReportForm({
        reason: '',
        description: '',
        contactEmail: ''
      });
      setCaptchaValue('');
      setCaptchaQuestion('');

    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi gửi báo cáo');
    } finally {
      setReportSubmitting(false);
    }
  };

  const loadPropertyDetail = async () => {
    try {
      setLoading(true);
      const response = await propertyDetailAPI.getPropertyDetail(id);
      if (response.success) {
        console.log('Property detail response:', response.data);
        setProperty(response.data);


        // Load address info if we have location codes
        if (response.data.province && response.data.district && response.data.ward) {
          await loadAddressInfo(response.data.province, response.data.district, response.data.ward);
        }

        // View tracking is now handled only by PropertyCard when clicked
        // No automatic view tracking on page load to avoid double counting
      } else {
        setError('Không tìm thấy tin đăng');
      }
    } catch (error) {
      console.error('Error loading property:', error);
      setError('Lỗi khi tải thông tin tin đăng');
    } finally {
      setLoading(false);
    }
  };

  const loadAddressInfo = async (provinceCode, districtCode, wardCode) => {
    try {

      // Step 1: Load provinces and find province name
      const provincesRes = await locationAPI.getProvinces();
      if (provincesRes.success && provincesRes.data) {
        const foundProvince = provincesRes.data.find(p => p.code == provinceCode);
        if (foundProvince) {

          setAddressInfo(prev => ({ ...prev, provinceName: foundProvince.name }));

          // Step 2: Load districts for this province and find district name
          const districtsRes = await locationAPI.getDistricts(provinceCode);
          if (districtsRes.success && districtsRes.data) {
            const foundDistrict = districtsRes.data.find(d => d.code == districtCode);
            if (foundDistrict) {
              setAddressInfo(prev => ({ ...prev, districtName: foundDistrict.name }));

              // Step 3: Load wards for this district and find ward name
              const wardsRes = await locationAPI.getWards(districtCode);
              if (wardsRes.success && wardsRes.data) {
                const foundWard = wardsRes.data.find(w => w.code == wardCode);
                if (foundWard) {

                  setAddressInfo(prev => ({ ...prev, wardName: foundWard.name }));
                } else {
                  console.log('Ward not found for code:', wardCode);
                }
              } else {
                console.log('Failed to load wards for district:', districtCode);
              }
            } else {
              console.log('District not found for code:', districtCode);
            }
          } else {
            console.log('Failed to load districts for province:', provinceCode);
          }
        } else {
          console.log('Province not found for code:', provinceCode);
        }
      } else {
        console.log('Failed to load provinces');
      }
    } catch (error) {
      console.error('Error loading address info:', error);
    }
  };



  const loadRelatedProperties = async () => {
    try {
      // Load properties from same district
      const response = await myPropertiesAPI.getMyApprovedProperties({
        limit: 8, // Tăng limit để có đủ sau khi filter
        page: 1
      });
      if (response.success) {
        // Loại bỏ tin đăng hiện tại khỏi danh sách related
        const filtered = response.data?.properties?.filter(p => p._id !== id) || [];
        setRelatedProperties(filtered.slice(0, 4)); // Chỉ lấy 4 tin sau khi filter
      }
    } catch (error) {
      console.error('Error loading related properties:', error);
    }
  };

  const loadFeaturedProperties = async () => {
    try {
      // Load featured properties
      const response = await myPropertiesAPI.getMyApprovedProperties({
        limit: 8, // Tăng limit để có đủ sau khi filter
        page: 1,
        sortBy: 'views',
        sortOrder: 'desc'
      });

      if (response.success) {
        // Loại bỏ tin đăng hiện tại khỏi danh sách featured
        const filtered = response.data?.properties?.filter(p => p._id !== id) || [];
        setFeaturedProperties(filtered.slice(0, 5)); // Chỉ lấy 5 tin sau khi filter
      }
    } catch (error) {
      console.error('Error loading featured properties:', error);
    }
  };

  // Load tin đăng cùng khu vực
  const loadNearbyProperties = async () => {
    if (!property || !addressInfo.districtName) return;

    try {
      setIsLoadingNearby(true);

      // Tìm kiếm theo district và ward
      const response = await myPropertiesAPI.getMyApprovedPropertiesLocation({
        limit: 12,
        page: 1,
        district: property.district,
        ward: property.ward
      });


      if (response.success) {
        // Loại bỏ tin đăng hiện tại khỏi danh sách
        const filtered = response.data?.properties?.filter(p => p._id !== property._id) || [];
        setNearbyProperties(filtered);
        console.log('Nearby properties response:', filtered);
      }
    } catch (error) {
      console.error('Error loading nearby properties:', error);
    } finally {
      setIsLoadingNearby(false);
    }
  };

  // Tạo gợi ý tìm kiếm
  const generateSuggestedSearches = () => {
    if (!property || !addressInfo.districtName) return;

    const suggestions = [
      `Cho thuê phòng trọ ${addressInfo.districtName}`,
      `Căn hộ ${addressInfo.districtName}`,
      `Phòng trọ ${addressInfo.wardName}`,
      `Nhà trọ ${addressInfo.districtName}`,
      `Homestay ${addressInfo.districtName}`,
      `Studio ${addressInfo.districtName}`
    ];

    setSuggestedSearches(suggestions);
  };

  // Xử lý tìm kiếm theo gợi ý
  const handleSuggestedSearch = (keyword) => {
    // Chuyển đến trang tìm kiếm với từ khóa
    navigate(`/properties?search=${encodeURIComponent(keyword)}`);
  };

  // Navigation cho carousel
  const nextSlide = () => {
    if (nearbyProperties.length === 0) return;
    setCurrentCarouselIndex((prev) =>
      prev >= nearbyProperties.length - 4 ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    if (nearbyProperties.length === 0) return;
    setCurrentCarouselIndex((prev) =>
      prev === 0 ? Math.max(0, nearbyProperties.length - 4) : prev - 1
    );
  };

  // Handle favorite toggle
  const handleFavoriteToggle = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để sử dụng tính năng này');
      navigate('/login');
      return;
    }

    try {
      // Optimistic update: cập nhật UI ngay lập tức
      setLocalIsFavorited(!localIsFavorited);

      const success = await toggleFavorite(property._id);
      if (success) {
        // Cập nhật property state để đồng bộ
        setProperty(prev => ({
          ...prev,
          isFavorited: !localIsFavorited
        }));
      } else {
        // Nếu thất bại, revert lại UI
        setLocalIsFavorited(localIsFavorited);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert lại UI nếu có lỗi
      setLocalIsFavorited(localIsFavorited);
    }
  };

  // Handle share functionality
  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleCopyLink = async () => {
    const currentUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(currentUrl);
      toast.success('Đã sao chép link vào clipboard!');
      setShowShareModal(false);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = currentUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Đã sao chép link vào clipboard!');
      setShowShareModal(false);
    }
  };

  // Create formatted share text for Facebook
  const createShareText = () => {
    if (!property) return '';

    const price = formatPrice(property.rentPrice);
    const area = property.area ? `${property.area}m²` : '';
    const location = property.detailAddress || '';
    const description = property.description || '';

    return `${property.title}

Giá: ${price}/tháng
Diện tích: ${area}
Địa chỉ: ${location}

Mô tả:
${description.length > 200 ? description.substring(0, 200) + '...' : description}

Xem chi tiết tại: ${window.location.href}`;
  };

  const handleShareFacebook = () => {
    const currentUrl = encodeURIComponent(window.location.href);
    const shareText = encodeURIComponent(createShareText());
    console.log('Share text:', shareText);

    // Use Facebook share dialog with quote parameter for rich content
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}&quote=${shareText}`;

    window.open(facebookUrl, '_blank', 'width=600,height=500,scrollbars=yes,resizable=yes');
    setShowShareModal(false);
  };


  // Helper function to create combined media array
  const getCombinedMedia = () => {
    const media = [];

    // Add video first (priority position)
    if (property?.video) {
      media.push({
        type: 'video',
        src: property.video,
        index: 0,
        originalIndex: 0
      });
    }

    // Add images after video
    if (property?.images?.length > 0) {
      property.images.forEach((image, index) => {
        media.push({
          type: 'image',
          src: image,
          index: media.length,
          originalIndex: index
        });
      });
    }

    return media;
  };

  // Handle modal open
  const handleOpenModal = () => {
    const combinedMedia = getCombinedMedia();
    const currentMedia = combinedMedia[currentMediaIndex];

    // Set appropriate tab based on current media type
    if (currentMedia?.type === 'video') {
      setModalActiveTab('videos');
    } else {
      setModalActiveTab('images');
    }

    setShowImageModal(true);
  };

  // Handle smooth tab transition
  const handleTabChange = (newTab) => {
    if (newTab === modalActiveTab) return;

    setIsTabChanging(true);

    // Wait for fade out animation
    setTimeout(() => {
      setModalActiveTab(newTab);
      setIsTabChanging(false);
    }, 200);
  };

  // Media navigation for gallery
  const nextMedia = () => {
    const combinedMedia = getCombinedMedia();
    if (combinedMedia.length > 0) {
      setCurrentMediaIndex((prev) =>
        prev === combinedMedia.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handlePrevMedia = () => {
    const combinedMedia = getCombinedMedia();
    if (combinedMedia.length > 0) {
      setCurrentMediaIndex((prev) =>
        prev === 0 ? combinedMedia.length - 1 : prev - 1
      );
    }
  };

  // Image navigation (for modal only)
  const nextImage = () => {
    if (property?.images?.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === property.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handlePrevImage = () => {
    if (property?.images?.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? property.images.length - 1 : prev - 1
      );
    }
  };

  // Format price
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN').format(price);
    };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  // Format category to Vietnamese
  const formatCategory = (category) => {
    const categoryMap = {
      'phong_tro': 'Phòng trọ',
      'can_ho': 'Căn hộ',
      'nha_nguyen_can': 'Nhà nguyên căn',
      'chung_cu_mini': 'Chung cư mini',
      'homestay': 'Homestay'
    };
    return categoryMap[category] || category;
  };

  if (loading) {
    return (
      <div className="property-detail-loading">
        <div className="loading-spinner">
          <i className="fa fa-spinner fa-spin"></i>
        </div>
        <p>Đang tải thông tin tin đăng...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="property-detail-error">
        <div className="error-content">
          <i className="fa fa-exclamation-triangle"></i>
          <h3>{error || 'Không tìm thấy tin đăng'}</h3>
          <button onClick={() => navigate('/properties')} className="btn btn-primary">
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="property-detail">
      {/* Left Decorative Image */}
      <div className="left-decoration">
        <img
          src="https://res.cloudinary.com/dapvuniyx/image/upload/v1757584703/Screenshot_2025-09-11_165739_feoml8.png"
          alt="Decoration"
          className="decoration-image"
        />
      </div>

      {/* Right Decorative Image */}
      <div className="right-decoration">
        <img
          src="https://res.cloudinary.com/dapvuniyx/image/upload/v1757584703/Screenshot_2025-09-11_165739_feoml8.png"
          alt="Decoration"
          className="decoration-image"
        />
      </div>

      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <span onClick={() => navigate('/')}>Trang chủ</span>
          <span>/</span>
          <span onClick={() => navigate('/')}>Cho thuê</span>
          <span>/</span>
          <span>{property.title}</span>
        </div>

        <div className="property-detail-content">
          {/* Main Content */}
          <div className="property-main">
            {/* Media Gallery */}
            <div className="property-gallery">
              <div className="main-image">
                {(() => {
                  const combinedMedia = getCombinedMedia();
                  if (combinedMedia.length > 0) {
                    const currentMedia = combinedMedia[currentMediaIndex];
                    return (
                      <>
                        {currentMedia.type === 'image' ? (
                          <img
                            src={currentMedia.src}
                            alt={property.title}
                            onClick={handleOpenModal}
                          />
                        ) : (
                          <video
                            src={currentMedia.src}
                            controls
                            onClick={handleOpenModal}
                            preload="metadata"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              cursor: 'pointer',
                              borderRadius: '8px'
                            }}
                          />
                        )}                        {combinedMedia.length > 1 && (
                          <>
                            <button className="nav-btn prev-btn" onClick={handlePrevMedia}>
                              <FaChevronLeft />
                            </button>
                            <button className="nav-btn next-btn" onClick={nextMedia}>
                              <FaChevronRight />
                            </button>
                          </>
                        )}

                        <button className="expand-btn" onClick={handleOpenModal}>
                          <FaExpand />
                        </button>

                        <div className="image-counter">
                          {currentMediaIndex + 1} / {combinedMedia.length}
                          {currentMedia.type === 'video' && (
                            <span className="media-type-indicator">
                              <FaPlay style={{ marginLeft: '5px', fontSize: '10px' }} />
                            </span>
                          )}
                        </div>
                      </>
                    );
                  } else {
                    return (
                      <div className="no-image">
                        <FaHome />
                        <span>Không có hình ảnh hoặc video</span>
                      </div>
                    );
                  }
                })()}
              </div>

              {/* Media thumbnail strip */}
              {(() => {
                const combinedMedia = getCombinedMedia();

                if (combinedMedia.length > 1) {
                  return (
                    <div className="thumbnail-strip">
                      {combinedMedia.map((media, index) => (
                        <div
                          key={index}
                          className={`thumbnail ${index === currentMediaIndex ? 'active' : ''} ${media.type === 'video' ? 'video-thumbnail' : ''}`}
                          onClick={() => setCurrentMediaIndex(index)}
                        >
                          {media.type === 'image' ? (
                            <img src={media.src} alt={`${property.title} ${index + 1}`} />
                          ) : (
                            <div className="video-thumbnail-container">
                              <video
                                src={media.src}
                                preload="metadata"
                                muted
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                              <div className="video-play-overlay">
                                <FaPlay />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Property Info */}
            <div className="property-info">
              <div className="property-header-detail">
                <h1 className="property-title-detail">{property.title}</h1>


              </div>
              <div className="property-actions-detail">
                <div className="meta-stats">
                  <span className="meta-item-stats">
                    <FaEye />
                    {property.views || 0} lượt xem
                  </span>
                  <span className="meta-item-stats">
                    <FaClock />
                    {formatDate(property.createdAt)}
                  </span>
                </div>
                <div className="meta-stats">
                  <button
                    className={`favorite-btn ${localIsFavorited ? 'favorited' : ''}`}
                    onClick={handleFavoriteToggle}
                    title={localIsFavorited ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
                  >
                    {localIsFavorited ? <FaHeart /> : <FaRegHeart />}
                  </button>
                  <button className="share-btn" onClick={handleShare} title="Chia sẻ">
                    <FaShare />
                  </button>
                  <button className="report-btn" onClick={handleOpenReportModal} title="Báo cáo">
                    <FaFlag />
                  </button>
                </div>
              </div>


              <div className="property-meta-detail">
                <div className="meta-item-detail-address">
                  <FaMapMarkerAlt />
                  <span>
                    {property.detailAddress}
                    {addressInfo.wardName && `, ${addressInfo.wardName}`}
                    {addressInfo.districtName && `, ${addressInfo.districtName}`}
                    {addressInfo.provinceName && `, ${addressInfo.provinceName}`}
                  </span>
                </div>


                {/* Mini Map */}
                {property.coordinates?.lat && property.coordinates?.lng && (
                  <div className="property-mini-map">
                    <div className="mini-map-container">
                      <MapContainer
                        center={[property.coordinates.lat, property.coordinates.lng]}
                        zoom={15}
                        style={{ height: '200px', width: '100%' }}
                        zoomControl={false}
                        dragging={false}
                        touchZoom={false}
                        doubleClickZoom={false}
                        scrollWheelZoom={false}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[property.coordinates.lat, property.coordinates.lng]}>
                          <Popup>
                            <div className="map-popup">
                              <h4>{property.title}</h4>
                              <p>
                                <FaMapMarkerAlt />
                                {property.detailAddress}
                              </p>
                            </div>
                          </Popup>
                        </Marker>
                      </MapContainer>
                      <div className="map-overlay" onClick={() => {
                        setModalActiveTab('map');
                        setShowImageModal(true);
                      }}>
                        <span className="view-larger-map">
                          <FaExpand />
                          Xem bản đồ lớn hơn
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="property-highlights">
                <div className="highlight-item price-detail">
                  <FaMoneyBillWave />
                  <div className="gia-thue">
                    <span className="label">Giá thuê</span>
                   <div className="label-price-detail">
                     <span className="value">{formatPrice(property.rentPrice)}</span>
                    <span className="per-month">VNĐ/tháng</span>
                   </div>
                  </div>
                </div>
                <div className="highlight-item">
                  <FaRuler />
                  <div>
                    <span className="label">Diện tích</span>
                    <span className="value">{property.area}m²</span>
                  </div>
                </div>
                <div className="highlight-item">
                  <FaUsers />
                  <div>
                    <span className="label">Sức chứa</span>
                    <span className="value">{property.maxOccupants} người</span>
                  </div>
                </div>
                <div className="highlight-item">
                  <FaHome />
                  <div>
                    <span className="label">Loại hình</span>
                    <span className="value">{formatCategory(property.category)}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="property-description-detail">
                <h3>Mô tả chi tiết</h3>
                <div className="description-content">
                  {property.description ? (
                    property.description
                      .split(/\r?\n/)
                      .filter(paragraph => paragraph.trim() !== '')
                      .map((paragraph, index) => (
                        <p key={index} className="description-paragraph">
                          {paragraph}
                        </p>
                      ))

                  ) : (
                    <p style={{ color: '#6c757d', fontStyle: 'italic' }}>
                      Chưa có mô tả chi tiết
                    </p>
                  )}
                </div>
              </div>

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div className="property-amenities-detail">
                  <h3>Tiện ích</h3>
                  <div className="amenities-list-detail">
                    {property.amenities.map((amenity, index) => (
                      <div key={index} className="amenity-item-detail">
                        <i className={amenity.icon}></i>
                        <span>{amenity.name || amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Info */}
              <div className="property-additional">
                <h3>Thông tin bổ sung</h3>
                <div className="additional-grid">
                  <div className="additional-item">
                    <span className="label">Mã tin:</span>
                    <span className="value">#{property._id}</span>
                  </div>
                  <div className="additional-item">
                    <span className="label">Ngày đăng:</span>
                    <span className="value">{formatDate(property.createdAt)}</span>
                  </div>
                  <div className="additional-item">
                    <span className="label">Trạng thái:</span>
                    <span className={`value status ${property.status}`}>
                      {property.status === 'available' ? 'Còn trống' : 'Đang cần cho thuê'}
                    </span>
                  </div>
                  {property.electricPrice && (
                    <div className="additional-item">
                      <span className="label">Giá điện:</span>
                      <span className="value">{property.electricPrice.toLocaleString()} VNĐ/kWh</span>
                    </div>
                  )}
                  {property.waterPrice && (
                    <div className="additional-item">
                      <span className="label">Giá nước:</span>
                      <span className="value">{property.waterPrice.toLocaleString()} VNĐ/m³</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Sidebar */}
          <div className="property-sidebar">
            {/* Contact Info */}
            <div className="contact-card">
              <h3>Thông tin liên hệ</h3>
              <div className="owner-info-detail">
                <div className="owner-avatar-detail">
                  {property.owner?.avatar ? (
                    <img src={property.owner.avatar} alt={property.owner?.fullName || 'Avatar'} />
                  ) : (
                    <FaUser />
                  )}
                </div>
                <div className="owner-details">
                  <h4>{property.owner?.fullName || 'Chủ trọ'}</h4>
                  <span className="owner-role">Chủ sở hữu</span>
                  <div className="owner-info-detail">
                    <span className="owner-count-property">
                      <FaNewspaper />
                      {property.owner?.propertyCount || 0} tin đăng
                    </span>
                    <span className="owner-createDate">
                      <FaUserPlus />
                      Tham gia từ: {formatDate(property.createdAt)}
                    </span>
                  </div>

                </div>
              </div>
              <div className="contact-buttons">
                <a
                  href={`tel:${property.owner?.phone}`}
                  className="contact-btn phone-btn"
                >
                  <FaPhone />
                  {property.owner?.phone || 'Hiển thị số'}
                </a>
                <a
                  href={`https://zalo.me/${property.owner?.phone}`}
                  className="contact-btn email-btn"
                >
                  <FaEnvelope />
                  Nhắn ZALO
                </a>
              </div>
            </div>

            {/* Featured Properties */}
            <div className="featured-properties">
              <h3>Tin đăng nổi bật</h3>
              <div className="featured-list">
                {featuredProperties.slice(0, 5).map((featuredProperty) => (
                  <div
                    key={featuredProperty._id}
                    className="featured-item"
                    onClick={() => navigate(`/properties/${featuredProperty._id}`)}
                  >
                    <div className="featured-image">
                      {featuredProperty.images && featuredProperty.images.length > 0 ? (
                        <img src={featuredProperty.images[0]} alt={featuredProperty.title} />
                      ) : (
                        <div className="no-image">
                          <FaHome />
                        </div>
                      )}
                    </div>
                    <div className="featured-info">
                      <h5 className="featured-title">{featuredProperty.title}</h5>
                      <p className="featured-price">
                        <span className="value">{formatPrice(featuredProperty.rentPrice)}</span>
                        <span className="per-month">VNĐ/tháng</span>
                      </p>
                      <p className="featured-location">
                        <FaMapMarkerAlt />
                        {featuredProperty.location?.districtName}, {featuredProperty.location?.provinceName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Related Properties */}
            <div className="related-properties">
              <h3>Tin đăng liên quan</h3>
              <div className="related-list">
                {relatedProperties.slice(0, 4).map((relatedProperty) => (
                  <div
                    key={relatedProperty._id}
                    className="related-item"
                    onClick={() => navigate(`/properties/${relatedProperty._id}`)}
                  >
                    <div className="related-image">
                      {relatedProperty.images && relatedProperty.images.length > 0 ? (
                        <img src={relatedProperty.images[0]} alt={relatedProperty.title} />
                      ) : (
                        <div className="no-image">
                          <FaHome />
                        </div>
                      )}
                    </div>
                    <div className="related-info">
                      <h5 className="related-title">{relatedProperty.title}</h5>
                      <p className="related-price">
                        <span className="value">{formatPrice(relatedProperty.rentPrice)}</span>
                        <span className="per-month">VNĐ/tháng</span>
                      </p>
                      <div className="related-meta">
                        <span><FaRuler /> {relatedProperty.area}m²</span>
                        <span><FaUsers /> {relatedProperty.maxOccupants} người</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Comments Section */}
        <div className="comments-section-wrapper">
          <Comments propertyId={property._id} />
        </div>

        {/* Search Suggestions Section */}
        <div className="search-suggestions-section">
          <div className="search-suggestions-container">
            <h3>
              <FaSearch />
              Từ khóa tìm kiếm gợi ý
            </h3>
            <div className="suggestions-list">
              {suggestedSearches.map((suggestion, index) => (
                <button
                  key={index}
                  className="suggestion-tag"
                  onClick={() => handleSuggestedSearch(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Nearby Properties Carousel */}
        {nearbyProperties.length > 0 && (
          <div className="nearby-properties-section">
            <div className="nearby-properties-container">
              <div className="nearby-header">
                <h3>
                  <FaMapMarkerAlt />
                  Tin đăng cùng khu vực {addressInfo.wardName}, {addressInfo.districtName}
                  <span className="nearby-count">({nearbyProperties.length} tin)</span>
                </h3>

                {nearbyProperties.length > 4 && (
                  <div className="carousel-controls">
                    <button
                      className="carousel-btn prev-btn"
                      onClick={prevSlide}
                      disabled={currentCarouselIndex === 0}
                    >
                      <FaAngleLeft />
                    </button>
                    <button
                      className="carousel-btn next-btn"
                      onClick={nextSlide}
                      disabled={currentCarouselIndex >= nearbyProperties.length - 4}
                    >
                      <FaAngleRight />
                    </button>
                  </div>
                )}
              </div>

              <div className="nearby-carousel">
                <div
                  className="nearby-carousel-track"
                  style={{
                    transform: `translateX(-${currentCarouselIndex * 25}%)`,
                    transition: 'transform 0.3s ease'
                  }}
                >
                  {nearbyProperties.map((nearbyProperty) => (
                    <div
                      key={nearbyProperty._id}
                      className="nearby-card"
                      onClick={() => navigate(`/properties/${nearbyProperty._id}`)}
                    >
                      <div className="nearby-card-image">
                        {nearbyProperty.images && nearbyProperty.images.length > 0 ? (
                          <img src={nearbyProperty.images[0]} alt={nearbyProperty.title} />
                        ) : (
                          <div className="no-image-placeholder">
                            <FaHome />
                          </div>
                        )}
                        {nearbyProperty.isPromoted && (
                          <div className="promoted-badge">Nổi bật</div>
                        )}
                        <div className="quick-rent-badge">Cho thuê nhanh</div>
                      </div>

                      <div className="nearby-card-content">
                        <h4 className="nearby-card-title">{nearbyProperty.title}</h4>
                        <p className="nearby-card-price">
                          {formatPrice(nearbyProperty.rentPrice)}/tháng
                        </p>
                        <p className="nearby-card-location">
                          <FaMapMarkerAlt />
                          {nearbyProperty.location.wardName}, {nearbyProperty.location.districtName}
                        </p>
                        <div className="nearby-card-meta">
                          <span className="meta-item-meta">
                            <FaRuler />
                            {nearbyProperty.area}m²
                          </span>
                          <span className="meta-item-meta">
                            <FaUsers />
                            {nearbyProperty.maxOccupants} người
                          </span>
                          <span className="meta-item-meta">
                            <FaEye />
                            {nearbyProperty.views || 0}
                          </span>
                        </div>

                        <div className="nearby-card-date">
                          <FaClock />
                          {formatDate(nearbyProperty.createdAt)}
                        </div>
                      </div>
                    </div>

                  ))}
                </div>
              </div>



              {/* Support Staff Section */}
              <div className="support-staff-section">
                <div className="support-staff-container">
                  <div className="support-staff-image">
                    <img
                      src="https://res.cloudinary.com/dapvuniyx/image/upload/v1757675058/contact-us-pana-orange_hfmwec.svg"
                      alt="Nhân viên hỗ trợ"
                      className="staff-avatar"
                    />
                  </div>
                  <div className="support-staff-content">
                    <h3>Hỗ trợ chủ nhà đăng tin 24/7</h3>
                    <p>Nếu bạn cần hỗ trợ đăng tin, vui lòng liên hệ số điện thoại bên dưới:</p>
                    <div className="support-contact">


                      <a
                        href={`tel:0355958399`}
                        className="contact-btn phone-btn"
                      >
                        <FaPhone />
                        0355958399
                      </a>

                      <a
                        href={`https://zalo.me/0355958399`}
                        className="contact-btn email-btn"
                      >
                        <FaEnvelope />
                        ZALO: 0355958399
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {nearbyProperties.length > 8 && (
                <div className="view-all-nearby">
                  <button
                    className="view-all-btn"
                    onClick={() => navigate(`/properties?district=${property.district}&ward=${property.ward}`)}
                  >
                    Xem tất cả tin đăng trong khu vực
                    <FaAngleRight />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading state for nearby properties */}
        {isLoadingNearby && (
          <div className="nearby-loading">
            <div className="loading-spinner">
              <i className="fa fa-spinner fa-spin"></i>
            </div>
            <p>Đang tải tin đăng cùng khu vực...</p>
          </div>
        )}
      </div>

      {/* Enhanced Modal with Tabs */}
      {showImageModal && property && (
        <div className="image-modal" onClick={() => setShowImageModal(false)}>
          <div className="modal-content-enhanced" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              className="close-modal-enhanced"
              onClick={() => setShowImageModal(false)}
            >
              <FaTimes />
            </button>

            {/* Modal Header with Tabs */}
            <div className="modal-header-detail">
              <div className="modal-tabs">
                <button
                  className={`modal-tab ${modalActiveTab === 'images' ? 'active' : ''}`}
                  onClick={() => handleTabChange('images')}
                >
                  <FaImage />
                  <span>Hình ảnh ({property.images?.length || 0})</span>
                </button>
                <button
                  className={`modal-tab ${modalActiveTab === 'videos' ? 'active' : ''}`}
                  onClick={() => handleTabChange('videos')}
                >
                  <FaVideo />
                  <span>Video ({property.video ? 1 : 0})</span>
                </button>
                <button
                  className={`modal-tab ${modalActiveTab === 'map' ? 'active' : ''}`}
                  onClick={() => handleTabChange('map')}
                >
                  <FaMap />
                  <span>Bản đồ</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="modal-body-detail">
              {/* Images Tab */}
              <div className={`tab-content images-tab ${modalActiveTab === 'images' && !isTabChanging ? 'active' : ''} ${isTabChanging && modalActiveTab === 'images' ? 'fade-out' : ''}`}>
                {property.images && property.images.length > 0 ? (
                  <>
                    <div className="modal-image-container">
                      <img src={property.images[currentImageIndex]} alt={property.title} />
                      {property.images.length > 1 && (
                        <>
                          <button className="modal-nav prev" onClick={handlePrevImage}>
                            <FaChevronLeft />
                          </button>
                          <button className="modal-nav next" onClick={nextImage}>
                            <FaChevronRight />
                          </button>
                        </>
                      )}
                      <div className="image-counter-modal">
                        {currentImageIndex + 1} / {property.images.length}
                      </div>
                    </div>



                    <div className="modal-thumbnails">
                      {property.images.map((image, index) => (
                        <div
                          key={index}
                          className={`modal-thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                          onClick={() => setCurrentImageIndex(index)}
                        >
                          <img src={image} alt={`${property.title} ${index + 1}`} />
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="no-content">
                    <FaImage />
                    <p>Không có hình ảnh</p>
                  </div>
                )}
              </div>

              {/* Videos Tab */}
              <div className={`tab-content videos-tab ${modalActiveTab === 'videos' && !isTabChanging ? 'active' : ''} ${isTabChanging && modalActiveTab === 'videos' ? 'fade-out' : ''}`}>
                {property.video ? (
                  <div className="videos-container">
                    <div className="video-item">
                      <video controls >
                        <source src={property.video} type="video/mp4" />
                        Trình duyệt của bạn không hỗ trợ video.
                      </video>
                    </div>
                  </div>
                ) : (
                  <div className="no-content">
                    <FaVideo />
                    <p>Không có video</p>
                  </div>
                )}
              </div>

              {/* Map Tab */}
              <div className={`tab-content map-tab ${modalActiveTab === 'map' && !isTabChanging ? 'active' : ''} ${isTabChanging && modalActiveTab === 'map' ? 'fade-out' : ''}`}>
                {property.coordinates?.lat && property.coordinates?.lng ? (
                  <MapContainer
                    center={[property.coordinates.lat, property.coordinates.lng]}
                    zoom={20}
                    style={{ height: '500px', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[property.coordinates.lat, property.coordinates.lng]}>
                      <Popup>
                        <div className="map-popup">
                          <h4>{property.title}</h4>
                          <p>
                            <FaMapMarkerAlt />
                            {property.detailAddress}
                            {addressInfo.wardName && `, ${addressInfo.wardName}`}
                            {addressInfo.districtName && `, ${addressInfo.districtName}`}
                            {addressInfo.provinceName && `, ${addressInfo.provinceName}`}
                          </p>
                          <p><FaMoneyBillWave /> {formatPrice(property.rentPrice)}/tháng</p>
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                ) : (
                  <div className="no-content">
                    <FaMap />
                    <p>Không có thông tin vị trí</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="share-modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="share-modal-header">
              <h3>
                <FaShare />
                Chia sẻ tin đăng
              </h3>
              <button
                className="close-share-modal"
                onClick={() => setShowShareModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="share-modal-body">
              <div className="share-property-preview">
                <div className="share-property-image">
                  {property.images && property.images.length > 0 ? (
                    <img src={property.images[0]} alt={property.title} />
                  ) : (
                    <div className="no-image-placeholder">
                      <FaHome />
                    </div>
                  )}
                </div>
                <div className="share-property-info">
                  <h4>{property.title}</h4>
                  <p className="share-price">{formatPrice(property.rentPrice)}/tháng</p>
                  <p className="share-location">
                    <FaMapMarkerAlt style={{ fontSize: '14px', color: '#ff0000ff' }} />
                    {property.detailAddress}, {addressInfo.wardName}, {addressInfo.districtName}, {addressInfo.provinceName}
                  </p>
                </div>
              </div>

              <div className="share-options">
                <button className="share-option copy-link" onClick={handleCopyLink}>
                  <i className="fa fa-copy"></i>
                  <span>Sao chép liên kết</span>
                </button>

                <button className="share-option facebook" onClick={handleShareFacebook}>
                  <i className="fab fa-facebook-f"></i>
                  <span>Facebook</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="report-modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()}>
            <div className="report-modal-header">
              <h3>
                <FaFlag />
                Báo cáo tin đăng
              </h3>
              <button
                className="close-report-modal"
                onClick={() => setShowReportModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="report-modal-body">
              <div className="report-property-preview">
                <div className="report-property-image">
                  {property.images && property.images.length > 0 ? (
                    <img src={property.images[0]} alt={property.title} />
                  ) : (
                    <div className="no-image-placeholder">
                      <FaHome />
                    </div>
                  )}
                </div>
                <div className="report-property-info">
                  <h4>{property.title}</h4>
                  <p className="report-price">{formatPrice(property.rentPrice)}/tháng</p>
                  <p className="report-location">
                    <FaMapMarkerAlt style={{ fontSize: '14px', color: '#ff0000ff' }} />
                    {property.detailAddress}, {addressInfo.wardName}, {addressInfo.districtName}, {addressInfo.provinceName}
                  </p>
                </div>
              </div>

              <form className="report-form">
                <div className="form-group-report">
                  <label>Lý do báo cáo *</label>
                  <div className="reason-options">
                    <label className="reason-option">
                      <input
                        type="radio"
                        name="reason"
                        value="fake"
                        checked={reportForm.reason === 'fake'}
                        onChange={(e) => handleReportFormChange('reason', e.target.value)}
                      />
                      <span>Tin đăng giả mạo</span>
                    </label>
                    <label className="reason-option">
                      <input
                        type="radio"
                        name="reason"
                        value="inappropriate"
                        checked={reportForm.reason === 'inappropriate'}
                        onChange={(e) => handleReportFormChange('reason', e.target.value)}
                      />
                      <span>Nội dung không phù hợp</span>
                    </label>
                    <label className="reason-option">
                      <input
                        type="radio"
                        name="reason"
                        value="spam"
                        checked={reportForm.reason === 'spam'}
                        onChange={(e) => handleReportFormChange('reason', e.target.value)}
                      />
                      <span>Spam hoặc lừa đảo</span>
                    </label>
                    <label className="reason-option">
                      <input
                        type="radio"
                        name="reason"
                        value="duplicate"
                        checked={reportForm.reason === 'duplicate'}
                        onChange={(e) => handleReportFormChange('reason', e.target.value)}
                      />
                      <span>Tin đăng trùng lặp</span>
                    </label>
                    <label className="reason-option">
                      <input
                        type="radio"
                        name="reason"
                        value="price"
                        checked={reportForm.reason === 'price'}
                        onChange={(e) => handleReportFormChange('reason', e.target.value)}
                      />
                      <span>Giá cả không chính xác</span>
                    </label>
                    <label className="reason-option">
                      <input
                        type="radio"
                        name="reason"
                        value="other"
                        checked={reportForm.reason === 'other'}
                        onChange={(e) => handleReportFormChange('reason', e.target.value)}
                      />
                      <span>Lý do khác</span>
                    </label>
                  </div>
                </div>

                {reportForm.reason === 'other' && (
                  <div className="form-group">
                    <label>Mô tả chi tiết *</label>
                    <textarea
                      rows="4"
                      placeholder="Vui lòng mô tả chi tiết lý do báo cáo..."
                      value={reportForm.description}
                      onChange={(e) => handleReportFormChange('description', e.target.value)}
                    />
                  </div>
                )}

                {reportForm.reason && reportForm.reason !== 'other' && (
                  <div className="form-group">
                    <label>Mô tả bổ sung (không bắt buộc)</label>
                    <textarea
                      rows="3"
                      placeholder="Thêm thông tin chi tiết nếu cần..."
                      value={reportForm.description}
                      onChange={(e) => handleReportFormChange('description', e.target.value)}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Email liên hệ *</label>
                  <input
                    type="email"
                    placeholder="Email để chúng tôi phản hồi"
                    value={reportForm.contactEmail}
                    onChange={(e) => handleReportFormChange('contactEmail', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Xác minh bảo mật *</label>
                  <div className="captcha-container">
                    <div className="captcha-question">
                      <span className="captcha-text">{captchaQuestion}</span>
                      <button
                        type="button"
                        className="refresh-captcha"
                        onClick={() => {
                          setCaptchaValue('');
                          generateCaptcha();
                        }}
                        title="Làm mới mã xác minh"
                      >
                        <FaSync />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Nhập kết quả"
                      value={captchaValue}
                      onChange={(e) => setCaptchaValue(e.target.value)}
                      className="captcha-input"
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="report-modal-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setShowReportModal(false)}
                disabled={reportSubmitting}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn-submit"
                onClick={handleSubmitReport}
                disabled={reportSubmitting}
              >
                {reportSubmitting ? (
                  <>
                    <i className="fa fa-spinner fa-spin"></i>
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <FaFlag />
                    Gửi báo cáo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showGoToTop && (
        <button
          className="go-to-top-btn"
          onClick={scrollToTop}
          aria-label="Go to top"
        >
          <FaArrowUp size={20} className="text-black" />
        </button>
      )}

    </div>
  );
};

export default PropertyDetail;
