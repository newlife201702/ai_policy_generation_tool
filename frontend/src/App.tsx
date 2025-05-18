import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Login from '@/pages/Login';
import TextChat from '@/pages/TextChat';
import ImageGen from '@/pages/ImageGen';
import { RootState } from '@/store';
import { setCredentials, logout } from '@/store/slices/authSlice';
import { api } from '@/services/api';

const App: React.FC = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const location = useLocation();
  const dispatch = useDispatch();
  const [tokenVerified, setTokenVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 验证token有效性
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (token && user) {
        try {
          // 调用后端API验证token有效性
          const response = await api.get('/auth/verify-token');
          if (response.status === 200) {
            const userData = JSON.parse(user);
            dispatch(setCredentials({ token, user: userData }));
            setTokenVerified(true);
          }
        } catch (error) {
          console.error('Token验证失败:', error);
          // Token无效，清除登录状态
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          dispatch(logout());
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, []);

  // 处理重定向到登录页面的逻辑
  const getLoginRedirectUrl = () => {
    // 如果当前URL中已经包含from参数，则保留它
    const searchParams = new URLSearchParams(location.search);
    const existingFrom = searchParams.get('from');
    
    if (existingFrom) {
      return `/login?from=${encodeURIComponent(existingFrom)}`;
    }
    
    // 否则使用当前页面的URL作为来源
    return `/login?from=${encodeURIComponent(location.pathname + location.search)}`;
  };

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>加载中...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login setTokenVerified={setTokenVerified} />} />
      <Route
        path="/text-chat"
        element={isAuthenticated && tokenVerified ? <TextChat /> : <Navigate to={getLoginRedirectUrl()} />}
      />
      <Route
        path="/image-gen"
        element={isAuthenticated && tokenVerified ? <ImageGen /> : <Navigate to={getLoginRedirectUrl()} />}
      />
      <Route path="/" element={<Navigate to={isAuthenticated && tokenVerified ? "/text-chat" : "/login"} />} />
    </Routes>
  );
};

export default App; 