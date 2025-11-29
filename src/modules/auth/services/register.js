import { instance } from '../../shared/api/axiosInstance';

export const registerUser = async ({ username, password ,email, role, }) => {
  try {
    const payload = { username, password, email, role };
    const response = await instance.post('/api/auth/register', payload);

    return { data: response.data, error: null };
  } catch (error) {
    console.error('registerUser error', error);
    return { data: null, error };
  }
};
