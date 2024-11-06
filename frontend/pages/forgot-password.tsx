import React, { useState } from 'react';
import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Text,
  Group,
  Anchor,
  Stack,
  LoadingOverlay,
  Popover,
  Progress,
  Box,
  Center,
} from '@mantine/core';
import axios from '@/utils/axiosInstance';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/router';
import { IconCheck, IconX } from '@tabler/icons-react';

const requirements = [
  { re: /[0-9]/, label: 'Includes number' },
  { re: /[a-z]/, label: 'Includes lowercase letter' },
  { re: /[A-Z]/, label: 'Includes uppercase letter' },
  { re: /[$&+,:;=?@#|'<>.^*()%!-]/, label: 'Includes special symbol' },
];

function getStrength(password: string) {
  let multiplier = 1;

  if (password.length > 5) {
    multiplier = 0;
  }

  requirements.forEach((requirement) => {
    if (!requirement.re.test(password)) {
      multiplier += 1;
    }
  });

  return Math.max(100 - (100 / (requirements.length + 1)) * multiplier, 10);
}

function PasswordRequirement({ meets, label }: { meets: boolean; label: string }) {
  return (
    <Text
      color={meets ? 'teal' : 'red'}
      style={{ display: 'flex', alignItems: 'center' }}
      mt={7}
      size="sm"
    >
      {meets ? (
        <IconCheck style={{ width: 14, height: 14 }} />
      ) : (
        <IconX style={{ width: 14, height: 14 }} />
      )}
      <Box ml={10}>{label}</Box>
    </Text>
  );
}

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [popoverOpened, setPopoverOpened] = useState(false);
  const router = useRouter();

  const strength = getStrength(password);
  const meetsRequirements =
    password.length > 5 && requirements.every((requirement) => requirement.re.test(password));
  const passwordsMatch = password === confirmPassword;

  const handleForgotPassword = async () => {
    setLoading(true);
    try {
      const response = await axios.put('forgetPassword/', { email, password });
      setUsername(response.data.username); // Set the username from the response

      notifications.show({
        title: 'Password Reset Successful',
        message: 'Your password has been reset. Please check your email for further instructions.',
        color: 'teal',
      });

      router.push('/login');
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'An error occurred while resetting your password. Please try again.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center>
      <Paper
        shadow="xl"
        radius="md"
        p="xl"
        withBorder
        mt={30}
        style={{ maxWidth: 400, width: '100%' }}
      >
        <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />
        <Title
          style={{
            fontFamily: 'Greycliff CF, sans-serif',
            fontWeight: 900,
            color: '#592f55',
            textAlign: 'center',
          }}
        >
          Forgot Password
        </Title>
        <Text color="dimmed" size="sm" mt={5} style={{ textAlign: 'center' }}>
          Enter your email and new password to reset your password.
        </Text>

        <Stack mt="xl">
          <TextInput
            required
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            disabled
          />
          <Popover
            opened={popoverOpened}
            position="bottom"
            width="target"
            transitionProps={{ transition: 'pop' }}
          >
            <Popover.Target>
              <div
                onFocusCapture={() => setPopoverOpened(true)}
                onBlurCapture={() => setPopoverOpened(false)}
              >
                <PasswordInput
                  required
                  label="New Password"
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(event) => setPassword(event.currentTarget.value)}
                  autoComplete="new-password"
                />
              </div>
            </Popover.Target>
            <Popover.Dropdown>
              <Progress
                color={strength === 100 ? 'teal' : 'red'}
                value={strength}
                size={5}
                mb="xs"
              />
              <PasswordRequirement
                label="Includes at least 6 characters"
                meets={password.length > 5}
              />
              {requirements.map((requirement, index) => (
                <PasswordRequirement
                  key={index}
                  label={requirement.label}
                  meets={requirement.re.test(password)}
                />
              ))}
            </Popover.Dropdown>
          </Popover>
          <PasswordInput
            required
            label="Confirm New Password"
            placeholder="Confirm your new password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.currentTarget.value)}
            autoComplete="new-password"
          />
          {!passwordsMatch && confirmPassword.length > 0 && (
            <Text color="red" size="sm">
              Passwords do not match
            </Text>
          )}
        </Stack>

        <Group justify="center" mt="xl">
          <Button
            radius="xl"
            onClick={handleForgotPassword}
            style={{ backgroundColor: '#592f55', color: '#fff' }}
            disabled={!meetsRequirements || !passwordsMatch}
          >
            Reset Password
          </Button>
        </Group>

        <Group justify="center" mt="xl">
          <Anchor<'a'> size="sm" onClick={() => router.push('/login')}>
            Back to Login
          </Anchor>
        </Group>
      </Paper>
    </Center>
  );
};

export default ForgotPassword;
