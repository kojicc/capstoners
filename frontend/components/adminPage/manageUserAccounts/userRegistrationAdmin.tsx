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
  Progress,
  Box,
  Popover,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useRouter } from 'next/router';
import { useState, useRef } from 'react';
import cx from 'clsx';
import axios from '@/utils/axiosInstance';
import classes from './DropdownOptionsAnimation.module.css';
import { IconCheck, IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

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

export function UserRegAdmin() {
  // State and utility hooks
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>('📚 Student');
  const [animating, setAnimating] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [popoverOpened, setPopoverOpened] = useState(false);

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

  const groceries = ['🔐 Admin', '📚 Student'];
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
      
      // Check if the email is from the @dlsud.edu.ph domain
      if (!email.endsWith('@dlsud.edu.ph')) {
        notifications.show({
          title: 'Invalid Email',
          message: 'Please use your @dlsud.edu.ph email address.',
          color: 'red',
        });
        form.setFieldError('email', 'Please use your @dlsud.edu.ph email address.');
        setLoading(false);
        return;
      }
      
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

  const strength = getStrength(newPassword);
  const meetsRequirements =
    newPassword.length > 5 && requirements.every((requirement) => requirement.re.test(newPassword));
  const passwordsMatch = newPassword === confirmPassword;

  return (
    <Paper radius="md" p="xl" withBorder pos="relative">
      <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />
      <Text size="lg" fw={500}>
        Add users here!
      </Text>

      <form onSubmit={form.onSubmit(handleRegister)}>
        <Stack>
          <Text fw={500} size="sm">
            Role <span style={{ color: 'red' }}>*</span>
          </Text>
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
            data-autofocus
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
                  withAsterisk
                  label="Password"
                  placeholder="Your password"
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.currentTarget.value);
                    form.setFieldValue('password', event.currentTarget.value);
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
            required
            withAsterisk
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

          <Button
            type="submit"
            radius="xl"
            mt="xl"
            disabled={!meetsRequirements || !passwordsMatch}
          >
            Register
          </Button>
        </Stack>
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
    // <Autocomplete
    //   value={value}
    //   data={data}
    //   onChange={handleChange}
    //   rightSection={loading ? <Loader size="1rem" /> : null}
    //   label="Email"
    //   placeholder="hello@mantine.dev"
    //   required
    //   radius="md"
    // />
    <TextInput
                    required
                    label="Email"
                    placeholder="yourname@dlsud.edu.ph"
                    value={value}
                    onChange={(event) => {
                      handleChange(event.currentTarget.value);
                    }}
                    radius="md"
                  />
  );
}
