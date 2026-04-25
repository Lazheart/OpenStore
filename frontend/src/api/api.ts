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

export const userApi = createApiInstance(import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:8080/api/auth');
export const shopApi = createApiInstance(import.meta.env.VITE_SHOP_SERVICE_URL || 'http://localhost:8081');
export const productApi = createApiInstance(import.meta.env.VITE_PRODUCT_SERVICE_URL || 'http://localhost:8082');
