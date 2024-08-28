import React, { createContext, useEffect, useState } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { fetchDecodedAccessToken } from '@/utils/auth';

// Create a context for authentication
const AuthContext = createContext();

// Provider component to wrap around parts of your app that need authentication
const AuthProvider = ({ children }) => {
  const [role, setRole] = useLocalStorage({
    key: 'role',
    defaultValue: null,
  });

  const [username, setUsername] = useLocalStorage({
    key: 'username',
    defaultValue: null,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const tokenData = await fetchDecodedAccessToken();
        const { role, username } = tokenData;

        console.log('AuthProvider Role from token:', role);
        console.log('Username from token:', username);

        // Update both state and local storage
        setRole(role);
        setUsername(username);
      } catch (error) {
        console.error('Error fetching user role:', error);
        // Optionally handle errors here
        setRole(null); // Reset role on error
        setUsername(null); // Reset username on error
      } finally {
        setLoading(false); // Set loading to false after fetching
      }
    };

    // Fetch role only if it's not already in local storage
    if (role === null && username === null) {
      fetchUserRole();
    } else {
      setLoading(false); // If already in local storage, stop loading
    }
  }, [role, username]); // Dependency array should be empty to avoid continuous fetching

  return (
    <AuthContext.Provider value={{ role, username, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
