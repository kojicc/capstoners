// Login.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from '../../utils/axiosInstance';
import {
  TextInput,
  PasswordInput,
  Paper,
  Title,
  Text,
  Container,
  Group,
  Button,
  Checkbox,
  Anchor,
} from '@mantine/core';
import classes from './AuthenticationTitle.module.css';

export function Login() {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();


  const handleLogin = async () => {
    console.log('Attempting to log in with', { username, password });

    try {
      const response = await axios.post('login/', { username, password });
      console.log('Login response:', response.data);
      router.push('/');  // Redirect to home page
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid username or password');
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center" className={classes.title}>
        Welcome back!
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Do not have an account yet?{' '}
        <Anchor size="sm" component="button">
          Create account
        </Anchor>
      </Text>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <TextInput
          label="Username"
          placeholder="you@mantine.dev"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <PasswordInput
          label="Password"
          placeholder="Your password"
          required
          mt="md"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Group justify="space-between" mt="lg">
          <Checkbox label="Remember me" />
          <Anchor component="button" size="sm">
            Forgot password?
          </Anchor>
        </Group>
        <Button fullWidth mt="xl" onClick={handleLogin}>
          Sign in
        </Button>
        {error && <Text color="red" mt="md">{error}</Text>}
      </Paper>
    </Container>
  );
}
