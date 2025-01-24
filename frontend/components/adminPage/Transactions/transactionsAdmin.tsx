import { useState, useEffect } from 'react';
import axiosInstance from '@/utils/axiosInstance';
import {
  Table,
  Button,
  TextInput,
  Container,
  Title,
  Text,
  ScrollArea,
  UnstyledButton,
  Group,
  Center,
  rem,
  ActionIcon,
  Modal,
  Stack,
  Select,
  Pagination,
  Checkbox,
  NumberInput,
  Flex,
  Overlay,
  Autocomplete,
  LoadingOverlay,
  Grid,
  FileInput,
  Loader,
  Popover,
  Tooltip,
  Divider,
  TableScrollContainer,
  TagsInput,
  Paper,
  Image,
} from '@mantine/core';
import {
  IconSelector,
  IconChevronDown,
  IconChevronUp,
  IconSearch,
  IconEdit,
  IconTrash,
  IconDownload,
  IconUpload,
  IconX,
  IconClock,
} from '@tabler/icons-react';
import classes from '@/components/modules.css/TableSort.module.css';
import { notifications } from '@mantine/notifications';
import moment from 'moment-timezone';
import {
  DateInput,
  DatePickerInput,
  DatesProvider,
  DateTimePicker,
  MonthPickerInput,
  TimeInput,
} from '@mantine/dates';
import styles from '@/components/modules.css/TableSort.module.css';
import { useRouter } from 'next/router';
// import { ReusableTable } from '@/components/transactionsUser';
// import classes from '../components/modules.css/Demo.module.css';
import useSWR from 'swr';
import dayjs from 'dayjs';

interface Product {
  image: string;
  productId: string;
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
  class_section: string;
  group_members?: string[];
  is_group?: boolean;
}

interface ReservationItem {
  reservation: string;
  product: Product; // Update product to be of type Product
  quantity: number;
}

interface Reservation {
  items: ReservationItem[];
  reservation_id: string;
  reservation_date: string;
  reservation_date_end: string;
  reservation_day: string;
  status: string;
  product_ids: string;
  quantities: string;
  reservation_purpose: string;
  reserved_date: string;
  is_group: boolean;
  group_members: string[];
  subject: string;
  message: string;
  user: string;
  user_class_section: string;
  user_email: string;
  reservation_made_at: string;
  remarks: string;
  same_day_reservation: boolean;
}
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

// Fetcher function for SWR
const fetcher = (url: string) => axiosInstance.get(url).then((res) => res.data);

