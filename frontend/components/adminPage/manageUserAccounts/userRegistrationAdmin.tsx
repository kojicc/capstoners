import {
  TextInput,
  PasswordInput,
  Text,
  Paper,
  Group,
  Button,
  Divider,
  Checkbox,
  Stack,
  LoadingOverlay,
  InputBase,
  Combobox,
  Loader,
  Autocomplete,
  Input,
  useCombobox,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useRouter } from 'next/router';
import { useState, useRef } from 'react';
import cx from 'clsx';
import axios from '@/utils/axiosInstance';
import classes from './DropdownOptionsAnimation.module.css';

export function UserRegAdmin() {
  // State and utility hooks
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>('👥 Guest');
  const [animating, setAnimating] = useState(false);

  // Form handling
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

  const combobox = useCombobox({
    onDropdownClose: () => {
      combobox.resetSelectedOption();
      setAnimating(false);
    },
    onDropdownOpen: () => setAnimating(true),
  });

  const groceries = ['🔐 Admin', '📚 Student', '👥 Guest'];
  const options = groceries.map((item, index) => (
    <Combobox.Option
      value={item}
      key={item}
      className={cx({ [classes.animateOption]: animating })}
      style={{ animationDelay: `${index * 10}ms` }}
    >
      {item}
    </Combobox.Option>
  ));

  const removeEmojis = (text: string): string => {
    return text
      .replace(
        /[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
        ''
      )
      .trim();
  };

  const handleRegister = async () => {
    try {
      setLoading(true);
      const { username, password, firstName, lastName, email, role } = form.values;
      const response = await axios.post('register/', {
        username,
        password,
        first_name: firstName,
        last_name: lastName,
        email,
        role,
      });
      console.log('Register response:', response.data);
    } catch (err) {
      console.error('Register error:', err);
      form.setErrors({
        email: 'Invalid email or password!',
        username: 'Invalid email or password!',
        password: 'Invalid email or password!',
        firstName: 'Invalid email or password!',
        lastName: 'Invalid email or password!',
      });
    } finally {
      setLoading(false);
      form.reset();
    }
  };

  const handleEmailChange = (val: string) => {
    form.setFieldValue('email', val);
  };

  return (
    <Paper radius="md" p="xl" withBorder pos="relative">
      <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />
      <Text size="lg" fw={500}>
        Add users here!
      </Text>

      <form onSubmit={form.onSubmit(handleRegister)}>
        <Stack>
          <Combobox
            store={combobox}
            withinPortal={false}
            onOptionSubmit={(val) => {
              setSelectedRole(val);
              form.setFieldValue('role', removeEmojis(val).toLowerCase());
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
                {selectedRole || <Input.Placeholder>Pick value</Input.Placeholder>}
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
            onChange={(event) => form.setFieldValue('firstName', event.currentTarget.value)}
            error={form.errors.firstName}
            radius="md"
          />

          <TextInput
            required
            label="Last Name"
            placeholder="Your last name"
            value={form.values.lastName}
            onChange={(event) => form.setFieldValue('lastName', event.currentTarget.value)}
            error={form.errors.lastName}
            radius="md"
          />

          <EmailAutocomplete value={form.values.email} onChange={handleEmailChange} />

          <TextInput
            autoComplete="new-password"
            required
            label="Username"
            placeholder="Enter your username"
            value={form.values.username}
            onChange={(event) => form.setFieldValue('username', event.currentTarget.value)}
            error={form.errors.username}
            radius="md"
          />

          <PasswordInput
            autoComplete="new-password"
            required
            label="Password"
            placeholder="Your password"
            value={form.values.password}
            onChange={(event) => form.setFieldValue('password', event.currentTarget.value)}
            error={form.errors.password}
            radius="md"
          />

          <Checkbox
            label="I accept terms and conditions"
            checked={form.values.terms}
            onChange={(event) => form.setFieldValue('terms', event.currentTarget.checked)}
          />
        </Stack>

        <Button type="submit" radius="xl" mt="xl">
          Register
        </Button>
      </form>
    </Paper>
  );
}

// The EmailAutocomplete component
function EmailAutocomplete({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const timeoutRef = useRef<number>(-1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<string[]>([]);

  const handleChange = (val: string) => {
    window.clearTimeout(timeoutRef.current);
    onChange(val);
    setData([]);

    if (val.trim().length === 0 || val.includes('@')) {
      setLoading(false);
    } else {
      setLoading(true);
      timeoutRef.current = window.setTimeout(() => {
        setLoading(false);
        setData(['gmail.com', 'outlook.com', 'yahoo.com'].map((provider) => `${val}@${provider}`));
      }, 1000);
    }
  };

  return (
    <Autocomplete
      value={value}
      data={data}
      onChange={handleChange}
      rightSection={loading ? <Loader size="1rem" /> : null}
      label="Email"
      placeholder="hello@mantine.dev"
      required
      radius="md"
    />
  );
}
