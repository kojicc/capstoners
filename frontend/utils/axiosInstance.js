// axiosInstance.js
import axios from 'axios';
import Cookies from 'js-cookie';
import handleLogout from '../components/LandingPage/header/HeaderLP';
import { useRouter } from 'next/router';

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api/',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json', // Changed from multipart/form-data for typical APIs
  },
  withCredentials: true,
});

// Function to check if the token is expired
// const isTokenExpired = (token) => {
//   try {
//     const decoded = jwtDecode(token);
//     const currentTime = Date.now() / 1000; // Current time in seconds
//     return decoded.exp < currentTime;
//   } catch (e) {
//     return true; // Assume expired if there's an error decoding
//   }
// };

// Function to refresh the access token
const refreshAccessToken = async () => {
  try {
    const response = await axiosInstance.post('token/refresh-from-cookie/', {
      jwt_refresh_token: Cookies.get('jwt_refresh_token'),
    });

    // Update cookies with new access token
    Cookies.set('jwt_access_token', response.data.access, { path: '/' });

    return response.data.access;
  } catch (refreshError) {
    console.error('Refresh token error:', refreshError);
    handleLogout();
    throw refreshError;
  }
};

// // Request interceptor: Add access token to headers
// axiosInstance.interceptors.request.use(
//   async (config) => {
//     let token = Cookies.get('jwt_access_token');

//     if (token && isTokenExpired(token)) {
//       try {
//         // Refresh the token if it's expired
//         token = await refreshAccessToken();
//       } catch (error) {
//         return Promise.reject(error); // Stop here if refresh fails
//       }
//     }

//     if (token) {
//       config.headers['Authorization'] = 'Bearer ' + token;
//     }

//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// Response interceptor: Handle 401 errors (Unauthorized)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error status is 401 (Unauthorized)
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token
        const newToken = await refreshAccessToken();

        // Update the original request with the new token
        originalRequest.headers['Authorization'] = 'Bearer ' + newToken;

        // Retry the original request with the new token
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error('Refresh token error:', refreshError);
        handleLogout();
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
