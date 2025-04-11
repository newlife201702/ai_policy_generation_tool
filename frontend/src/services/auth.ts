import axios from 'axios';

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email?: string;
    phone?: string;
  };
}

interface LoginParams {
  phone?: string;
  email?: string;
  code: string;
}

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const loginWithPhone = async (params: LoginParams): Promise<LoginResponse> => {
  const response = await api.post('/auth/login/phone', params);
  return response.data;
};

export const loginWithEmail = async (params: LoginParams): Promise<LoginResponse> => {
  const response = await api.post('/auth/login/email', params);
  return response.data;
};

export const sendVerificationCode = async (contact: string, type: 'phone' | 'email'): Promise<void> => {
  await api.post('/auth/send-code', { contact, type });
}; 