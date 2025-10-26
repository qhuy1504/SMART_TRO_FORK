import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Area,
  AreaChart
} from 'recharts';
import axios from 'axios';
import RentalAnalyticsAPI from '../../../services/RentalAnalyticsAPI';
import '../ProfilePages.css';
import './RentalPriceAnalytics.css';

const RentalPriceAnalytics = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  // Removed selectedRegion state - using direct province selection
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [propertyCategory, setPropertyCategory] = useState('');
  const [areaRange, setAreaRange] = useState('');
  const [newsKeyword, setNewsKeyword] = useState('thuê phòng trọ');
  const [priceData, setPriceData] = useState([]);
  const [newsData, setNewsData] = useState([]);
  const [sentimentData, setSentimentData] = useState([]);
  const [priceRangeData, setPriceRangeData] = useState([]);
  const [regionComparison, setRegionComparison] = useState([]);

  // Location data states
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // Load provinces on component mount
  useEffect(() => {
    loadProvinces();
  }, []);

  // Load districts when province changes
  useEffect(() => {
    if (selectedProvince) {
      loadDistricts(selectedProvince);
    } else {
      setDistricts([]);
      setSelectedDistrict('');
    }
  }, [selectedProvince]);

  // Load analytics data when filters change
  useEffect(() => {
    loadAnalyticsData();
  }, [selectedProvince, selectedDistrict, propertyCategory, areaRange, newsKeyword]);

  // Load provinces on component mount
  useEffect(() => {
    loadProvinces();
  }, []);

  // Load provinces from API
  const loadProvinces = async () => {
    try {
      setLoadingLocations(true);
      const response = await axios.get('https://provinces.open-api.vn/api/p/');

      if (response.data) {
        // Sort provinces alphabetically
        const sortedProvinces = response.data.sort((a, b) =>
          a.name.localeCompare(b.name, 'vi', { numeric: true })
        );
        setProvinces(sortedProvinces);
      }
    } catch (error) {
      console.error('Error loading provinces:', error);
      // Fallback to major cities if API fails
      setProvinces([
        { code: 79, name: 'TP. Hồ Chí Minh' },
        { code: 1, name: 'Hà Nội' },
        { code: 48, name: 'Đà Nẵng' }
      ]);
    } finally {
      setLoadingLocations(false);
    }
  };

  // Load districts from API
  const loadDistricts = async (provinceCode) => {
    try {
      setLoadingLocations(true);
      const response = await axios.get(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);

      if (response.data && response.data.districts) {
        // Sort districts alphabetically
        const sortedDistricts = response.data.districts.sort((a, b) =>
          a.name.localeCompare(b.name, 'vi', { numeric: true })
        );
        setDistricts(sortedDistricts);
      }
    } catch (error) {
      console.error('Error loading districts:', error);
      setDistricts([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Build location parameter based on province/district selection
      let locationParam = null;
      if (selectedProvince) {
        const province = provinces.find(p => p.code.toString() === selectedProvince);
        if (province) {
          locationParam = {
            province: province.name,
            district: selectedDistrict ? districts.find(d => d.code.toString() === selectedDistrict)?.name : null,
            category: propertyCategory,
            areaRange: areaRange
          };
        }
      } else if (propertyCategory || areaRange) {
        // If only category or area range is selected without province
        locationParam = {
          category: propertyCategory,
          areaRange: areaRange
        };
      }

      // Load analytics data with location filtering
      await Promise.all([
        loadPriceTrends(locationParam),
        loadNewsAnalysis(newsKeyword),
        loadPriceRanges(locationParam),
        loadRegionComparison()
      ]);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPriceTrends = async (locationParam = null) => {
    try {
      const response = await RentalAnalyticsAPI.getPriceTrends(locationParam);
      if (response.success) {
        setPriceData(response.data);
      } else {
        // Fallback to mock data if API fails
        const mockData = [
          { month: 'T8/2024', hcm: 4200000, hn: 3800000, dn: 3200000, change: 2.5 },
          { month: 'T9/2024', hcm: 4350000, hn: 3950000, dn: 3300000, change: 3.6 },
          { month: 'T10/2024', hcm: 4500000, hn: 4100000, dn: 3450000, change: 3.4 },
          { month: 'T11/2024', hcm: 4650000, hn: 4200000, dn: 3600000, change: 3.3 },
          { month: 'T12/2024', hcm: 4800000, hn: 4350000, dn: 3750000, change: 3.2 },
          { month: 'T1/2025', hcm: 4950000, hn: 4500000, dn: 3900000, change: 3.1 }
        ];
        setPriceData(mockData);
      }
    } catch (error) {
      console.error('Error loading price trends:', error);
      // Use mock data as fallback
      const mockData = [
        { month: 'T8/2024', hcm: 4200000, hn: 3800000, dn: 3200000, change: 2.5 },
        { month: 'T9/2024', hcm: 4350000, hn: 3950000, dn: 3300000, change: 3.6 },
        { month: 'T10/2024', hcm: 4500000, hn: 4100000, dn: 3450000, change: 3.4 },
        { month: 'T11/2024', hcm: 4650000, hn: 4200000, dn: 3600000, change: 3.3 },
        { month: 'T12/2024', hcm: 4800000, hn: 4350000, dn: 3750000, change: 3.2 },
        { month: 'T1/2025', hcm: 4950000, hn: 4500000, dn: 3900000, change: 3.1 }
      ];
      setPriceData(mockData);
    }
  };

  const loadNewsAnalysis = async (keyword = 'thuê phòng trọ') => {
    try {
      const response = await RentalAnalyticsAPI.getNewsSentiment(keyword);
      if (response.success) {
        setSentimentData(response.data.sentiment);
        setNewsData(response.data.news);
      } else {
        // Fallback to mock data
        const mockSentiment = [
          { name: 'Tích cực', value: 45, color: '#10B981' },
          { name: 'Trung tính', value: 35, color: '#F59E0B' },
          { name: 'Tiêu cực', value: 20, color: '#EF4444' }
        ];
        setSentimentData(mockSentiment);

        const mockNews = [
          {
            title: 'Giá thuê nhà trọ tại TP.HCM tăng 3.2% trong tháng 1/2025',
            sentiment: 'positive',
            date: '2025-01-25',
            source: 'VnExpress'
          },
          {
            title: 'Thị trường cho thuê phòng trọ Hà Nội ổn định',
            sentiment: 'neutral',
            date: '2025-01-24',
            source: 'Vietnamnet'
          },
          {
            title: 'Sinh viên khó tìm phòng trọ giá rẻ tại Đà Nẵng',
            sentiment: 'negative',
            date: '2025-01-23',
            source: 'Tuổi Trẻ'
          }
        ];
        setNewsData(mockNews);
      }
    } catch (error) {
      console.error('Error loading news analysis:', error);
      // Use mock data as fallback
      const mockSentiment = [
        { name: 'Tích cực', value: 45, color: '#10B981' },
        { name: 'Trung tính', value: 35, color: '#F59E0B' },
        { name: 'Tiêu cực', value: 20, color: '#EF4444' }
      ];
      setSentimentData(mockSentiment);

      const mockNews = [
        {
          title: 'Giá thuê nhà trọ tại TP.HCM tăng 3.2% trong tháng 1/2025',
          sentiment: 'positive',
          date: '2025-01-25',
          source: 'VnExpress'
        },
        {
          title: 'Thị trường cho thuê phòng trọ Hà Nội ổn định',
          sentiment: 'neutral',
          date: '2025-01-24',
          source: 'Vietnamnet'
        },
        {
          title: 'Sinh viên khó tìm phòng trọ giá rẻ tại Đà Nẵng',
          sentiment: 'negative',
          date: '2025-01-23',
          source: 'Tuổi Trẻ'
        }
      ];
      setNewsData(mockNews);
    }
  };

  const loadPriceRanges = async (locationParam = null) => {
    try {
      const response = await RentalAnalyticsAPI.getPriceRanges(locationParam);
      if (response.success) {
        setPriceRangeData(response.data);
      } else {
        // Fallback to mock data
        const mockRanges = [
          { range: '2-3 triệu', count: 35, percentage: 35 },
          { range: '3-4 triệu', count: 28, percentage: 28 },
          { range: '4-5 triệu', count: 20, percentage: 20 },
          { range: '5-7 triệu', count: 12, percentage: 12 },
          { range: 'Trên 7 triệu', count: 5, percentage: 5 }
        ];
        setPriceRangeData(mockRanges);
      }
    } catch (error) {
      console.error('Error loading price ranges:', error);
      // Use mock data as fallback
      const mockRanges = [
        { range: '2-3 triệu', count: 35, percentage: 35 },
        { range: '3-4 triệu', count: 28, percentage: 28 },
        { range: '4-5 triệu', count: 20, percentage: 20 },
        { range: '5-7 triệu', count: 12, percentage: 12 },
        { range: 'Trên 7 triệu', count: 5, percentage: 5 }
      ];
      setPriceRangeData(mockRanges);
    }
  };

  const loadRegionComparison = async () => {
    try {
      const response = await RentalAnalyticsAPI.getRegionComparison();
      console.log('Region comparison response:', response);
      if (response.success) {
        setRegionComparison(response.data);
      } else {
        // Fallback to mock data
        const mockComparison = [
          {
            region: 'TP. Hồ Chí Minh',
            currentMonth: 4950000,
            lastMonth: 4800000,
            twoMonthsAgo: 4650000,
            changePercent: 3.1,
            twoMonthChange: 6.5
          },
          {
            region: 'Hà Nội',
            currentMonth: 4500000,
            lastMonth: 4350000,
            twoMonthsAgo: 4200000,
            changePercent: 3.4,
            twoMonthChange: 7.1
          },
          {
            region: 'Đà Nẵng',
            currentMonth: 3900000,
            lastMonth: 3750000,
            twoMonthsAgo: 3600000,
            changePercent: 4.0,
            twoMonthChange: 8.3
          }
        ];
        setRegionComparison(mockComparison);
      }
    } catch (error) {
      console.error('Error loading region comparison:', error);
      // Use mock data as fallback
      const mockComparison = [
        {
          region: 'TP. Hồ Chí Minh',
          currentMonth: 4950000,
          lastMonth: 4800000,
          twoMonthsAgo: 4650000,
          changePercent: 3.1,
          twoMonthChange: 6.5
        },
        {
          region: 'Hà Nội',
          currentMonth: 4500000,
          lastMonth: 4350000,
          twoMonthsAgo: 4200000,
          changePercent: 3.4,
          twoMonthChange: 7.1
        },
        {
          region: 'Đà Nẵng',
          currentMonth: 3900000,
          lastMonth: 3750000,
          twoMonthsAgo: 3600000,
          changePercent: 4.0,
          twoMonthChange: 8.3
        }
      ];
      setRegionComparison(mockComparison);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
  };

  const formatPercent = (value) => {
    return value > 0 ? `+${value}%` : `${value}%`;
  };

  // Removed region selection - using direct province-district approach

  const propertyCategories = [
    { value: '', label: 'Tất cả loại hình' },
    { value: 'phong_tro', label: 'Phòng trọ' },
    { value: 'can_ho', label: 'Căn hộ' },
    { value: 'nha_nguyen_can', label: 'Nhà nguyên căn' },
    { value: 'chung_cu_mini', label: 'Chung cư mini' },
    { value: 'homestay', label: 'Homestay' }
  ];

  const areaRanges = [
    { value: '', label: 'Tất cả diện tích' },
    { value: '10-20', label: '10-20 m²' },
    { value: '20-30', label: '20-30 m²' },
    { value: '30-50', label: '30-50 m²' },
    { value: '50+', label: '>50 m²' }
  ];

  // Removed handleRegionChange - using direct province selection

  // Handle province selection change
  const handleProvinceChange = (value) => {
    setSelectedProvince(value);
    setSelectedDistrict(''); // Reset district when province changes
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="spinner"></div>
        <p>Đang tải dữ liệu phân tích...</p>
      </div>
    );
  }

  return (
    <div className="rental-analytics-dashboard">
      <div className="dashboard-header">
        <h2>
          <i className="fa fa-chart-line"></i>
          Phân tích giá thuê trọ
        </h2>
        <p>Theo dõi xu hướng và phân tích thị trường cho thuê phòng trọ</p>

        <div className="dashboard-controls">
          <div className="control-group">
            <label>Loại hình nhà ở:</label>
            <select
              value={propertyCategory}
              onChange={(e) => setPropertyCategory(e.target.value)}
              className="control-select"
            >
              {propertyCategories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          <div className="control-group">
            <label>Tỉnh/Thành phố:</label>
            <select
              value={selectedProvince}
              onChange={(e) => handleProvinceChange(e.target.value)}
              className="control-select"
              disabled={loadingLocations}
            >
              <option value="">Tất cả tỉnh/thành phố</option>
              {provinces.map(province => (
                <option key={province.code} value={province.code}>
                  {province.name}
                </option>
              ))}
            </select>
            {loadingLocations && <span className="loading-text">Đang tải...</span>}
          </div>

          {selectedProvince && districts.length > 0 && (
            <div className="control-group">
              <label>Quận/Huyện:</label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="control-select"
                disabled={loadingLocations}
              >
                <option value="">Tất cả quận/huyện</option>
                {districts.map(district => (
                  <option key={district.code} value={district.code}>
                    {district.name}
                  </option>
                ))}
              </select>
              {loadingLocations && <span className="loading-text">Đang tải...</span>}
            </div>
          )}

          <div className="control-group">
            <label>Diện tích:</label>
            <select
              value={areaRange}
              onChange={(e) => setAreaRange(e.target.value)}
              className="control-select"
            >
              {areaRanges.map(range => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label>Chủ đề bạn quan tâm:</label>
            <div className="input-with-button">
              <input
                type="text"
                value={newsKeyword}
                onChange={(e) => setNewsKeyword(e.target.value)}
                className="control-input"
                placeholder="Nhập từ khóa để tìm tin tức..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    loadNewsAnalysis(newsKeyword);
                  }
                }}
              />
              <button
                onClick={() => loadNewsAnalysis(newsKeyword)}
                className="search-button"
                title="Tìm kiếm tin tức"
              >
                <i className="fa fa-search"></i>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="metrics-grid">
        {regionComparison.map((region, index) => (
          <div key={index} className="metric-card">
            <div className="metric-header">
              <h4>{region.region}</h4>
              <i className="fa fa-map-marker-alt"></i>
            </div>
            <div className="metric-value">
              {formatPrice(region.currentMonth)}
            </div>
            <div className="metric-changes">
              <div className={`change-item ${region.changePercent > 0 ? 'positive' : 'negative'}`}>
                <span>Tháng trước:</span>
                <span>{formatPercent(region.changePercent)}</span>
              </div>
              <div className={`change-item ${region.twoMonthChange > 0 ? 'positive' : 'negative'}`}>
                <span>2 tháng trước:</span>
                <span>{formatPercent(region.twoMonthChange)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Price Trend Chart */}
        <div className="chart-card large">
          <div className="chart-header">
            <h3>
              <i className="fa fa-chart-line"></i>
              Xu hướng giá thuê theo thời gian
            </h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={priceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${value / 1000000}M`} />
                <Tooltip formatter={(value) => [formatPrice(value), 'Giá thuê']} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="hcm"
                  stackId="1"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.6}
                  name="TP.HCM"
                />
                <Area
                  type="monotone"
                  dataKey="hn"
                  stackId="2"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.6}
                  name="Hà Nội"
                />
                <Area
                  type="monotone"
                  dataKey="dn"
                  stackId="3"
                  stroke="#F59E0B"
                  fill="#F59E0B"
                  fillOpacity={0.6}
                  name="Đà Nẵng"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sentiment Pie Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>
              <i className="fa fa-chart-pie"></i>
              Tỷ lệ tin tức thị trường
            </h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Price Range Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>
              <i className="fa fa-chart-bar"></i>
              Khoảng giá phổ biến
            </h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={priceRangeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}%`, 'Tỷ lệ']} />
                <Bar dataKey="percentage" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* News Section */}
      <div className="news-section">
        <div className="section-header">
          <h3>
            <i className="fa fa-newspaper"></i>
            Tin tức về "{newsKeyword}"
          </h3>
          <p>Top 10 tin tức mới nhất được tìm kiếm bằng SERP API</p>
        </div>
        <div className="news-grid">
          {newsData.map((news, index) => (
            <div key={index} className={`news-card ${news.sentiment}`}>
              <div className="news-header">
                <span className={`sentiment-badge ${news.sentiment}`}>
                  <i className={`fa ${news.sentiment === 'positive' ? 'fa-thumbs-up' :
                      news.sentiment === 'negative' ? 'fa-thumbs-down' :
                        'fa-minus'
                    }`}></i>
                  {news.sentiment === 'positive' ? 'Tích cực' :
                    news.sentiment === 'negative' ? 'Tiêu cực' : 'Trung tính'}
                </span>
                <span className="news-date">{news.date}</span>
              </div>
              <h4 className="news-title">{news.title}</h4>
              <div className="news-footer">
                <span className="news-source">
                  <i className="fa fa-globe"></i>
                  {news.source}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Section */}
      <div className="summary-section">
        <div className="summary-card">
          <h3>
            <i className="fa fa-lightbulb"></i>
            Tóm tắt xu hướng
          </h3>
          <div className="summary-content">
            <div className="summary-item">
              <i className="fa fa-arrow-up text-success"></i>
              <p><strong>Xu hướng tăng:</strong> Giá thuê trung bình tăng 3-4% so với tháng trước</p>
            </div>
            <div className="summary-item">
              <i className="fa fa-chart-line text-info"></i>
              <p><strong>Khu vực hot:</strong> TP.HCM và Hà Nội dẫn đầu về mức tăng giá</p>
            </div>
            <div className="summary-item">
              <i className="fa fa-users text-warning"></i>
              <p><strong>Nhu cầu cao:</strong> Phòng trọ 2-4 triệu đồng được tìm kiếm nhiều nhất</p>
            </div>
            <div className="summary-item">
              <i className="fa fa-newspaper text-primary"></i>
              <p><strong>Tin tức:</strong> 45% tin tức tích cực, thị trường ổn định</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentalPriceAnalytics;
