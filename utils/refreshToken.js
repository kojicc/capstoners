import axios from '../utils/axiosInstance';
import Cookies from 'js-cookie';
// parang di need 
export const refreshToken = async () => {
  try {
    const response = await axios.post('token/refresh-from-cookie/', {
      refresh: Cookies.get('refresh_token'),
    });
    Cookies.set('access_token', response.data.access, { path: '/' });
  } catch (error) {
    console.error('Failed to refresh token', error);
    throw error;
  }
};