export default function TransactionHistory() {
  // #region useStates
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<keyof Reservation | null>(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [activePage, setPage] = useState(1);
  const [quantity, setQuantity] = useState<number[]>([]);
  const [disabled, setDisabled] = useState<boolean[]>([]);
  const [users, setUsers] = useState<Users[]>([]);
  const [loader, setLoader] = useState(false);
  const [openedImportExport, setOpenedImportExport] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loadingImportExport, setLoadingImportExport] = useState(false);
  const [username, setUsername] = useState('');
  const [openedExport, setOpenedExport] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMonthYear, setSelectedMonthYear] = useState<Date | null>(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [value, setValue] = useState<string[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedClassTime, setSelectedClassTime] = useState('');
  const [subject, setSubject] = useState('');

  const [isGroupCheckout, setIsGroupCheckout] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedReservationPurpose, setSelectedReservationPurpose] = useState('');

  // #endregion

  const itemsPerPage = 5;
  const router = useRouter();

  // SWR for fetching reservations
  const {
    data: reservationsData,
    error: reservationsError,
    mutate,
    isValidating,
  } = useSWR('adminReservationDetail/', fetcher, {
    refreshInterval: 5000, // Refresh data every 5 seconds
    // onSuccess: (data) => {
    //   setReservations(data.reservations);
    // },
    // onError(err, key, config) {
    //   console.error('Failed to fetch reservations:', err);
    // },
  });

  const { data: classSchedules } = useSWR<ClassSchedule[]>(`classScheduleCRUD/`, fetcher);

  const { data: usersData, error: usersError } = useSWR<Users[]>('adminupdateUsers/', fetcher, {
    // refreshInterval: 1000,
    onSuccess: (data) => {
      setUsers(data);
    },
  });

  useEffect(() => {
    try {
      setLoading(true);
      if (reservationsData) {
        if (reservationsData.message === 'No reservations available') {
          setReservations([]);
          setLoading(false);
        }
        if (reservationsData.reservations) {
          setReservations(reservationsData.reservations);
          setLoading(false);
        }

        console.log('Reservations:', reservationsData.reservations);
      }
      if (reservationsError) {
        console.error('Error:', reservationsError);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }, [reservationsData]);

  // if (error) {
  //   console.log('Error:', error);
  //   return (
  //     <Flex justify="center" align="center" style={{ height: '100vh' }}>
  //       <Title c={'white'}>Error loading reservations: {error.message}</Title>
  //     </Flex>
  //   );
  // }

  const handleExport = async () => {
    try {
      setLoadingImportExport(true);
      let formattedDate = null;
      if (selectedDate) {
        formattedDate = formatDateWithMilliseconds(selectedDate);
      } else if (selectedMonthYear) {
        formattedDate = formatMonthandYear(selectedMonthYear);
      }

      console.log('formattedDate:', formattedDate);
      const response = await axiosInstance.get('importExportReservations/', {
        responseType: 'blob',
        params: {
          username,
          reserved_date: formattedDate, // Send formatted date
        },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'reservations.xlsx');
      document.body.appendChild(link);
      link.click();

      notifications.show({ message: 'Export successful!', color: 'green' });
    } catch (error) {
      notifications.show({ message: 'Export failed.', color: 'red' });
    } finally {
      setLoadingImportExport(false);
      setUsername('');
      setOpenedExport(false);
      setSelectedDate(null);
      setSelectedMonthYear(null);
    }
  };

  // Import users
  const handleImport = async () => {
    if (!file) return;

    try {
      setLoadingImportExport(true);
      const formData = new FormData();
      formData.append('file', file);

      await axiosInstance.post('importExportReservations/', formData, {
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
      mutate();
    }
  };

  // Handle search
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.currentTarget.value);
  };

  useEffect(() => {
    if (router.query.searchQuery) {
      setSearchQuery(router.query.searchQuery as string);
    }
  }, [router.query.searchQuery]);

  // Function to handle change and update disabled state
  const handleCheckboxChange = (selectedValues: string[]) => {
    setValue(selectedValues);

    selectedReservation?.items.forEach((item, index) => {
      if (selectedValues.includes(item.product.productId)) {
        setDisabled((prevDisabled) => {
          const newDisabled = [...prevDisabled];
          newDisabled[index] = false; // Enable the corresponding NumberInput
          return newDisabled;
        });
      } else {
        setDisabled((prevDisabled) => {
          const newDisabled = [...prevDisabled];
          newDisabled[index] = true; // Disable the corresponding NumberInput
          return newDisabled;
        });
      }
    });
  };

  useEffect(() => {
    if (selectedReservation?.items) {
      const initialQuantities = selectedReservation.items.map((item) => item.quantity);
      setQuantity(initialQuantities);
      setDisabled(new Array(selectedReservation.items.length).fill(true));
    }
  }, [selectedReservation]);

  // Filter and sort data
  const filterData = (data: Reservation[], search: string): Reservation[] => {
    if (!Array.isArray(data)) {
      console.error('Data is not an array or is undefined');
      return [];
    }

    const query = search.toLowerCase().trim();
    return data.filter(
      (item) =>
        (item.reservation_id?.toLowerCase() || '').includes(query) ||
        (item.reservation_date?.toLowerCase() || '').includes(query) ||
        (item.status?.toLowerCase() || '').includes(query)
    );
  };

  const sortData = (
    data: Reservation[],
    {
      sortBy,
      reversed,
      search,
    }: { sortBy: keyof Reservation | null; reversed: boolean; search: string }
  ) => {
    const filteredData = filterData(data, search);
    return filteredData.sort((a, b) => {
      if (!sortBy) return 0;

      const aValue = a[sortBy];
      const bValue = b[sortBy];

      const aString = typeof aValue === 'string' ? aValue.toLowerCase() : '';
      const bString = typeof bValue === 'string' ? bValue.toLowerCase() : '';

      return reversed ? bString.localeCompare(aString) : aString.localeCompare(bString);
    });
  };

  const sortedData = sortData(reservations, {
    sortBy,
    reversed: reverseSortDirection,
    search: searchQuery,
  });

  const handleSort = (field: keyof Reservation) => {
    const reversed = field === sortBy ? !reverseSortDirection : false;
    setReverseSortDirection(reversed);
    setSortBy(field);
  };

  const handleDelete = async () => {
    const reservationId = selectedReservation?.reservation_id || '';
    try {
      const response = await axiosInstance.delete('reservationsDelete/', {
        data: { reservationId },
      });

      if (response.status === 200) {
        mutate(); // Re-fetch data after successful deletion
        notifications.show({
          title: 'Success',
          message: 'Reservation deleted successfully.',
          color: 'green',
        });
        setDeleteModalOpened(false);
      } else {
        notifications.show({
          title: 'Error',
          message: 'Failed to delete reservation.',
          color: 'red',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete reservation.',
        color: 'red',
      });
    }
  };

  const handleEdit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();

    if (!selectedReservation) {
      console.error('No reservation selected');
      return;
    }

    // Split class time string into components
    const day = dayjs(selectedReservation.reserved_date).format('dddd');

    // Create payload with separate date and time fields
    const data = {
      username: selectedReservation.reservation_id.split('_')[0],
      reservationId: selectedReservation.reservation_id,
      status: selectedReservation.status,
      reservation_purpose: selectedReservation.reservation_purpose,
      productIds: value.map((item) => item),
      quantities: quantity.map((item) => item),
      subject: selectedReservation.subject,
      reservation_day: day,
      reservation_date: selectedReservation.reservation_date, // Send time as HH:mm:ss
      reservation_date_end: selectedReservation.reservation_date_end, // Send time as HH:mm:ss
      is_group: selectedReservation.is_group,
      group_members: selectedReservation.group_members ? selectedReservation.group_members : [],
      reserved_date: selectedReservation.reserved_date,
      user_class_section: selectedReservation.user_class_section,
      remarks: selectedReservation.remarks,
    };

    try {
      setLoader(true);
      await axiosInstance.post('adminUpdateReservationStatus/', data);
      handleCloseModal();
      mutate();
      notifications.show({
        title: 'Success',
        message: 'Reservation updated successfully.',
        color: 'green',
      });
    } catch (error) {
      console.error('Error updating reservation:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update reservation.',
        color: 'red',
      });
    } finally {
      setIsGroupCheckout(false);
      setSelectedUsers([]);
      setLoader(false);
    }
  };

  const selectedDay = selectedDate ? dayjs(selectedDate).format('dddd').toUpperCase() : '';

  const cthmSubjects = [
    'Hospitality Management',
    'Tourism Management',
    'Culinary Arts',
    'Hotel Administration',
    'Event Management',
  ];

  useEffect(() => {
    if (selectedReservation?.items) {
      // Initialize the quantity state based on selectedReservation items
      const initialQuantities = selectedReservation.items.map((item) => item.quantity);
      setQuantity(initialQuantities);
    }
  }, [selectedReservation]);

  const handleCloseModal = () => {
    setEditModalOpened(false);
    setSelectedReservation(null);
    setQuantity([]);
    setDisabled([]);
    setValue([]);
  };

  const paginatedData = sortedData.slice(
    (activePage - 1) * itemsPerPage,
    activePage * itemsPerPage
  );

  const formatDateWithMilliseconds = (date: {
    getFullYear: () => any;
    getMonth: () => number;
    getDate: () => any;
    getHours: () => any;
    getMinutes: () => any;
    getSeconds: () => any;
    getMilliseconds: () => any;
  }) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    // return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
    return `${year}-${month}-${day}`;
  };

  const formatMonthandYear = (date: { getFullYear: () => any; getMonth: () => number }) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    return `${year}-${month}`;
  };

  return (
    <Container fluid>
      <Overlay color="#000" opacity={1} zIndex={-1} />

      <Flex
        gap="md"
        justify="center"
        align="center"
        // direction="row"
        direction={{ base: 'column', sm: 'row' }}
        wrap="wrap"
        className={classes.inner}
      >
        {reservations.length === 0 ? (
          <Stack gap="md">
            <Title c={'white'}>No reservations available</Title>
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
                  <Button
                    onClick={() => setOpenedImportExport((o) => !o)}
                    disabled={loading}
                    color="green"
                    variant="outline"
                  >
                    {loading ? <Loader size="xs" /> : 'Do you want to import?'}
                  </Button>
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
          </Stack>
        ) : reservationsError ? (
          <Text color="red">{reservationsError}</Text>
        ) : (
          <Container fluid>
            <Group gap="md" p={10}>
              <Title c={'white'} order={2}>
                Transaction History - Admin
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
                  // closeOnClickOutside={false}
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

                    {/* Date Picker for Filtering Data */}
                    <DatePickerInput
                      placeholder="Select Date"
                      label="Pick Date"
                      value={selectedDate}
                      onChange={setSelectedDate}
                      clearable
                      disabled={!!selectedMonthYear} // Disable if MonthPickerInput has a value
                    />

                    <Divider orientation="horizontal" my="md" label="or" />
                    <MonthPickerInput
                      label="Pick Month and Year"
                      placeholder="Pick date"
                      value={selectedMonthYear}
                      onChange={setSelectedMonthYear}
                      disabled={!!selectedDate} // Disable if DatePickerInput has a value
                      clearable
                    />
                    <Divider orientation="horizontal" my="md" />

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
                  // closeOnClickOutside={false} // Keep the popover open when clicking outside
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
              placeholder="Search reservations using reservation ids"
              value={searchQuery}
              onChange={setSearchQuery}
              leftSection={<IconSearch style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
              mb="md"
              data={[
                {
                  group: 'ReservationIDs',
                  items: reservations.map(
                    (reservation: { reservation_id: any }) => reservation.reservation_id
                  ),
                },
                {
                  group: 'Reservation Status',
                  items: [
                    'PENDING',
                    'APPROVED',
                    'REJECTED',
                    'CANCELLED',
                    'COMPLETED',
                    'AWAITING RETURN',
                    'DAMAGED/LOST/PARTIALLY_COMPLETED',
                    'AWAITING PAYMENT',
                  ],
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
              <>
                <Text>Loading...</Text>
              </>
            ) : (
              <Container fluid>
                {/* <ScrollArea offsetScrollbars type="auto" className={styles.tableContainer}> */}
                <Grid>
                  <Grid.Col span="auto">
                    <div>
                      <Paper shadow="xl" p="sm" radius="md" withBorder>
                        <TableScrollContainer minWidth={500}>
                          <Table
                            striped
                            highlightOnHover
                            withTableBorder
                            withColumnBorders
                            // className={styles.table}
                            horizontalSpacing="xl"
                            verticalSpacing="xs"
                          >
                            <Table.Thead>
                              <Table.Tr>
                                <Th
                                  sorted={sortBy === 'reservation_id'}
                                  reversed={reverseSortDirection}
                                  onSort={() => handleSort('reservation_id')}
                                >
                                  Reservation ID
                                </Th>

                                <Th
                                  sorted={sortBy === 'user'}
                                  reversed={reverseSortDirection}
                                  onSort={() => handleSort('user')}
                                >
                                  Username
                                </Th>

                                <Th
                                  sorted={sortBy === 'user_email'}
                                  reversed={reverseSortDirection}
                                  onSort={() => handleSort('user_email')}
                                >
                                  Email
                                </Th>

                                <Th
                                  sorted={sortBy === 'user_class_section'}
                                  reversed={reverseSortDirection}
                                  onSort={() => handleSort('user_class_section')}
                                >
                                  User Class Section
                                </Th>
                                <Th
                                  sorted={sortBy === 'reservation_day'}
                                  reversed={reverseSortDirection}
                                  onSort={() => handleSort('reservation_day')}
                                >
                                  Reservation Day
                                </Th>

                                <Th
                                  sorted={sortBy === 'reserved_date'}
                                  reversed={reverseSortDirection}
                                  onSort={() => handleSort('reserved_date')}
                                >
                                  Reserved Date
                                </Th>
                                <Th
                                  sorted={sortBy === 'reservation_date'}
                                  reversed={reverseSortDirection}
                                  onSort={() => handleSort('reservation_date')}
                                >
                                  Reservation Date Start
                                </Th>
                                <Th
                                  sorted={sortBy === 'reservation_date_end'}
                                  reversed={reverseSortDirection}
                                  onSort={() => handleSort('reservation_date_end')}
                                >
                                  Reservation Date End
                                </Th>
                                <Th
                                  sorted={sortBy === 'reservation_made_at'}
                                  reversed={reverseSortDirection}
                                  onSort={() => handleSort('reservation_made_at')}
                                >
                                  {' '}
                                  Reservation Time
                                </Th>

                                <Th
                                  sorted={sortBy === 'is_group'}
                                  reversed={reverseSortDirection}
                                  onSort={() => handleSort('is_group')}
                                >
                                  By group?
                                </Th>

                                <Th
                                  sorted={sortBy === 'subject'}
                                  reversed={reverseSortDirection}
                                  onSort={() => handleSort('subject')}
                                >
                                  Subject
                                </Th>
                                <Th
                                  sorted={sortBy === 'reservation_purpose'}
                                  reversed={reverseSortDirection}
                                  onSort={() => handleSort('reservation_purpose')}
                                >
                                  Reservation Purpose
                                </Th>
                                <Th
                                  sorted={sortBy === 'product_ids'}
                                  reversed={reverseSortDirection}
                                  onSort={() => handleSort('product_ids')}
                                >
                                  Product IDs
                                </Th>
                                <Th
                                  sorted={sortBy === 'quantities'}
                                  reversed={reverseSortDirection}
                                  onSort={() => handleSort('quantities')}
                                >
                                  Quantities
                                </Th>
                                <Th
                                  sorted={sortBy === 'status'}
                                  reversed={reverseSortDirection}
                                  onSort={() => handleSort('status')}
                                >
                                  Status
                                </Th>
                                <Th
                                  sorted={sortBy === 'same_day_reservation'}
                                  reversed={reverseSortDirection}
                                  onSort={() => handleSort('same_day_reservation')}
                                >
                                  Same Day Reservation
                                </Th>

                                <Th
                                  sorted={sortBy === 'remarks'}
                                  reversed={reverseSortDirection}
                                  onSort={() => handleSort('remarks')}
                                >
                                  Remarks
                                </Th>
                                <Th>Actions</Th>
                              </Table.Tr>
                            </Table.Thead>

                            <Table.Tbody>
                              {paginatedData.map((reservation) => {
                                const products = reservation.items
                                  .map((item: { product: any }) => item.product.productId)
                                  .join(', ');
                                const quantities = reservation.items
                                  .map((item: { quantity: any }) => item.quantity)
                                  .join(', ');

                                return (
                                  <Table.Tr
                                    key={reservation.reservation_id}
                                    id={`reservation-${reservation.reservation_id}`}
                                  >
                                    <Table.Td className={styles.td}>
                                      {reservation.reservation_id}
                                    </Table.Td>
                                    <Table.Td className={styles.td}>{reservation.user}</Table.Td>
                                    <Table.Td className={styles.td}>
                                      {reservation.user_email}
                                    </Table.Td>
                                    <Table.Td className={styles.td}>
                                      {reservation.user_class_section}
                                    </Table.Td>
                                    <Table.Td className={styles.td}>
                                      {reservation.reservation_day}
                                    </Table.Td>
                                    <Table.Td className={styles.td}>
                                      {moment(new Date(reservation.reserved_date))
                                        .tz('Asia/Manila')
                                        .format('YYYY-MM-DD HH:mm')}
                                    </Table.Td>
                                    <Table.Td className={styles.td}>
                                      {moment(reservation.reservation_date, 'HH:mm:ss').format(
                                        'hh:mm A'
                                      )}
                                    </Table.Td>
                                    <Table.Td className={styles.td}>
                                      {moment(reservation.reservation_date_end, 'HH:mm:ss').format(
                                        'hh:mm A'
                                      )}
                                    </Table.Td>
                                    <Table.Td className={styles.td}>
                                      {moment(reservation.reservation_made_at).format(
                                        'YYYY-MM-DD HH:mm A'
                                      )}
                                    </Table.Td>
                                    <Table.Td className={styles.td}>
                                      {' '}
                                      {reservation.is_group
                                        ? `Yes - ${reservation.group_members}`
                                        : 'No'}
                                    </Table.Td>
                                    <Table.Td className={styles.td}>{reservation.subject}</Table.Td>
                                    <Table.Td className={styles.td}>
                                      {reservation.reservation_purpose}
                                    </Table.Td>
                                    <Table.Td className={styles.td}>{products}</Table.Td>
                                    <Table.Td className={styles.td}>{quantities}</Table.Td>
                                    <Table.Td className={styles.td}>{reservation.status}</Table.Td>
                                    <Table.Td className={styles.td}>
                                      {reservation.remarks
                                        ? reservation.remarks
                                        : 'No remarks yet.'}
                                    </Table.Td>
                                    <Table.Td className={styles.td}>
                                      {reservation.same_day_reservation ? (
                                        <Text c={'red'}>Yes</Text>
                                      ) : (
                                        <Text c={'green'}>No</Text>
                                      )}
                                    </Table.Td>
                                    <Table.Td className={styles.td}>
                                      <Group gap="xs">
                                        <Tooltip label="Edit Reservation">
                                          <ActionIcon
                                            onClick={() => {
                                              setSelectedReservation(reservation);
                                              setEditModalOpened(true);
                                            }}
                                          >
                                            <IconEdit />
                                          </ActionIcon>
                                        </Tooltip>
                                        <Tooltip label="Delete Reservation">
                                          <ActionIcon
                                            color="red"
                                            onClick={() => {
                                              setSelectedReservation(reservation);
                                              setDeleteModalOpened(true);
                                            }}
                                          >
                                            <IconTrash />
                                          </ActionIcon>
                                        </Tooltip>
                                      </Group>
                                    </Table.Td>
                                  </Table.Tr>
                                );
                              })}
                            </Table.Tbody>
                          </Table>
                        </TableScrollContainer>
                      </Paper>
                    </div>
                  </Grid.Col>
                </Grid>
                {/* </ScrollArea> */}
                <Flex justify="center">
                  <Pagination
                    value={activePage}
                    onChange={setPage}
                    total={Math.ceil(sortedData.length / itemsPerPage)}
                    mt="md"
                    color="blue"
                  />
                </Flex>
              </Container>
            )}

            {/* Edit Modal */}
            <Modal
              opened={editModalOpened}
              onClose={handleCloseModal}
              title="Edit Reservation"
              size="auto"
            >
              <div style={{ position: 'relative' }}>
                <LoadingOverlay
                  visible={loader}
                  zIndex={1000}
                  overlayProps={{ radius: 'sm', blur: 2 }}
                />
                <form onSubmit={handleEdit}>
                  <Stack>
                    <TextInput
                      disabled
                      label="Reservation ID"
                      value={selectedReservation?.reservation_id || ''}
                      onChange={(event) =>
                        setSelectedReservation(
                          (prev) =>
                            ({ ...prev, reservation_id: event.currentTarget.value }) as Reservation
                        )
                      }
                      required
                    />

                    <TextInput
                      disabled
                      label="User"
                      value={selectedReservation?.user || ''}
                      onChange={(event) =>
                        setSelectedReservation(
                          (prev) => ({ ...prev, user: event.currentTarget.value }) as Reservation
                        )
                      }
                      required
                    />

                    <TextInput
                      label="User Class Section"
                      value={selectedReservation?.user_class_section || ''}
                      onChange={(event) =>
                        setSelectedReservation(
                          (prev) =>
                            ({
                              ...prev,
                              user_class_section: event.currentTarget.value,
                            }) as Reservation
                        )
                      }
                      required
                    />
                    <Checkbox
                      label="Is this a group checkout?"
                      checked={selectedReservation?.is_group || false}
                      onChange={(e) =>
                        setSelectedReservation((prev) =>
                          prev ? { ...prev, is_group: e.currentTarget.checked } : null
                        )
                      }
                      mb="md"
                    />
                    {selectedReservation?.is_group && (
                      <TagsInput
                        label="Group Members"
                        placeholder="Add users"
                        value={selectedReservation?.group_members || []}
                        onChange={(value) =>
                          setSelectedReservation(
                            (prev) => ({ ...prev, group_members: value }) as Reservation
                          )
                        }
                        mb="md"
                        data={Object.entries(
                          users.reduce(
                            (acc, user) => {
                              if (!acc[user.class_section]) {
                                acc[user.class_section] = [];
                              }
                              acc[user.class_section].push({
                                value: user.username,
                                label: user.username,
                              });
                              return acc;
                            },
                            {} as Record<string, { value: string; label: string }[]>
                          )
                        ).map(([classSection, items]) => ({
                          group: classSection || 'Unknown Section',
                          items,
                        }))}
                        required
                      />
                    )}

                    <TextInput
                      label="Reservation Purpose"
                      value={selectedReservation?.reservation_purpose || ''}
                      onChange={(event) => {
                        const { value } = event.currentTarget;
                        setSelectedReservation((prev) => {
                          if (prev) {
                            return { ...prev, reservation_purpose: value };
                          }
                          return prev;
                        });
                      }}
                      required
                    />

                    <Select
                      label="Status"
                      description="Select the status of the reservation"
                      defaultSearchValue={selectedReservation?.status || ''}
                      onChange={(value) =>
                        setSelectedReservation(
                          (prev) => ({ ...prev, status: value! }) as Reservation
                        )
                      }
                      data={[
                        'APPROVED',
                        'REJECTED',
                        'CANCELLED',
                        'COMPLETED',
                        'AWAITING RETURN',
                        'DAMAGED/LOST/PARTIALLY_COMPLETED',
                        'AWAITING PAYMENT',
                      ]}
                      placeholder="Select status"
                      required
                    />

                    <DateInput
                      label="Date input"
                      placeholder="Pick a date"
                      value={
                        selectedReservation?.reserved_date
                          ? new Date(selectedReservation.reserved_date)
                          : null
                      }
                      onChange={(date) => {
                        setSelectedReservation((prev) => {
                          if (prev) {
                            return { ...prev, reserved_date: date ? date.toISOString() : '' };
                          }
                          return prev;
                        });
                      }}
                      mb="md"
                      clearable
                    />

                    <TimeInput
                      label="Start Time"
                      placeholder="Enter start time"
                      leftSection={
                        <IconClock style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
                      }
                      value={selectedReservation?.reservation_date || ''}
                      onChange={(event) =>
                        setSelectedReservation((prev) =>
                          prev ? { ...prev, reservation_date: event.currentTarget.value } : null
                        )
                      }
                      mb="md"
                    />

                    <TimeInput
                      label="End Time"
                      placeholder="Enter end time"
                      leftSection={
                        <IconClock style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
                      }
                      value={selectedReservation?.reservation_date_end || ''}
                      onChange={(event) =>
                        setSelectedReservation((prev) =>
                          prev ? { ...prev, reservation_date_end: event.currentTarget.value } : null
                        )
                      }
                      mb="md"
                    />
                    <Autocomplete
                      rightSection={
                        <ActionIcon
                          onClick={() => {
                            setSelectedReservation((prev) => {
                              if (prev) {
                                return { ...prev, subject: '' };
                              }
                              return prev;
                            });
                          }}
                          color="red"
                        >
                          <IconX />
                        </ActionIcon>
                      }
                      label="Subject"
                      placeholder="Select your subject"
                      data={cthmSubjects}
                      value={selectedReservation?.subject || ''}
                      onChange={(value) => {
                        setSelectedReservation((prev) => {
                          if (prev) {
                            return { ...prev, subject: value || '' };
                          }
                          return prev;
                        });
                      }}
                      mb="md"
                      required
                    />

                    <TextInput
                      label="Remarks"
                      value={selectedReservation?.remarks || ''}
                      onChange={(event) => {
                        const { value } = event.currentTarget;
                        setSelectedReservation((prev) => {
                          if (prev) {
                            return { ...prev, remarks: value };
                          }
                          return prev;
                        });
                      }}
                      required
                    />

                    <Checkbox.Group
                      value={value}
                      onChange={handleCheckboxChange}
                      label="Pick the items you want to reserve/update."
                      description="Choose all items that you will need."
                      required
                    >
                      <Stack pt="md" gap="xs">
                        {selectedReservation?.items.map((item, index) => {
                          const fullImageUrl = `${item.product.image}`;

                          return (
                            <div key={item.product.productId}>
                              <Checkbox.Card
                                className={classes.root}
                                radius="md"
                                value={item.product.productId}
                                p={10}
                              >
                                <Group wrap="nowrap" align="flex-start">
                                  <Checkbox.Indicator />
                                  <div>
                                    <Text className={classes.label}>
                                      Product ID: {item.product.productId}
                                    </Text>
                                    <Text className={classes.description}>
                                      Quantity: {item.quantity}
                                    </Text>
                                    <Image
                                      src={fullImageUrl}
                                      alt={`Product ${item.product.productId}`}
                                      className={classes.image}
                                      style={{ width: '100px', height: '100px' }}
                                    />
                                  </div>
                                </Group>
                              </Checkbox.Card>

                              <NumberInput
                                label={`Quantity for ${item.product.productId}`}
                                defaultValue={item.quantity}
                                disabled={disabled[index]} // Toggle based on the checkbox
                                value={quantity[index]}
                                onChange={(value) => {
                                  setQuantity((prev) => {
                                    const newQuantities = [...prev];
                                    newQuantities[index] = Number(value);
                                    return newQuantities;
                                  });
                                }}
                                description="Enter the quantity of the product you want to reserve/update."
                                min={1}
                                stepHoldDelay={500}
                                stepHoldInterval={(t) => Math.max(1000 / t ** 2, 25)}
                              />
                            </div>
                          );
                        })}
                      </Stack>
                    </Checkbox.Group>

                    <Button type="submit">Save Changes</Button>
                    {/* <Button onClick={handleEdit}>Save Changes</Button> */}
                  </Stack>
                </form>
              </div>
            </Modal>

            {/* Delete Modal */}
            <Modal
              opened={deleteModalOpened}
              onClose={() => setDeleteModalOpened(false)}
              title="Delete Reservation"
            >
              {' '}
              <LoadingOverlay
                visible={loading}
                zIndex={1000}
                overlayProps={{ radius: 'sm', blur: 2 }}
              />
              <Text>Are you sure you want to delete this reservation?</Text>
              <Group justify="center" mt="md">
                <Button color="red" onClick={handleDelete}>
                  Delete
                </Button>
                <Button onClick={() => setDeleteModalOpened(false)}>Cancel</Button>
              </Group>
            </Modal>
          </Container>
        )}
      </Flex>
    </Container>
  );
}
