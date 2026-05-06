import { api } from '../api';

export interface Shop {
  id: number;
  name: string;
  owner_id: number;
  created_at?: string;
}

export const createShop = async (name: string): Promise<Shop> => {
  const payload = {
    shopName: name,
    phoneNumber: '000000000' // Default if not provided
  };
  const response = await api.post<Shop>('/openshop/shop', payload);
  return response.data;
};

export const getShops = async (page = 1, limit = 10) => {
  const response = await api.get(`/shops?page=${page}&limit=${limit}`);
  return response.data;
};

export const getShopById = async (id: number): Promise<Shop> => {
  const response = await api.get<Shop>(`/shops/${id}`);
  return response.data;
};
