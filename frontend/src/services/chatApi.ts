import { api } from './api';

interface ChatRequest {
  message: string;
  model: 'deepseek' | 'gpt4';
  streaming?: boolean;
  onData?: (chunk: string) => void;
}

interface ChatResponse {
  content: string;
  id: string;
  timestamp: string;
}

// 聊天相关API服务
const chatApi = {
  // 发送聊天消息
  sendMessage: async (params: ChatRequest): Promise<ChatResponse | null> => {
    try {
      if (params.streaming && params.onData) {
        // 如果需要流式响应，使用fetch API
        const controller = new AbortController();
        const { signal } = controller;
        
        const response = await fetch(`${api.defaults.baseURL}/chat/text/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            message: params.message,
            model: params.model,
          }),
          signal
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('无法获取响应流');
        }
        
        // 读取流式数据
        const decoder = new TextDecoder();
        let fullContent = '';
        let done = false;
        
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          
          if (value) {
            const chunk = decoder.decode(value, { stream: !done });
            fullContent += chunk;
            params.onData(chunk);
          }
        }
        
        return {
          content: fullContent,
          id: Date.now().toString(),
          timestamp: new Date().toISOString()
        };
      } else {
        // 普通请求
        const response = await api.post('/chat/text', {
          message: params.message,
          model: params.model
        });
        
        return response.data;
      }
    } catch (error) {
      console.error('聊天请求失败:', error);
      throw error;
    }
  },
  
  // 获取聊天历史记录
  getHistory: async () => {
    try {
      const response = await api.get('/chat/history');
      return response.data;
    } catch (error) {
      console.error('获取历史记录失败:', error);
      throw error;
    }
  },
  
  // 清除聊天历史
  clearHistory: async () => {
    try {
      const response = await api.delete('/chat/history');
      return response.data;
    } catch (error) {
      console.error('清除历史记录失败:', error);
      throw error;
    }
  }
};

export default chatApi; 