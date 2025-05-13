import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: {
    id: string;
    email?: string;
    phone?: string;
  } | null;
}

const initialState: AuthState = {
  isAuthenticated: localStorage.getItem('token') ? true : false,
  token: localStorage.getItem('token'),
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || 'null') : null,
};

// 设置 cookie 的辅助函数
const setCookie = (name: string, value: string, days: number) => {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/;domain=super-i.cn`;
};

// 删除 cookie 的辅助函数
const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=super-i.cn`;
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; user: AuthState['user'] }>
    ) => {
      const { token, user } = action.payload;
      state.isAuthenticated = true;
      state.token = token;
      state.user = user;
      
      // 同步到 localStorage
      localStorage.setItem('token', token);
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        // 同时存储到 cookie
        setCookie('user', JSON.stringify(user), 1); // 1天过期
      }
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      
      // 清除 localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // 清除 cookie
      deleteCookie('user');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer; 