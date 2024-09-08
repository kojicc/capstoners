import React, { createContext } from 'react';
import useSWR from 'swr';
import { fetchDecodedAccessTokenRole } from '@/utils/auth';
import { LoadingOverlay } from '@mantine/core';

// Create a context for authentication
// pangbigay ng role at username sa ibang components
const AuthContext = createContext();

const fetcher = async () => {
  const tokenData = await fetchDecodedAccessTokenRole();
  return tokenData;
};

// Provider component to wrap around parts of your app that need authentication
const AuthProvider = ({ children }) => {
  const { data, error, isValidating } = useSWR('auth-role', fetcher, {
    revalidateOnFocus: false, // Disable revalidation on focus
  });

  const role = data?.role || 'guest';
  const username = data?.username || '';
  const loading = !data && !error; // Show loading until data is fetched

  if (loading || isValidating) {
    return <LoadingOverlay visible overlayBlur={2} />;
  }

  return (
    <AuthContext.Provider value={{ role, username, loading }}>{children}</AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
