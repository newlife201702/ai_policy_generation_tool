import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store/store';
import App from './App';
import './index.css';
import { logout } from './store/slices/authSlice';

// 在应用启动时检查 localStorage 中的 token
const checkStoredToken = () => {
  const token = localStorage.getItem('token');
  
  // 如果存在 token，进行简单的格式检查
  if (token) {
    try {
      // JWT 通常由三部分组成，用点分隔
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('存储的 token 格式不正确，清除 token');
        store.dispatch(logout());
      }
    } catch (error) {
      console.error('检查 token 时出错:', error);
      store.dispatch(logout());
    }
  }
};

// 启动时检查 token
checkStoredToken();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
); 