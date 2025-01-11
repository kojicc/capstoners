import Cookies from 'js-cookie';
import axios from '../utils/axiosInstance';
import { jwtDecode } from 'jwt-decode';
import { useState } from 'react';
import useSWR from 'swr';

export const fetchDecodedAccessTokenRole = async () => {
  try {
    const response = await axios.get('get-access-token/');
    // console.log('Response data:', response.data);
    // console.log('Status code:', response.status);

    if (response.status === 200) {
      const { jwt_access_token } = response.data;
      // console.log('Access Token is:', jwt_access_token);
      const decodedToken = jwtDecode(jwt_access_token);
      // console.log('Token role:', decodedToken.role);
      // console.log('Token user:', decodedToken.username);
      const role = decodedToken.role;
      const usernameFetched = decodedToken.username; // Renamed
      const class_section = decodedToken.class_section; // Renamed

      console.log('Class Section:', class_section);
      // Cookies.set('Role',decodedToken.role); // Set the access token
      // Store the decoded token in local storage or cookies if needed
      // localStorage.setItem('accessToken', jwt_access_token); // Example if using local storage

      return { role, username: usernameFetched, class_section };

      // return jwt_access_token;
    } else {
      throw new Error('Error fetching access token: ' + response.statusText);
    }
  } catch (error) {
    console.error('Error fetching access token:', error);
    return error;
  }
};

export const useAuth = () => {
  const { data, error } = useSWR('auth', fetchDecodedAccessTokenRole, {
    revalidateOnFocus: false, // Prevent re-fetching on window focus
  });

  return {
    class_section: data?.class_section,
    role: data?.role,
    username: data?.username,
    isLoading: !error && !data,
    isError: error,
  };
};

//lalagyan use state
export const fetchDecodedAccessToken = async () => {
  try {
    // const accessToken = getCookie('jwt_access_token');
    const response = await axios.get('get-access-token/');
    const { jwt_access_token } = response.data;

    console.log('Access token:', jwt_access_token);
    if (!jwt_access_token) throw new Error('No access token found');
    const decodedToken = jwtDecode(jwt_access_token);

    return decodedToken;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

export const fetchAccessToken = async () => {
  const response = await axios.get('/get-access-token/');
  // console.log('Response data:', response.data);
  // console.log('Status code:', response.status);
  if (response.status === 200) {
    const { jwt_access_token } = response.data;
    return jwt_access_token;
  }
};

export const isLoggedIn = async () => {
  try {
    const accessToken = await fetchAccessToken();
    //  console.log('Access token (orig):', accessToken);
    //  console.log('Access token (1):', !accessToken);
    //  console.log('Access token (2):', !!accessToken);

    return !!accessToken;
  } catch (error) {
    console.error('Error checking login status:', error);

    return false;
  }
};

export const sendResetCode = async (email) => {
  const response = await axios.post('send_reset_code/', { email });
  return response.data;
};

export const verifyResetCode = async (email, resetCode) => {
  const response = await axios.post('verify_reset_code/', {
    email,
    reset_code: resetCode,
  });
  return response.data;
};
export const resetPassword = async (email, newPassword) => {
  const response = await axios.put('forgetPassword/', {
    email,
    password: newPassword,
  });
  return response.data;
};
