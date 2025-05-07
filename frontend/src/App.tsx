import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Login from '@/pages/Login';
import TextChat from '@/pages/TextChat';
import ImageGen from '@/pages/ImageGen';
import { RootState } from '@/store';
import { setCredentials } from '@/store/slices/authSlice';

const App: React.FC = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const location = useLocation();
  const dispatch = useDispatch();

  // 检查登录状态
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (token && user && !isAuthenticated) {
        try {
          const userData = JSON.parse(user);
          dispatch(setCredentials({ token, user: userData }));
        } catch (e) {
          console.error('解析用户数据失败:', e);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    };

    checkAuth();
  }, [dispatch, isAuthenticated]);

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

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/text-chat"
        element={isAuthenticated ? <TextChat /> : <Navigate to={getLoginRedirectUrl()} />}
      />
      <Route
        path="/image-gen"
        element={isAuthenticated ? <ImageGen /> : <Navigate to={getLoginRedirectUrl()} />}
      />
      <Route path="/" element={<Navigate to={isAuthenticated ? "/text-chat" : "/login"} />} />
    </Routes>
  );
};

export default App; 