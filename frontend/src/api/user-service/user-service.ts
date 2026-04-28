import { userApi } from '../api';

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password?: string;
  role: 'ADMIN' | 'OWNER' | 'CLIENT';
}

export interface AuthResponse {
  token: string;
  uid: string;
  name: string;
  email: string;
  role: string;
}

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const payload = {
    identifier: data.email,
    password: data.password || ''
  };
  const response = await userApi.post<AuthResponse>('/auth/login', payload);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  const payload = {
    name: data.name,
    email: data.email,
    password: data.password || '',
  };
  const response = await userApi.post<AuthResponse>('/auth/register', payload);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

export const getCurrentUser = (): AuthResponse | null => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};
