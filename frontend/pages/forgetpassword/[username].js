import React, { useState, useEffect } from 'react';
import {
  TextInput,
  Button,
  Container,
  Title,
  Text,
  notifications,
  PasswordInput,
  Popover,
  Progress,
  Box,
} from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';
import axios from 'axios';

const requirements = [
  { re: /[0-9]/, label: 'Includes number' },
  { re: /[a-z]/, label: 'Includes lowercase letter' },
  { re: /[A-Z]/, label: 'Includes uppercase letter' },
  { re: /[$&+,:;=?@#|'<>.^*()%!-]/, label: 'Includes special symbol' },
];

function getStrength(password) {
  let multiplier = 1;

  // Check if the password length is greater than 5
  if (password.length > 5) {
    multiplier = 0;
  }

  // Check each requirement and adjust the multiplier
  requirements.forEach((requirement) => {
    if (!requirement.re.test(password)) {
      multiplier += 1;
    }
  });

  return Math.max(100 - (100 / (requirements.length + 1)) * multiplier, 10);
}

function PasswordRequirement({ meets, label }) {
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

const ForgetPasswordRequest = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [popoverOpened, setPopoverOpened] = useState(false);
  const [strength, setStrength] = useState(0);
  const [meetsRequirements, setMeetsRequirements] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const strength = getStrength(newPassword);
    setStrength(strength);
    setMeetsRequirements(
      newPassword.length > 5 &&
        requirements.every((requirement) => requirement.re.test(newPassword))
    );
    setPasswordsMatch(newPassword === confirmPassword);
  }, [newPassword, confirmPassword]);

  const handleSubmit = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put('forgetPassword/', { email: email, password: newPassword });
      notifications.show({
        title: 'Success',
        message: 'Password reset successful. You can now log in with your new password.',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to reset password. Please try again.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="xs" my={40}>
      <Title align="center">Reset Your Password Here</Title>
      <TextInput
        label="Enter your email or username"
        placeholder="yourname@dlsud.edu.ph"
        value={email}
        onChange={(event) => setEmail(event.currentTarget.value)}
        required
        mt="md"
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
              data-autofocus
              label="New Password"
              placeholder="Enter your new password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.currentTarget.value)}
              required
            />
          </div>
        </Popover.Target>
        <Popover.Dropdown>
          <Progress color={strength === 100 ? 'teal' : 'red'} value={strength} size={5} mb="xs" />
          <PasswordRequirement
            label="Includes at least 6 characters"
            meets={newPassword.length > 5}
          />
          {requirements.map((requirement, index) => (
            <PasswordRequirement
              key={index}
              label={requirement.label}
              meets={requirement.re.test(newPassword)}
            />
          ))}
        </Popover.Dropdown>
      </Popover>
      <PasswordInput
        label="Confirm New Password"
        autoComplete="new-password"
        placeholder="Confirm your new password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.currentTarget.value)}
        required
        error={passwordError}
      />
      {!passwordsMatch && confirmPassword.length > 0 && (
        <Text color="red" size="sm">
          Passwords do not match
        </Text>
      )}
      <Button
        fullWidth
        mt="xl"
        onClick={handleSubmit}
        loading={loading}
        disabled={!meetsRequirements || !passwordsMatch}
      >
        Reset Password
      </Button>
    </Container>
  );
};

export default ForgetPasswordRequest;
