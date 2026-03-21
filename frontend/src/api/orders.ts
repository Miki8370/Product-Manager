
import { apiClient } from './client';

export const getOrders = async () => {
  const response = await apiClient.get('/order/admin/orders');
  return response;
};
