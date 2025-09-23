import Property from '../../../schemas/Property.js';
import ollamaService from '../services/ollamaService.js';
import axios from 'axios';

// Helper functions for location API
const fetchDistricts = async (provinceCode) => {
  try {
    const response = await axios.get(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`, { timeout: 5000 });
    return response.data.districts || [];
  } catch (error) {
    console.error('Error fetching districts:', error.message);
    return [];
  }
};

const fetchWards = async (districtCode) => {
  try {
    const response = await axios.get(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`, { timeout: 5000 });
    return response.data.wards || [];
  } catch (error) {
    console.error('Error fetching wards:', error.message);  
    return [];
  }
};

/**
 * Controller xử lý chatbot AI
 */
const chatbotController = {
  /**
   * Xử lý guided conversation - API endpoint tương tự như gradio_server.py
   */
  processGuidedChat: async (req, res) => {
    try {
      const { message, sessionId, conversationState } = req.body;

      // Validation
      if (!message?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Tin nhắn không được để trống'
        });
      }

      // Xử lý guided conversation
      const result = await guidedConversationService.processGuidedApi(
        message.trim(),
        sessionId,
        conversationState
      );

      // Trả về response theo format ChatResponse
      return res.json({
        success: result.success || true,
        message: result.message || '',
        step: result.step || '',
        options: result.options || null,
        properties: result.properties || null,
        totalFound: result.totalFound || null,
        conversationState: result.conversationState || {},
        showGrid: result.showGrid || false,
        placeholder: result.placeholder || null,
        searchCriteria: result.searchCriteria || null
      });

    } catch (error) {
      console.error('Guided chat error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi xử lý tin nhắn. Vui lòng thử lại.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Xử lý tin nhắn từ người dùng - Stateless version (không dùng session)
   */
  processMessage: async (req, res) => {
    try {
      const { message } = req.body;

      // Validation
      if (!message?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Tin nhắn không được để trống'
        });
      }

      // Xử lý tin nhắn bằng Ollama service
      const ollamaResult = await ollamaService.processMessage(message.trim());
      // console.log('Ollama Result:', ollamaResult);
      
      if (!ollamaResult.success) {
        throw new Error('Không thể phân tích tin nhắn từ AI');
      }

      // Tìm kiếm properties nếu có search params
      const searchResults = await chatbotController.handlePropertySearch(ollamaResult.data.searchParams);
      console.log(`searchResults`, searchResults);
      
      // Tạo AI response
      const aiResponse = chatbotController.buildAIResponse(
        ollamaResult.data,
        searchResults,
        ollamaResult.data.searchParams
      );
      console.log('AI Response:', aiResponse);

      // Trả về response
      return res.json({
        success: true,
        data: aiResponse
      });

    } catch (error) {
      console.error('Chatbot error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi xử lý tin nhắn. Vui lòng thử lại.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Xử lý tìm kiếm properties
   */
  handlePropertySearch: async (searchParams) => {
    if (!searchParams || !Object.keys(searchParams).length) {
      return [];
    }

    try {
      // Convert search params sang format MongoDB query
      const query = chatbotController.buildMongoQuery(searchParams);
      console.log('MongoDB Query:', JSON.stringify(query, null, 2));
      
      // Debug: Kiểm tra total properties trong DB
      const totalProperties = await Property.countDocuments({
        approvalStatus: 'approved',
        status: 'available',
        isDeleted: { $ne: true }
      });
    
      
      // Debug: Kiểm tra sample property structure
      const sampleProperty = await Property.findOne({
        approvalStatus: 'approved',
        status: 'available',
        isDeleted: { $ne: true }
      }).lean();


      // Thực hiện tìm kiếm
      const properties = await Property.find(query)
        .sort({ promotedAt: -1, createdAt: -1 })
        .limit(50)
        .populate('owner', 'fullName email phone avatar')
        .populate('amenities', 'name icon')
        .lean();

    
      
      // Debug: Thử query đơn giản hơn
      if (properties.length === 0) {
       
        
        // Chỉ filter theo province  
        if (searchParams.provinceId) {
          const provinceOnly = await Property.countDocuments({
            approvalStatus: 'approved',
            status: 'available',
            isDeleted: { $ne: true },
            province: searchParams.provinceId
          });
          console.log(`Properties with provinceId ${searchParams.provinceId}: ${provinceOnly}`);
        }
        
        // Chỉ filter theo category
        if (searchParams.category) {
          const categoryOnly = await Property.countDocuments({
            approvalStatus: 'approved',
            status: 'available',
            isDeleted: { $ne: true },
            category: searchParams.category
          });
         
        }
      }

      // Nếu có properties, thêm location mapping
      if (properties.length > 0) {
        // Lấy provinces từ ollamaService cache hoặc API
        const provinces = await ollamaService.getProvinces();
        const provinceMap = new Map(provinces.map(p => [String(p.code), p.name]));

        // Lấy districts & wards theo properties tìm được  
        const districtMap = new Map();
        const wardMap = new Map();

        for (const property of properties) {
          if (property.province && !districtMap.has(property.district)) {
            try {
              const districts = await fetchDistricts(property.province);
              districts.forEach(d => districtMap.set(String(d.code), d.name));
            } catch (error) {
              console.error('Error fetching districts for province:', property.province, error);
            }
          }
          if (property.district && !wardMap.has(property.ward)) {
            try {
              const wards = await fetchWards(property.district);
              wards.forEach(w => wardMap.set(String(w.code), w.name));
            } catch (error) {
              console.error('Error fetching wards for district:', property.district, error);
            }
          }
        }

        // Map location codes to names - đưa vào cấu trúc nested location
        properties.forEach(property => {
          property.location = {
            provinceName: provinceMap.get(String(property.province)) || property.province,
            districtName: districtMap.get(String(property.district)) || property.district,
            wardName: wardMap.get(String(property.ward)) || property.ward,
            provinceCode: property.province,
            districtCode: property.district,
            wardCode: property.ward,
            detailAddress: property.detailAddress || ''
          };
        });
      }
      
      return properties;

    } catch (error) {
      console.error('Property search error:', error);
      return [];
    }
  },

  /**
   * Build MongoDB query từ search parameters
   */
  buildMongoQuery: (searchParams) => {
    const query = {
      approvalStatus: 'approved',
      status: 'available',
      isDeleted: { $ne: true }
    };

    // Location filters - based on Property schema structure
    if (searchParams.provinceId) query.province = searchParams.provinceId;
    if (searchParams.districtId) query.district = searchParams.districtId;
    if (searchParams.wardId) query.ward = searchParams.wardId;

    // Category filter
    if (searchParams.category) query.category = searchParams.category;

    // Price range
    if (searchParams.minPrice || searchParams.maxPrice) {
      query.rentPrice = {};
      if (searchParams.minPrice) query.rentPrice.$gte = parseInt(searchParams.minPrice);
      if (searchParams.maxPrice) query.rentPrice.$lte = parseInt(searchParams.maxPrice);
    }

    // Area range
    if (searchParams.minArea || searchParams.maxArea) {
      query.area = {};
      if (searchParams.minArea) query.area.$gte = parseInt(searchParams.minArea);
      if (searchParams.maxArea) query.area.$lte = parseInt(searchParams.maxArea);
    }

    // Amenities
    if (searchParams.amenities) {
      const amenityIds = searchParams.amenities.split(',').map(id => id.trim());
      query.amenities = { $in: amenityIds };
    }

    return query;
  },

  /**
   * Tạo AI response object
   */
  buildAIResponse: (ollamaData, searchResults, searchParams) => {
    // Kiểm tra nếu đây không phải câu hỏi về phòng trọ
    if (!ollamaData.isRoomSearchQuery) {
      return {
        message: ollamaData.message || "Em xin lỗi, nhưng em chỉ có thể hỗ trợ các câu hỏi liên quan đến tìm kiếm phòng trọ, căn hộ và các dịch vụ bất động sản. Nếu Anh/Chị có nhu cầu tìm phòng trọ hoặc căn hộ, em rất sẵn lòng hỗ trợ!",
        properties: [],
        totalFound: 0,
        suggestions: [
          'Tìm phòng trọ phù hợp',
          'Tìm căn hộ chung cư',
          'Tìm nhà nguyên căn',
          'Xem tin đăng mới nhất'
        ],
        searchParams: null,
        processingTime: ollamaData.processingTime,
        source: ollamaData.source
      };
    }

    // Đây là câu hỏi về phòng trọ hợp lệ
    return {
      message: `Tôi đã tìm thấy ${searchResults.length} kết quả phù hợp với yêu cầu của bạn.`,
      properties: searchResults,
      totalFound: searchResults.length,
      suggestions: searchResults.length > 0 ? 
        chatbotController.getSearchSuggestions(searchParams) : 
        chatbotController.getGeneralSuggestions(),
      searchParams: searchParams,
      processingTime: ollamaData.processingTime,
      source: ollamaData.source
    };
  },


  /**
   * Gợi ý dựa trên search parameters
   */
  getSearchSuggestions: (searchParams) => {
    const suggestions = [];
    
    if (searchParams?.category) suggestions.push('Xem thêm cùng loại hình');
    if (searchParams?.maxPrice) suggestions.push('Tìm với mức giá khác');
    if (searchParams?.provinceId) suggestions.push('Tìm khu vực lân cận');
    suggestions.push('Lọc theo tiện ích');
    
    return suggestions.length > 0 ? suggestions : chatbotController.getGeneralSuggestions();
  },


  /**
   * Gợi ý chung
   */
  getGeneralSuggestions: () => {
    return [
      'Hãy cho tôi biết bạn đang tìm loại phòng gì?',
      'Bạn có ngân sách dự kiến không?',
      'Khu vực nào bạn muốn tìm kiếm?',
      'Xem các tin đăng mới nhất'
    ];
  }
};

export default chatbotController;
