import { apiClient } from './client';

export const getProducts = async () => {
  return apiClient.get('/products');
};

export const getCategories = async () => {
  return apiClient.get('/categories');
};

export const createProduct = async (productData: any) => {
  return apiClient.post('/products/add_products', productData);
};

export const updateProduct = async (id: number, productData: any) => {
  return apiClient.patch(`/products/update/${id}/`, productData);
};

export const deleteProduct = async (id: number) => {
  return apiClient.delete(`/products/${id}`);
};

