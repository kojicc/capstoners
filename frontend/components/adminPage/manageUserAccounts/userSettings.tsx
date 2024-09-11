import { useState, useEffect } from 'react';
import axiosInstance from '@/utils/axiosInstance';
import {
  Table,
  Button,
  TextInput,
  Container,
  Title,
  Text,
  UnstyledButton,
  Group,
  Center,
  rem,
  ActionIcon,
  Modal,
  Stack,
  Pagination,
  Flex,
  Autocomplete,
  NumberInput,
  LoadingOverlay,
  NativeSelect,
  Paper,
  Box,
  PasswordInput,
  Popover,
  Progress,
  FileInput,
  Loader,
  Tooltip,
} from '@mantine/core';
import {
  IconSelector,
  IconChevronDown,
  IconChevronUp,
  IconSearch,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
  IconKeyFilled,
  IconDownload,
  IconUpload,
} from '@tabler/icons-react';
import classes from '@/components/modules.css/TableSort.module.css';
import { notifications } from '@mantine/notifications';
import styles from '@/components/modules.css/TableSort.module.css';
import { useRouter } from 'next/router';
import { Dropzone, FileWithPath, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import useSWR, { useSWRConfig } from 'swr';
import { modals } from '@mantine/modals';
// import { ReusableTable } from '@/components/transactionsUser';
// import classes from '../components/modules.css/Demo.module.css';

interface Users {
  category: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  image: string;
  productId: string;
}

interface Category {
  categoryId: string;
  name: string;
  description: string;
  icon: string;
}

interface Users {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  role: string;
  date_joined?: string;
  fullname?: string;
}

export interface ThProps {
  children: React.ReactNode;
  sorted?: boolean;
  reversed?: boolean;
  onSort?: () => void;
}

function Th({ children, reversed, sorted, onSort }: ThProps) {
  const Icon = sorted ? (reversed ? IconChevronUp : IconChevronDown) : IconSelector;
  return (
    <Table.Th className={classes.th}>
      <UnstyledButton onClick={onSort} className={classes.control}>
        <Group justify="space-between">
          <Text fw={500} fz="sm">
            {children}
          </Text>
          <Center className={classes.icon}>
            <Icon style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
          </Center>
        </Group>
      </UnstyledButton>
    </Table.Th>
  );
}

function filterData(data: Users[] | undefined, search: string): Users[] {
  if (!Array.isArray(data)) {
    console.error('Data is not an array or is undefined');
    return [];
  }

  const query = search.toLowerCase().trim();
  return data.filter(
    (item) =>
      (item.email?.toLowerCase() || '').includes(query) ||
      (item.first_name?.toLowerCase() || '').includes(query) ||
      (item.last_name?.toLowerCase() || '').includes(query) ||
      (item.username?.toLowerCase() || '').includes(query) ||
      (item.role?.toLowerCase() || '').includes(query) ||
      (item.date_joined?.toLowerCase() || '').includes(query)
  );
}

function sortData(
  data: Users[],
  { sortBy, reversed, search }: { sortBy: keyof Users | null; reversed: boolean; search: string }
) {
  const filteredData = filterData(data, search);
  console.log('filteredData:', filteredData);
  return filteredData.sort((a, b) => {
    if (!sortBy) return 0;

    const aValue = a[sortBy];
    const bValue = b[sortBy];

    const aString = typeof aValue === 'string' ? aValue.toLowerCase() : '';
    const bString = typeof bValue === 'string' ? bValue.toLowerCase() : '';

    return reversed ? bString.localeCompare(aString) : aString.localeCompare(bString);
  });
}

function PasswordRequirement({ meets, label }: { meets: boolean; label: string }) {
  return (
    <Text
      c={meets ? 'teal' : 'red'}
      style={{ display: 'flex', alignItems: 'center' }}
      mt={7}
      size="sm"
    >
      {meets ? (
        <IconCheck style={{ width: rem(14), height: rem(14) }} />
      ) : (
        <IconX style={{ width: rem(14), height: rem(14) }} />
      )}{' '}
      <Box ml={10}>{label}</Box>
    </Text>
  );
}

const requirements = [
  { re: /[0-9]/, label: 'Includes number' },
  { re: /[a-z]/, label: 'Includes lowercase letter' },
  { re: /[A-Z]/, label: 'Includes uppercase letter' },
  { re: /[$&+,:;=?@#|'<>.^*()%!-]/, label: 'Includes special symbol' },
];

function getStrength(password: string) {
  let multiplier = password.length > 5 ? 0 : 1;

  requirements.forEach((requirement) => {
    if (!requirement.re.test(password)) {
      multiplier += 1;
    }
  });

  return Math.max(100 - (100 / (requirements.length + 1)) * multiplier, 10);
}

const UpdateUser = () => {
  const [users, setUsers] = useState<Users[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortedData, setSortedData] = useState<Users[]>([]);
  const [sortBy, setSortBy] = useState<keyof Users | null>(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [updatePasswordModalOpened, setUpdatePasswordModalOpened] = useState(false);
  // const [selectedUsers, setSelectedUsers] = useState<Users | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Users | null>(null);
  const [activePage, setPage] = useState(1);
  //   const [quantity, setQuantity] = useState<number>();
  //   const [disabled, setDisabled] = useState<boolean[]>([]);
  const itemsPerPage = 5;
  const router = useRouter();
  // Fetch data using SWR
  const fetchers = (url: string) => axiosInstance.get(url).then((res) => res.data);
  const { data: usersData, error: usersError } = useSWR<Users[]>('adminupdateUsers/', fetchers, {
    refreshInterval: 1000,
  });
  if (usersError) return <Text color="red">Failed to load users</Text>;
  const { mutate } = useSWRConfig();

  const [popoverOpened, setPopoverOpened] = useState(false);
  const [value, setValue] = useState('');
  const [newpassword, setNewPassword] = useState('');

  const checks = requirements.map((requirement, index) => (
    <PasswordRequirement key={index} label={requirement.label} meets={requirement.re.test(value)} />
  ));

  const strength = getStrength(value);
  const color = strength === 100 ? 'teal' : strength > 50 ? 'yellow' : 'red';

  useEffect(() => {
    if (usersData) {
      setUsers(usersData);
    }
  }, [usersData]);

  useEffect(() => {
    setSortedData(sortData(users, { sortBy, reversed: reverseSortDirection, search: searchQuery }));
  }, [users, sortBy, reverseSortDirection, searchQuery]);

  if (usersError)
    return <LoadingOverlay visible={true} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />;

  if (!usersData)
    return <LoadingOverlay visible={true} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />;

  // const allUserData = usersData;
  // setUsers(allUserData);
  // setUsers(allUserData);
  // console.log("allUserData",allUserData);

  const handleSort = (field: keyof Users) => {
    const reversed = field === sortBy ? !reverseSortDirection : false;
    setReverseSortDirection(reversed);
    setSortBy(field);
  };

  const handleDelete = async () => {
    const username = selectedUsers?.username || '';
    const email = selectedUsers?.email || '';
    console.log('selectedUsersusername:', username);
    setLoading(true);

    try {
      const response = await axiosInstance.delete(`adminupdateUsers/`, {
        data: { username, email },
      });

      if (response.status === 200) {
        setError('');
        const id = notifications.show({
          loading: true,
          title: 'Deleting your selected user',
          message: 'Data will be deleted shortly.',
          autoClose: false,
          withCloseButton: false,
        });
        setTimeout(() => {
          notifications.update({
            id,
            color: 'teal',
            title: 'Data was loaded',
            message: 'Notification will close in 2 seconds, you can close this notification now',
            icon: <IconCheck style={{ width: rem(18), height: rem(18) }} />,
            loading: false,
            autoClose: 2000,
          });
        }, 1000);
        mutate('adminupdateUsers/');
        setDeleteModalOpened(false);
      } else {
        setError('Failed to delete product');
        notifications.show({
          title: 'Error',
          message: 'Failed to delete product.',
          color: 'red',
        });
      }
    } catch (error) {
      setError('Delete failed');
      notifications.show({
        title: 'Error',
        message: 'Failed to delete product.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    const formData = new FormData();
    formData.append('first_name', selectedUsers?.first_name || '');
    formData.append('last_name', selectedUsers?.last_name || '');
    formData.append('email', selectedUsers?.email || '');
    formData.append('username', selectedUsers?.username || '');
    formData.append('role', selectedUsers?.role || '');

    setLoading(true);

    try {
      const response = await axiosInstance.put('adminupdateUsers/', formData);

      handleCloseModal();
      notifications.show({
        title: 'Success',
        message: 'Users updated successfully.',
        color: 'green',
      });
    } catch (error) {
      console.error('Error updating users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setEditModalOpened(false);
    setSelectedUsers(null);
  };

  const handleUpdatePassword = async () => {
    const formData = new FormData();
    formData.append('password', newpassword || '');
    formData.append('username', selectedUsers?.username || '');
    formData.append('email', selectedUsers?.email || '');

    setLoading(true);

    try {
      const response = await axiosInstance.put('forgetPassword/', formData);

      handleCloseModal();
      notifications.show({
        title: 'Success',
        message: 'Password updated successfully.',
        color: 'green',
      });
    } catch (error) {
      console.error('Error updating password:', error);
    } finally {
      setLoading(false);
    }
  };

  const paginatedData = sortedData.slice(
    (activePage - 1) * itemsPerPage,
    activePage * itemsPerPage
  );

  const openDeleteModal = () =>
    modals.openConfirmModal({
      title: `This will change this user's password`,
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to change the password of this user? This action is destructive.
        </Text>
      ),
      labels: { confirm: 'Change password', cancel: "No don't change it" },
      confirmProps: { color: 'red' },
      onCancel: () => console.log('Cancel'),
      onConfirm: () => {
        handleUpdatePassword();
        setUpdatePasswordModalOpened(false);
        setNewPassword('');
      },
    });

  const [openedImportExport, setOpenedImportExport] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loadingImportExport, setLoadingImportExport] = useState(false);
  const [username, setUsername] = useState('');
  const [openedExport, setOpenedExport] = useState(false);

  const handleExport = async () => {
    try {
      setLoadingImportExport(true);
      const response = await axiosInstance.get('exportimportUser/', { responseType: 'blob', params: { username } });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'users.xlsx');
      document.body.appendChild(link);
      link.click();
      notifications.show({ message: 'Export successful!', color: 'green' });
    } catch (error) {
      notifications.show({ message: 'Export failed.', color: 'red' });
    } finally {
      setLoadingImportExport(false);
      setUsername('');
      setOpenedExport(false);
    }
  };

  // Import users
  const handleImport = async () => {
    if (!file) return;

    try {
      setLoadingImportExport(true);
      const formData = new FormData();
      formData.append('file', file);

      await axiosInstance.post('exportimportUser/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      notifications.show({ message: 'Import successful!', color: 'green' });
      setFile(null);
    } catch (error) {
      notifications.show({ message: 'Import failed.', color: 'red' });
    } finally {
      setLoadingImportExport(false);
      setOpenedImportExport(false);
    }
  };

  return (
    <Paper shadow="xl" radius="md" p="xl" m={'xl'}>
      <Flex justify="center" align="center" direction="row" wrap="wrap" className={classes.inner}>
        <Container>
          <Group justify="center" gap="md" flex="column">
            <Title my={20} c={'black'} order={2}>
              User History - Admin
            </Title>

            <Group gap="md">
              {/* Export Users Button */}
              <Popover
                opened={openedExport}
                onChange={setOpenedExport}
                withArrow
                shadow="md"
                position="bottom"
                trapFocus={false}
                closeOnClickOutside={false}
              >
                <Popover.Target>
                  <Tooltip label="Export User Information">
                    <ActionIcon
                      onClick={() => setOpenedExport((o) => !o)}
                      disabled={loading}
                      color="blue"
                      variant="outline"
                    >
                      {loading ? <Loader size="xs" /> : <IconDownload size={16} />}
                    </ActionIcon>
                  </Tooltip>
                </Popover.Target>
                <Popover.Dropdown>
                  {/* <TextInput
                    placeholder="Enter username to filter"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    mb="md"
                  /> */}
                  <Autocomplete
                    autoComplete="new-password"
                    placeholder="Input username to filter"
                    value={username}
                    onChange={setUsername}
                    leftSection={
                      <IconSearch style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
                    }
                    my={20}
                    data={[
                      {
                        group: 'Usernames',
                        items: users.map((user) => ({
                          value: user.username,
                          label: user.username,
                        })),
                      },
                    ]}
                    limit={5}
                    comboboxProps={{
                      transitionProps: { transition: 'pop', duration: 200 },
                      dropdownPadding: 10,
                      shadow: 'xl',
                    }}
                  />
                  <Button onClick={handleExport} disabled={loading} fullWidth>
                    {loading ? <Loader size="xs" /> : 'Export'}
                  </Button>
                </Popover.Dropdown>
              </Popover>
              {/* Import Users Button with Popover */}
              <Popover
                opened={openedImportExport}
                onChange={setOpenedImportExport}
                withArrow
                shadow="md"
                position="bottom"
                trapFocus={false} // Allow interaction with the file explorer
                closeOnClickOutside={false} // Keep the popover open when clicking outside
              >
                <Popover.Target>
                  <Tooltip label="Import User Information">
                    <ActionIcon
                      onClick={() => setOpenedImportExport((o) => !o)}
                      disabled={loading}
                      color="green"
                      variant="outline"
                    >
                      {loading ? <Loader size="xs" /> : <IconUpload size={16} />}
                    </ActionIcon>
                  </Tooltip>
                </Popover.Target>
                <Popover.Dropdown>
                  <FileInput
                    placeholder="Choose file"
                    onChange={(selectedFile) => setFile(selectedFile)}
                    accept=".xlsx"
                    required
                  />
                  <Button
                    mt="md"
                    onClick={handleImport}
                    disabled={loading || !file} // Disable the button if no file is selected
                    fullWidth
                  >
                    {loading ? <Loader size="xs" /> : 'Upload'}
                  </Button>
                </Popover.Dropdown>
              </Popover>
            </Group>
          </Group>
          <Autocomplete
            autoComplete="new-password"
            placeholder="Search users using users ids"
            value={searchQuery}
            onChange={setSearchQuery}
            leftSection={<IconSearch style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
            my={20}
            data={[
              {
                group: 'Usernames',
                items: users.map((user) => ({
                  value: user.username,
                  label: user.username,
                })),
              },
              {
                group: 'Roles',
                items: ['admin', 'user'],
              },
            ]}
            limit={5}
            comboboxProps={{
              transitionProps: { transition: 'pop', duration: 200 },
              dropdownPadding: 10,
              shadow: 'xl',
            }}
          />

          {loading ? (
            <Text>Loading...</Text>
          ) : error ? (
            <Text color="red">{error}</Text>
          ) : (
            <>
              <Table className={styles.table} horizontalSpacing="xl" verticalSpacing="xs">
                <thead>
                  <tr>
                    <Th
                      sorted={sortBy === 'id'}
                      reversed={reverseSortDirection}
                      onSort={() => handleSort('id')}
                    >
                      User ID
                    </Th>

                    <Th
                      sorted={sortBy === 'username'}
                      reversed={reverseSortDirection}
                      onSort={() => handleSort('username')}
                    >
                      User Name
                    </Th>

                    <Th
                      sorted={sortBy === 'email'}
                      reversed={reverseSortDirection}
                      onSort={() => handleSort('email')}
                    >
                      Email
                    </Th>

                    <Th
                      sorted={sortBy === 'fullname'}
                      reversed={reverseSortDirection}
                      onSort={() => handleSort('fullname')}
                    >
                      Full Name
                    </Th>

                    <Th
                      sorted={sortBy === 'role'}
                      reversed={reverseSortDirection}
                      onSort={() => handleSort('role')}
                    >
                      Role
                    </Th>

                    <Th
                      sorted={sortBy === 'date_joined'}
                      reversed={reverseSortDirection}
                      onSort={() => handleSort('date_joined')}
                    >
                      Date Joined
                    </Th>

                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((users) => {
                    // const users = users.items.map((item: { product: any; }) => item.product.productId).join(', ');
                    // const quantities = users.items.map((item: { quantity: any; }) => item.quantity).join(', ');

                    return (
                      <tr key={users.id} className={styles.tr} id={users.id}>
                        <td className={styles.td}>{users.id}</td>
                        <td className={styles.td}>{users.username}</td>
                        <td className={styles.td}>{users.email}</td>
                        <td className={styles.td}>{`${users.first_name} ${users.last_name}`}</td>
                        <td className={styles.td}>{users.role}</td>
                        <td className={styles.td}>{users.date_joined}</td>
                        <td className={styles.td}>
                          <Group gap="xs">
                            <ActionIcon
                              onClick={() => {
                                setSelectedUsers(users);
                                setEditModalOpened(true);
                              }}
                            >
                              <IconEdit />
                            </ActionIcon>
                            <ActionIcon
                              color="yellow"
                              onClick={() => {
                                setSelectedUsers(users);
                                setUpdatePasswordModalOpened(true);
                              }}
                            >
                              <IconKeyFilled />
                            </ActionIcon>
                            <ActionIcon
                              color="red"
                              onClick={() => {
                                setSelectedUsers(users);
                                setDeleteModalOpened(true);
                              }}
                            >
                              <IconTrash />
                            </ActionIcon>
                          </Group>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
              <Flex justify="center">
                <Pagination
                  value={activePage}
                  onChange={setPage}
                  total={Math.ceil(sortedData.length / itemsPerPage)}
                  mt="md"
                  color="blue"
                />
              </Flex>
            </>
          )}

          <Modal
            opened={updatePasswordModalOpened}
            onClose={() => {
              setUpdatePasswordModalOpened(false);
              setNewPassword('');
            }}
            title="Update Password"
          >
            <LoadingOverlay
              visible={loading}
              zIndex={1000}
              overlayProps={{ radius: 'sm', blur: 2 }}
            />

            <Stack>
              <TextInput
                disabled
                label="User's ID"
                value={selectedUsers?.username || ''}
                onChange={(event) =>
                  setSelectedUsers((prev) => ({ ...prev, id: event.currentTarget.value }) as Users)
                }
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
                      required
                      withAsterisk
                      label="New password"
                      placeholder="New password"
                      value={newpassword}
                      onChange={(event) => setNewPassword(event.currentTarget.value)}
                      autoComplete="new-password"
                    />
                  </div>
                </Popover.Target>
                <Popover.Dropdown>
                  <Progress color={color} value={strength} size={5} mb="xs" />
                  <PasswordRequirement
                    label="Includes at least 6 characters"
                    meets={value.length > 5}
                  />
                  {checks}
                </Popover.Dropdown>
              </Popover>

              <Button onClick={openDeleteModal}>Save Changes</Button>
            </Stack>
          </Modal>

          {/* Edit Modal */}
          <Modal opened={editModalOpened} onClose={handleCloseModal} title="Edit Users">
            <LoadingOverlay
              visible={loading}
              zIndex={1000}
              overlayProps={{ radius: 'sm', blur: 2 }}
            />

            <Stack>
              <TextInput
                disabled
                label="User's ID"
                value={selectedUsers?.id || ''}
                onChange={(event) =>
                  setSelectedUsers((prev) => ({ ...prev, id: event.currentTarget.value }) as Users)
                }
              />

              <TextInput
                label="User's Email"
                disabled
                value={selectedUsers?.email || ''}
                onChange={(event) =>
                  setSelectedUsers(
                    (prev) => ({ ...prev, description: event.currentTarget.value }) as Users
                  )
                }
              />

              <TextInput
                label="User's Username"
                disabled
                value={selectedUsers?.username || ''}
                onChange={(event) =>
                  setSelectedUsers(
                    (prev) => ({ ...prev, name: event.currentTarget.value }) as Users
                  )
                }
              />

              <TextInput
                label="User's First Name"
                value={selectedUsers?.first_name || ''}
                onChange={(event) =>
                  setSelectedUsers(
                    (prev) => ({ ...prev, first_name: event.currentTarget.value }) as Users
                  )
                }
              />

              <TextInput
                label="User's Last Name"
                value={selectedUsers?.last_name || ''}
                onChange={(event) =>
                  setSelectedUsers(
                    (prev) => ({ ...prev, last_name: event.currentTarget.value }) as Users
                  )
                }
              />

              <NativeSelect
                label="User's Role"
                data={[
                  { value: 'admin', label: 'Admin' },
                  { value: 'student', label: 'Student' },
                ]}
                value={selectedUsers?.role || ''}
                onChange={(event) =>
                  setSelectedUsers(
                    (prev) => ({ ...prev, role: event.currentTarget.value! }) as Users
                  )
                }
              />

              <Button onClick={handleEdit}>Save Changes</Button>
            </Stack>
          </Modal>

          <Modal
            opened={deleteModalOpened}
            onClose={() => setDeleteModalOpened(false)}
            title="Delete Users"
          >
            <LoadingOverlay
              visible={loading}
              zIndex={1000}
              overlayProps={{ radius: 'sm', blur: 2 }}
            />

            <Text>Are you sure you want to delete this users?</Text>
            <Group justify="center" mt="md">
              <Button color="red" onClick={handleDelete}>
                Delete
              </Button>
              <Button onClick={() => setDeleteModalOpened(false)}>Cancel</Button>
            </Group>
          </Modal>
        </Container>
      </Flex>
    </Paper>
  );
};

export default UpdateUser;
