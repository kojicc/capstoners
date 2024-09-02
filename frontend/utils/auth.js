import Cookies from 'js-cookie';
import axios from '../utils/axiosInstance';
import { jwtDecode } from "jwt-decode";


export const fetchDecodedAccessToken = async () => {
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
      const username = decodedToken.username;
      
      Cookies.set('Role',decodedToken.role); // Set the access token
      // Store the decoded token in local storage or cookies if needed
      // localStorage.setItem('accessToken', jwt_access_token); // Example if using local storage
      
  
      return { role, username };

      // return jwt_access_token;
    } 
    else {
      throw new Error('Error fetching access token: ' + response.statusText);
     
    }
  } catch (error) {
    console.error('Error fetching access token:', error);
    return error; 
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
}

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
