import axios from 'axios';

const createApiInstance = (baseURL: string) => {
  const instance = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return instance;
};

export const api = createApiInstance(import.meta.env.VITE_LOAD_BALANCER_API || 'http://localhost:2060');

// Deprecated: keep aliases for compatibility until fully migrated
export const userApi = api;
export const shopApi = api;
export const productApi = api;
