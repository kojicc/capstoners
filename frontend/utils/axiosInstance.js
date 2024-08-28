// axiosInstance.js
import axios from 'axios';
import Cookies from 'js-cookie';
import { refreshToken } from './refreshToken';
import { useRouter } from 'next/router';
import { handleLogout } from '../components/LandingPage/header/HeaderLP';

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api/',  
  timeout: 5000,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
  withCredentials: true,
});


// Request interceptor: Add access token to headers
axiosInstance.interceptors.request.use(
  (config) => {
    const token = Cookies.get('jwt_access_token');
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token;  // Adding the key to the request
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
// Response interceptor: Handle token refresh
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if error status is 401 (Unauthorized)
    if (error.response.status === 401 && !originalRequest._retry) {
     
      originalRequest._retry = true;
      router.push('/login');
      try {
        // Attempt to refresh token
        const response = await axios.post('token/refresh/', {
          refresh: Cookies.get('jwt_refresh_token'),
        });

        // Update cookies with new access token
        Cookies.set('jwt_access_token', response.data.access, { path: '/' });

        // Update the original request with the new token
        axios.defaults.headers.common['Authorization'] = 'Bearer ' + response.data.access;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error('Refresh token error:', refreshError);
        handleLogout();
        
        // Logout the user or redirect to login page
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
