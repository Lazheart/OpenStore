import { productApi } from '../api';

export interface Product {
  productId: string;
  name: string;
  price: number;
  description: string;
  imageUrl?: string;
  availability?: string;
}

export const getProductsByShop = async (shopId: string): Promise<Product[]> => {
  const response = await productApi.get<Product[]>(`/shops/${shopId}/products`);
  return response.data;
};

export const createProduct = async (
  shopId: string,
  name: string,
  price: number,
  description: string,
  file?: File
): Promise<{ productId: string }> => {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('price', price.toString());
  formData.append('description', description);
  if (file) {
    formData.append('file', file);
  }

  const response = await productApi.post<{ productId: string }>(`/shops/${shopId}/products`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateProduct = async (
  shopId: string,
  productId: string,
  price?: number,
  availability?: string,
  file?: File
): Promise<void> => {
  const formData = new FormData();
  if (price !== undefined) formData.append('price', price.toString());
  if (availability !== undefined) formData.append('availability', availability);
  if (file) formData.append('file', file);

  await productApi.patch(`/shops/${shopId}/products/${productId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
