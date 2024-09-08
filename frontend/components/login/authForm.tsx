import { useToggle, upperFirst, useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import {
  TextInput,
  PasswordInput,
  Text,
  Paper,
  Group,
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
} from '@mantine/core';
import axios from '../../utils/axiosInstance';
import { useRouter } from 'next/router';
import { useContext, useState } from 'react';
import cx from 'clsx';
import classes from './DropdownOptionsAnimation.module.css';
import { fetchDecodedAccessToken, fetchDecodedAccessTokenRole } from '@/utils/auth';
import { AuthContext } from '@/utils/authContext';
// import { GoogleButton } from './GoogleButton';
// import { TwitterButton } from './TwitterButton';

export function AuthenticationForm(props: PaperProps) {
  const removeEmojis = (text: string): string => {
    // Combine emoji removal and trimming in one step
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

  const groceries = ['🔐 Admin', '📚 Student', '👥 Guest'];

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

  const [loading, { toggle }] = useDisclosure(false);

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

    // validate: {
    // //   email: (val) => (/^\S+@\S+$/.test(val) ? null : 'Invalid email'),
    // email: (val) => (val.length <= 9 ? 'Password should include at least 6 characters' : null),
    // //   password: (val) => (val.length <= 6 ? 'Password should include at least 6 characters' : null),
    // },
  });

  const [username, setUsernameAuth] = useState('');
  const [password, setPassword] = useState('');
  const [first_name, setFirstname] = useState('');
  const [last_name, setLastname] = useState('');
  const [role, setRoleAuth] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

 

  const handleLogin = async () => {
    try {
      const response = await axios.post('login/', { username, password });
      if (response.status !== 200) {
        throw new Error('Invalid email or password');
      } else {
        const {role: roleContext} = await fetchDecodedAccessTokenRole() as { role: string };
        if (roleContext === 'admin') {
          router.push('/adminDashboard');
        } else if (roleContext === 'student') {
          router.push('/');
        } else {
          router.push('/');
        }

        // Update the context immediately after login
        // setRole((tokenData as { role: string }).role);
        // setUsername((tokenData as { username: string }).username);

        // Redirect or perform any other post-login actions
      }
    } catch (err) {
      console.error('Login error:', err);
      form.setFieldError('username', 'Invalid email or password!');
      form.setFieldError('password', 'Invalid email or password!');
    }
  };

  const handleRegister = async () => {
    try {
      toggle();
      const response = await axios.post('register/', {
        username,
        password,
        first_name,
        last_name,
        email,
        role,
      });
      console.log('Register response:', response.data);
      router.push('/');
    } catch (err) {
      console.error('Register error:', err);
      setError('Invalid username or password');
      form.setFieldError('email', 'Invalid email or password!');
      form.setFieldError('username', 'Invalid email or password!');
      form.setFieldError('password', 'Invalid email or password!');
      form.setFieldError('firstName', 'Invalid email or password!');
      form.setFieldError('lastName', 'Invalid email or password!');
    } finally {
      toggle();
    }
  };

  return (
    <>
      <Paper radius="md" p="xl" withBorder {...props} pos={'relative'}>
        <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />
        <Text size="lg" fw={500}>
          Welcome to Mantine, {type} with
        </Text>

        {/* /*{ <Group grow mb="md" mt="md">
        <GoogleButton radius="xl">Google</GoogleButton>
        <TwitterButton radius="xl">Twitter</TwitterButton>
          </Group>  */}

        <Divider label="Or continue with email" labelPosition="center" my="lg" />

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
                    console.log(removeEmojis(val).toLowerCase());
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

          <Group justify="space-between" mt="xl">
            <Anchor component="button" type="button" c="dimmed" onClick={() => toggle1()} size="xs">
              {type === 'register'
                ? 'Already have an account? Login'
                : "Don't have an account? Register"}
            </Anchor>
            <Button
              type="submit"
              radius="xl"
              onClick={type === 'login' ? handleLogin : handleRegister}
            >
              {upperFirst(type)}
            </Button>
          </Group>
        </form>
      </Paper>
      <Group justify="center">{/* <Button onClick={toggle}>Toggle overlay</Button> */}</Group>
    </>
  );
}
