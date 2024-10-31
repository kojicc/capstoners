import { useToggle, upperFirst, useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import {
  TextInput,
  PasswordInput,
  Text,
  Paper,
  PaperProps,
  Button,
  Divider,
  Checkbox,
  Anchor,
  Stack,
  LoadingOverlay,
  useCombobox,
  Combobox,
  InputBase,
  Input,
  Container,
  Image,
  Title,
  BackgroundImage,
  Box,
  AppShell,
  Burger,
  Group,
  Center,
  Autocomplete,
  Popover,
  Progress,
} from '@mantine/core';
import axios from '../../utils/axiosInstance';
import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';
import cx from 'clsx';
import classes from './DropdownOptionsAnimation.module.css';
import { fetchDecodedAccessTokenRole, useAuth } from '@/utils/auth';
import { AuthContext } from '@/utils/authContext';
import useSWR, { mutate } from 'swr';
import Header from '../LandingPage/header/HeaderLP';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { AxiosError } from 'axios';

interface ClassSchedule {
  class_section: string;
  class_name: string;
  class_days: {
    [day: string]: {
      start: string;
      end: string;
    }[];
  };
  class_instructor: string;
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

const requirements = [
  { re: /[0-9]/, label: 'Includes number' },
  { re: /[a-z]/, label: 'Includes lowercase letter' },
  { re: /[A-Z]/, label: 'Includes uppercase letter' },
  { re: /[$&+,:;=?@#|'<>.^*()%!-]/, label: 'Includes special symbol' },
];

function getStrength(password: string) {
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

export function AuthenticationForm(props: PaperProps) {
  const removeEmojis = (text: string): string => {
    return text
      .replace(
        /[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
        ''
      )
      .trim();
  };

  const combobox = useCombobox({
    onDropdownClose: () => {
      combobox.resetSelectedOption();
      setAnimating(false);
    },
    onDropdownOpen: () => setAnimating(true),
  });

  // #region useStates
  const [animating, setAnimating] = useState(false);
  const [value, setValue] = useState<string | null>('👥 Guest');
  const groceries = ['📚 Student', '👥 Guest'];
  const [username, setUsernameAuth] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [first_name, setFirstname] = useState('');
  const [last_name, setLastname] = useState('');
  const [role, setRoleAuth] = useState('');
  const [email, setEmail] = useState('');
  const [classSection, setClassSection] = useState(''); // Initialize as an empty string
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [type, toggle1] = useToggle(['login', 'register']);
  const [opened, { toggle }] = useDisclosure();
  const [popoverOpened, setPopoverOpened] = useState(false);

  // #endregion

  const router = useRouter();

  const options = groceries.map((item, index) => (
    <Combobox.Option
      value={item}
      key={item}
      className={cx({ [classes.animateOption]: animating })}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {item}
    </Combobox.Option>
  ));

  const form = useForm({
    initialValues: {
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      terms: true,
      role: '',
      classSection: '', // Add this line
    },
  });

  const { data: classSchedules, error: classSchedError } = useSWR<ClassSchedule[]>(
    'classScheduleCRUD/',
    fetcher
  );

  const strength = getStrength(password);
  const meetsRequirements =
    password.length > 5 && requirements.every((requirement) => requirement.re.test(password));
  const passwordsMatch = password === confirmPassword;

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await axios.post('login/', { username, password });

      const { role, username: fetchedUsername } = (await fetchDecodedAccessTokenRole()) as {
        role: string;
        username: string;
      };

      mutate('auth', { role, username: fetchedUsername }, false);

      if (role === 'admin') {
        router.push('/adminDashboard');
      } else if (role === 'student') {
        router.push('/');
      } else {
        router.push('/');
      }
    } catch (err) {
      console.error('Login error:', err);

      // Ensure 'err' is typed as AxiosError
      if (err instanceof AxiosError && err.response) {
        const { data } = err.response;
        console.log('Error data:', data);

        // Check if the error response has a specific detail message
        if (data && data.detail) {
          const detail = data.detail;

          if (detail === 'User account is locked') {
            notifications.show({
              title: 'Account Locked',
              message: 'Your account is locked. Please contact support.',
              color: 'red',
            });
          } else if (detail === 'User account is not active. Please verify your email.') {
            notifications.show({
              title: 'Account Not Active',
              message: 'Your account is not active. Please verify your email.',
              color: 'red',
            });
          } else if (detail === 'No active account found with the given credentials') {
            notifications.show({
              title: 'Wrong username or password',
              message: 'No active account found with the given credentials',
              color: 'red',
            });
            // Generic error handling
            form.setFieldError('username', 'Invalid email or password!');
            form.setFieldError('password', 'Invalid email or password!');
          } else {
            notifications.show({
              title: 'Login Error',
              message: detail,
              color: 'red',
            });
          }
        }
      } else {
        // Handle unexpected error type
        notifications.show({
          title: 'Error',
          message: 'An unexpected error occurred. Please try again.',
          color: 'red',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      setLoading(true);
      const response = await axios.post('register/', {
        username,
        password,
        first_name,
        last_name,
        email,
        role: 'student',
        class_section: classSection,
      });
      console.log('Register response:', response.data);

      notifications.show({
        title: 'Registration Successful',
        message: 'Please check your email to verify your account.',
        color: 'teal',
      });

      resetForm();
      toggle1(); // Switch to login form
    } catch (err) {
      console.error('Register error:', err);
      setError('Invalid username or password');
      form.setFieldError('email', 'Invalid email or password!');
      form.setFieldError('username', 'Invalid email or password!');
      form.setFieldError('password', 'Invalid email or password!');
      form.setFieldError('firstName', 'Invalid email or password!');
      form.setFieldError('lastName', 'Invalid email or password!');
      form.setFieldError('classSection', 'Invalid class section!');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    form.reset();
    setUsernameAuth('');
    setPassword('');
    setConfirmPassword('');
    setFirstname('');
    setLastname('');
    setRoleAuth('');
    setEmail(''); // Update this line
    setValue('👥 Guest');
  };

  const handleToggle = () => {
    toggle1();
    resetForm();
  };

  return (
    <Paper
      shadow="xl"
      radius="md"
      p="xl"
      withBorder
      {...props}
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
        Welcome to CTHM WEBSITE
      </Title>
      <Text color="dimmed" size="sm" mt={5} style={{ textAlign: 'center' }}>
        {type === 'register' ? 'Already have an account? ' : "Don't have an account? "}
        <Anchor<'a'> size="sm" onClick={handleToggle}>
          {type === 'register' ? 'Login' : 'Register'}
        </Anchor>
      </Text>

      <form onSubmit={form.onSubmit(() => {})}>
        <Stack>
          {type === 'register' && (
            <>
              <TextInput
                required
                label="First Name"
                placeholder="Your first name"
                value={form.values.firstName}
                onChange={(event) => {
                  form.setFieldValue('firstName', event.currentTarget.value);
                  setFirstname(event.currentTarget.value);
                }}
                error={form.errors.firstName}
                radius="md"
              />

              <TextInput
                required
                label="Last Name"
                placeholder="Your last name"
                value={form.values.lastName}
                onChange={(event) => {
                  form.setFieldValue('lastName', event.currentTarget.value);
                  setLastname(event.currentTarget.value);
                }}
                error={form.errors.lastName}
                radius="md"
              />

              <Autocomplete
                data={classSchedules ? classSchedules.map((cs) => cs.class_section) : []}
                label="Class Section"
                placeholder="Select class section"
                value={form.values.classSection}
                onChange={(value) => {
                  form.setFieldValue('classSection', value);
                  setClassSection(value);
                }}
              />

              <TextInput
                required
                label="Email"
                placeholder="hello@mantine.dev"
                value={form.values.email}
                onChange={(event) => {
                  form.setFieldValue('email', event.currentTarget.value);
                  setEmail(event.currentTarget.value);
                }}
                error={form.errors.email}
                radius="md"
              />
            </>
          )}

          <TextInput
            required
            label="Username"
            placeholder="Enter your username"
            value={form.values.username}
            onChange={(event) => {
              form.setFieldValue('username', event.currentTarget.value);
              setUsernameAuth(event.currentTarget.value);
            }}
            error={form.errors.username}
            radius="md"
          />

          {type === 'register' ? (
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
                    label="Password"
                    placeholder="Your password"
                    value={password}
                    onChange={(event) => {
                      form.setFieldValue('password', event.currentTarget.value);
                      setPassword(event.currentTarget.value);
                    }}
                    autoComplete="new-password" // Disable browser autocomplete
                    error={form.errors.password}
                    radius="md"
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
          ) : (
            <PasswordInput
              required
              label="Password"
              placeholder="Your password"
              value={password}
              onChange={(event) => {
                form.setFieldValue('password', event.currentTarget.value);
                setPassword(event.currentTarget.value);
              }}
              autoComplete="current-password" // Disable browser autocomplete
              error={form.errors.password}
              radius="md"
            />
          )}

          {type === 'register' && (
            <>
              <PasswordInput
                required
                label="Confirm password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.currentTarget.value)}
                autoComplete="new-password" // Disable browser autocomplete
              />
              {!passwordsMatch && confirmPassword.length > 0 && (
                <Text color="red" size="sm">
                  Passwords do not match
                </Text>
              )}

              <Checkbox
                label="I accept terms and conditions"
                checked={form.values.terms}
                onChange={(event) => form.setFieldValue('terms', event.currentTarget.checked)}
              />
            </>
          )}
        </Stack>

        <Group justify="apart" mt="xl">
          {type === 'login' && (
            <Anchor<'a'> size="sm" onClick={() => router.push('/forgot-password')}>
              Forgot Password?
            </Anchor>
          )}
          <Button
            type="submit"
            radius="xl"
            onClick={type === 'login' ? handleLogin : handleRegister}
            style={{ backgroundColor: '#592f55', color: '#fff' }}
            disabled={type === 'register' && (!meetsRequirements || !passwordsMatch)}
          >
            {upperFirst(type)}
          </Button>
        </Group>
      </form>
    </Paper>
  );
}
