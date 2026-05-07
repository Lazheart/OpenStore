import { api } from '../api';

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password?: string;
  role: 'ADMIN' | 'OWNER' | 'CLIENT';
  phoneNumber?: string;
}

export interface AuthResponse {
  token: string;
  uid: string;
  name: string;
  email: string;
  role: string;
}

export interface VerifyPasswordRequest {
  email: string;
  password: string;
}

export interface VerifyPasswordResponse {
  code: string;
  message: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  code: string;
}

export interface MeResponse {
  id?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  subscription?: string;
  shopId?: string;
}

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const payload = {
    identifier: data.email,
    password: data.password || ''
  };
  const response = await api.post<AuthResponse>('/auth/login', payload);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  const payload: Record<string, string> = {
    name: data.name,
    email: data.email,
    password: data.password || '',
  };
  if (data.phoneNumber) {
    payload.phoneNumber = data.phoneNumber;
  }
  const response = await api.post<AuthResponse>('/auth/register', payload);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

export const verifyPassword = async (data: VerifyPasswordRequest): Promise<VerifyPasswordResponse> => {
  const response = await api.post<VerifyPasswordResponse>('/verify', data);
  return response.data;
};

export const updateProfile = async (data: UpdateProfileRequest): Promise<void> => {
  const payload: Record<string, string> = {
    code: data.code,
  };

  if (data.name) payload.name = data.name;
  if (data.email) payload.email = data.email;
  if (data.phoneNumber) payload.phoneNumber = data.phoneNumber;
  if (data.password) payload.password = data.password;

  await api.patch('/me', payload);
};

export const getMe = async (): Promise<MeResponse> => {
  const response = await api.get<MeResponse>('/me');
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
