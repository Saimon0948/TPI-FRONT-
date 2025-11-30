import { instance } from '../../shared/api/axiosInstance';

export const createOrder = async (orderPayload) => {
  try {
    const response = await instance.post('/api/orders', orderPayload);
    return { data: response.data, error: null };
  } catch (error) {
    console.error('createOrder error', error);
    return { data: null, error };
  }
};