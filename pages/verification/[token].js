import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Container, Title, Text, Loader, Button } from '@mantine/core';
import axios from '../../utils/axiosInstance';

const VerifyEmail = () => {
  const router = useRouter();
  const { token } = router.query; // Next.js will extract the dynamic token
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(5); // Countdown timer

  useEffect(() => {
    if (token) {
      axios
        .get(`/verify-email/${token}/`) // Make sure this is the correct API URL
        .then((response) => {
          setMessage(response.data.message);
          // Start countdown if verification is successful
          const timer = setInterval(() => {
            setCountdown((prevCountdown) => prevCountdown - 1);
          }, 1000);
          setTimeout(() => {
            clearInterval(timer);
            router.push('/login');
          }, 5000);
        })
        .catch(() => {
          setMessage('Verification failed. Please try again.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [token]);

  return (
    <Container>
      <Title ta="center" mt="xl">
        Email Verification
      </Title>
      {loading ? (
        <Loader size="xl" mt="xl" />
      ) : (
        <>
          <Text ta="center" mt="xl">
            {message}
          </Text>
          {message === 'Email verified successfully' && (
            <>
              <Text ta="center" mt="xl">
                Redirecting in {countdown} seconds...
              </Text>
              <Button fullWidth mt="xl" onClick={() => router.push('/login')}>
                Go to Home Now
              </Button>
            </>
          )}
        </>
      )}
    </Container>
  );
};

export default VerifyEmail;
