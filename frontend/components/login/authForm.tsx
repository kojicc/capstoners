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
} from '@mantine/core';
import axios from '../../utils/axiosInstance';
import { useRouter } from 'next/router';
import { useContext, useState } from 'react';
import cx from 'clsx';
import classes from './DropdownOptionsAnimation.module.css';
import { fetchDecodedAccessTokenRole, useAuth } from '@/utils/auth';
import { AuthContext } from '@/utils/authContext';
import { mutate } from 'swr';
import { Header } from '../LandingPage/header/HeaderLP';

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

  const [animating, setAnimating] = useState(false);
  const [value, setValue] = useState<string | null>('👥 Guest');
  const groceries = ['📚 Student', '👥 Guest'];
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

  const [type, toggle1] = useToggle(['login', 'register']);
  const form = useForm({
    initialValues: {
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      terms: true,
      role: '',
    },
  });

  const [username, setUsernameAuth] = useState('');
  const [password, setPassword] = useState('');
  const [first_name, setFirstname] = useState('');
  const [last_name, setLastname] = useState('');
  const [role, setRoleAuth] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await axios.post('login/', { username, password });
      if (response.status !== 200) {
        throw new Error('Invalid email or password');
      }

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
      form.setFieldError('username', 'Invalid email or password!');
      form.setFieldError('password', 'Invalid email or password!');
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
        role,
      });
      console.log('Register response:', response.data);

      if (role === 'admin') {
        router.push('/adminDashboard');
      } else if (role === 'student') {
        router.push('/');
      } else {
        router.push('/');
      }
    } catch (err) {
      console.error('Register error:', err);
      setError('Invalid username or password');
      form.setFieldError('email', 'Invalid email or password!');
      form.setFieldError('username', 'Invalid email or password!');
      form.setFieldError('password', 'Invalid email or password!');
      form.setFieldError('firstName', 'Invalid email or password!');
      form.setFieldError('lastName', 'Invalid email or password!');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    form.reset();
    setUsernameAuth('');
    setPassword('');
    setFirstname('');
    setLastname('');
    setRoleAuth('');
    setEmail('');
    setValue('👥 Guest');
  };

  const handleToggle = () => {
    toggle1();
    resetForm();
  };

  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Header />
      </AppShell.Header>

      {/* <AppShell.Main>
      

        
      </AppShell.Main> */}
      <BackgroundImage
        src="/RAFAEL.jpg"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          filter: 'blur(8px)',
          zIndex: -1,
        }}
      />
      <Center>
        <Paper
          shadow="xl"
          radius="md"
          p="xl"
          withBorder
          {...props}
          mt={30}
          pos={'relative'}
          style={{ maxWidth: 400, width: '100%' }}
        >
          <LoadingOverlay
            visible={loading}
            zIndex={1000}
            overlayProps={{ radius: 'sm', blur: 2 }}
          />
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
                  <Combobox
                    store={combobox}
                    withinPortal={false}
                    onOptionSubmit={(val) => {
                      setValue(val);
                      setRoleAuth(removeEmojis(val).toLowerCase());
                      combobox.closeDropdown();
                    }}
                  >
                    <Combobox.Target>
                      <InputBase
                        component="button"
                        type="button"
                        pointer
                        rightSection={<Combobox.Chevron />}
                        onClick={() => combobox.toggleDropdown()}
                        rightSectionPointerEvents="none"
                      >
                        {value || <Input.Placeholder>Pick value</Input.Placeholder>}
                      </InputBase>
                    </Combobox.Target>

                    <Combobox.Dropdown>
                      <Combobox.Options>{options}</Combobox.Options>
                    </Combobox.Dropdown>
                  </Combobox>

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

              <PasswordInput
                required
                label="Password"
                placeholder="Your password"
                value={form.values.password}
                onChange={(event) => {
                  form.setFieldValue('password', event.currentTarget.value);
                  setPassword(event.currentTarget.value);
                }}
                error={form.errors.password}
                radius="md"
              />

              {type === 'register' && (
                <Checkbox
                  label="I accept terms and conditions"
                  checked={form.values.terms}
                  onChange={(event) => form.setFieldValue('terms', event.currentTarget.checked)}
                />
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
              >
                {upperFirst(type)}
              </Button>
            </Group>
          </form>
        </Paper>
      </Center>
    </AppShell>
  );
}
