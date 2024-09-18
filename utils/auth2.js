import useSWR, { mutate } from 'swr';
import { fetchDecodedAccessToken } from '@/utils/auth';

const fetchUser = async () => {
  const tokenData = await fetchDecodedAccessToken();
  return tokenData;
};

export const useAuth = () => {
  const { data, error, isLoading } = useSWR('user', fetchUser, {
    revalidateOnFocus: false,
  });

  const role = data?.role ?? null;
  const username = data?.username ?? null;

  return {
    role,
    username,
    loading: isLoading,
    error,
  };
};

// Function to update user data after login
export const updateUser = async (userData) => {
  mutate('user', userData, false);
};
