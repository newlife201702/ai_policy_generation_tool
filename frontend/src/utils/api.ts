import axios from 'axios';
import { store } from '../store/store';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL,
  timeout: 10000,
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    // 优先从 Redux store 获取，如果没有则从 localStorage 获取
    const token = state.auth.token || localStorage.getItem('token');
    
    console.log('发送请求:', config.method?.toUpperCase(), config.url);
    console.log('Auth 状态:', state.auth.isAuthenticated ? '已登录' : '未登录');
    console.log('Token:', token ? '存在' : '不存在');
    
    if (token) {
      // 确保每次都设置当前的 token
      config.headers.Authorization = `Bearer ${token}`;
      console.log('已添加 Authorization 头:', `Bearer ${token.substring(0, 10)}...`);
    } else {
      console.warn('请求未包含 Token');
    }
    return config;
  },
  (error) => {
    console.error('请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log('响应成功:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('响应错误:', error);
    
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
      
      if (error.response.status === 401) {
        console.warn('认证失败 (401), 清除凭据并重定向到登录页');
        // 清除 localStorage 中的 token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // 清除 Redux store 中的认证状态
        store.dispatch({ type: 'auth/logout' });
        
        // 使用 setTimeout 延迟重定向，以便控制台能够显示日志
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    } else if (error.request) {
      console.error('未收到响应:', error.request);
    } else {
      console.error('请求配置错误:', error.message);
    }
    
    return Promise.reject(error);
  }
);

/**
 * 发送流式请求，处理服务器发送的SSE流式数据
 * @param url API地址
 * @param data 请求数据
 * @param onData 接收数据回调
 * @param onError 错误回调
 * @param onComplete 完成回调
 */
export const fetchStreamResponse = async (
  url: string,
  data: any,
  onData: (data: any) => void,
  onError: (error: Error) => void,
  onComplete: () => void
) => {
  try {
    const response = await fetch(`${baseURL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法获取响应流');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      // 处理缓冲区中的所有完整消息
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 保留最后一个不完整的行

      for (const line of lines) {
        if (line.trim() === '') continue;
        if (line.startsWith('data:')) {
          try {
            const jsonStr = line.substring(5).trim();
            if (jsonStr === '[DONE]') {
              onComplete();
              continue;
            }
            
            const jsonData = JSON.parse(jsonStr);
            if (jsonData.error) {
              throw new Error(jsonData.error);
            }
            
            // 立即传递每个内容块
            onData(jsonData);
          } catch (e) {
            console.error('解析SSE数据失败:', e, line);
          }
        }
      }
    }

    // 处理缓冲区中剩余的内容
    if (buffer.trim() !== '') {
      try {
        const jsonStr = buffer.substring(5).trim();
        if (jsonStr !== '[DONE]') {
          const jsonData = JSON.parse(jsonStr);
          onData(jsonData);
        }
      } catch (e) {
        console.error('解析剩余SSE数据失败:', e, buffer);
      }
    }

    onComplete();
  } catch (error) {
    onError(error as Error);
  }
};

export { api }; 