// src/modules/customer/services/products.js
import { instance } from '../../shared/api/axiosInstance';

export const getCustomerProducts = async (
  search = null,
  pageNumber = 1,
  pageSize = 12
) => {
  const response = await instance.get('/api/products', {
    params: { search, pageNumber, pageSize },
  });

  return { data: response.data, error: null };
};
