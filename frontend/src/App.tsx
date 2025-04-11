import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Login from '@/pages/Login';
import TextChat from '@/pages/TextChat';
import ImageGen from '@/pages/ImageGen';
import { RootState } from '@/store';

const App: React.FC = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/text-chat"
        element={isAuthenticated ? <TextChat /> : <Navigate to="/login" />}
      />
      <Route
        path="/image-gen"
        element={isAuthenticated ? <ImageGen /> : <Navigate to="/login" />}
      />
      <Route path="/" element={<Navigate to={isAuthenticated ? "/text-chat" : "/login"} />} />
    </Routes>
  );
};

export default App; 