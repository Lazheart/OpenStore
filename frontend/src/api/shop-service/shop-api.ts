import { api } from '../api';

export interface Shop {
  shopId?: string;
  id?: string;
  shopName?: string;
  name?: string;
  owner_id?: string;
  ownerId?: string;
  phoneNumber?: string;
  created_at?: string;
}

export const createShop = async (name: string, phoneNumber: string): Promise<Shop> => {
  const payload = {
    shopName: name,
    phoneNumber,
  };
  const response = await api.post<Shop>('/openshop/shop', payload);
  return response.data;
};

export const getShops = async (page = 1, limit = 10) => {
  const response = await api.get(`/shops?page=${page}&limit=${limit}`);
  return response.data;
};

export const getShopById = async (id: string): Promise<Shop> => {
  const response = await api.get<Shop>(`/shops/${id}`);
  return response.data;
};

export const deleteShop = async (shopId: string): Promise<void> => {
  await api.delete(`/shop/id/${shopId}`);
};
