/**
 * MCP Chatbot API Service - Kết nối với Gradio FastAPI server
 */

const MCP_API_BASE_URL = 'http://localhost:7861/api';

const mcpChatbotAPI = {
  /**
   * Gửi tin nhắn guided conversation
   */
  sendGuidedMessage: async (message, sessionId = null, conversationState = null) => {
    try {
      const response = await fetch(`${MCP_API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          sessionId,
          conversationState
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('MCP Chatbot Response Data:', data);
      
      return {
        success: true,
        data: {
          sessionId: data.session_id,
          message: data.message,
          step: data.step,
          options: data.options || [],
          properties: data.properties || [],
          totalFound: data.totalFound || 0,
          conversationState: data.conversationState,
          showGrid: data.showGrid || false,
          placeholder: data.placeholder
        }
      };
    } catch (error) {
      console.error('MCP Chatbot API error:', error);
      return {
        success: false,
        message: 'Lỗi kết nối với chatbot AI. Vui lòng thử lại sau.',
        error: error.message
      };
    }
  },

  /**
   * Kiểm tra trạng thái server
   */
  healthCheck: async () => {
    try {
      const response = await fetch(`${MCP_API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('MCP Health check failed:', error);
      return false;
    }
  },

  /**
   * Lấy thông tin session
   */
  getSession: async (sessionId) => {
    try {
      const response = await fetch(`${MCP_API_BASE_URL}/sessions/${sessionId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get session error:', error);
      return {
        success: false,
        message: 'Không thể lấy thông tin session'
      };
    }
  }
};

export default mcpChatbotAPI;
