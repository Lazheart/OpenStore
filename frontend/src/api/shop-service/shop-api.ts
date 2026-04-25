import { shopApi } from '../api';

export interface Shop {
  id: number;
  name: string;
  owner_id: number;
  created_at?: string;
}

export const createShop = async (name: string): Promise<Shop> => {
  const response = await shopApi.post<Shop>('/shops', { name });
  return response.data;
};

export const getShops = async (page = 1, limit = 10) => {
  const response = await shopApi.get(`/shops?page=${page}&limit=${limit}`);
  return response.data;
};

export const getShopById = async (id: number): Promise<Shop> => {
  const response = await shopApi.get<Shop>(`/shops/${id}`);
  return response.data;
};
