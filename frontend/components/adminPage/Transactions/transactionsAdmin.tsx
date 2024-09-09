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
} from '@mantine/core';
import {
  IconSelector,
  IconChevronDown,
  IconChevronUp,
  IconSearch,
  IconEdit,
  IconTrash,
} from '@tabler/icons-react';
import classes from '@/components/modules.css/TableSort.module.css';
import { notifications } from '@mantine/notifications';
import moment from 'moment-timezone';
import { DatesProvider, DateTimePicker } from '@mantine/dates';
import styles from '@/components/modules.css/TableSort.module.css';
import { Header } from '@/components/LandingPage/header/HeaderLP';
import { useRouter } from 'next/router';
// import { ReusableTable } from '@/components/transactionsUser';
// import classes from '../components/modules.css/Demo.module.css';
import useSWR from 'swr';

interface Product {
  image: string;
  productId: string;
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
  status: string;
  product_ids: string;
  quantities: string;
  reservation_purpose: string;
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

// function filterData(data: Reservation[] | undefined, search: string): Reservation[] {
//   if (!Array.isArray(data)) {
//     console.error('Data is not an array or is undefined');
//     return [];
//   }

//   const query = search.toLowerCase().trim();
//   return data.filter(
//     (item) =>
//       (item.reservation_id?.toLowerCase() || '').includes(query) ||
//       (item.reservation_date?.toLowerCase() || '').includes(query) ||
//       (item.status?.toLowerCase() || '').includes(query)
//   );
// }

// function sortData(
//   data: Reservation[],
//   {
//     sortBy,
//     reversed,
//     search,
//   }: { sortBy: keyof Reservation | null; reversed: boolean; search: string }
// ) {
//   const filteredData = filterData(data, search);
//   return filteredData.sort((a, b) => {
//     if (!sortBy) return 0;

//     const aValue = a[sortBy];
//     const bValue = b[sortBy];

//     const aString = typeof aValue === 'string' ? aValue.toLowerCase() : '';
//     const bString = typeof bValue === 'string' ? bValue.toLowerCase() : '';

//     return reversed ? bString.localeCompare(aString) : aString.localeCompare(bString);
//   });
// }
// Fetcher function for SWR
const fetcher = (url: string) => axiosInstance.get(url).then((res) => res.data);

export default function TransactionHistory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<keyof Reservation | null>(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [activePage, setPage] = useState(1);
  const [quantity, setQuantity] = useState<number[]>([]);
  const [disabled, setDisabled] = useState<boolean[]>([]);
  const itemsPerPage = 5;
  const router = useRouter();

  // SWR for fetching reservations
  const { data, error, mutate, isValidating } = useSWR('adminReservationDetail/', fetcher, {
    refreshInterval: 5000, // Refresh data every 5 seconds
  });
  const loading = isValidating && !data;
  const reservations = data?.reservations || [];

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
      const response = await axiosInstance.delete('/reservationsDelete/', {
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

  const handleEdit = async () => {
    if (!selectedReservation) {
      console.error('No reservation selected');
      return;
    }

    const data = {
      // username: selectedReservation.reservation_id.split('_')[0],
      // reservationId: selectedReservation.reservation_id,
      // status: selectedReservation.status,
      // reservation_date: moment(selectedReservation.reservation_date)
      //   .tz('Asia/Manila')
      //   .format('YYYY-MM-DD HH:mm'),
      // reservation_date_end: moment(selectedReservation.reservation_date_end)
      //   .tz('Asia/Manila')
      //   .format('YYYY-MM-DD HH:mm'),
      // reservation_purpose: selectedReservation.reservation_purpose,
      // productIds: value.map((item) => item),
      // quantities: quantity.map((item) => item),
      username: selectedReservation.reservation_id.split('_')[0],
      reservationId: selectedReservation.reservation_id,
      status: selectedReservation.status,
      reservation_date: moment(selectedReservation.reservation_date)
        .tz('Asia/Manila')
        .format('YYYY-MM-DD HH:mm'),
      reservation_date_end: moment(selectedReservation.reservation_date_end)
        .tz('Asia/Manila')
        .format('YYYY-MM-DD HH:mm'),
      reservation_purpose: selectedReservation.reservation_purpose,
      productIds: selectedReservation.items.map((item) => item.product.productId),
      quantities: quantity,
    };

    try {
      await axiosInstance.post('adminUpdateReservationStatus/', data, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      handleCloseModal();
      mutate(); // Re-fetch data after successful update
      notifications.show({
        title: 'Success',
        message: 'Reservation updated successfully.',
        color: 'green',
      });
    } catch (error) {
      console.error('Error updating reservation:', error);
    }
  };

  const handleDateChange = (
    date: Date | null,
    field: 'reservation_date' | 'reservation_date_end'
  ) => {
    const formattedDate = date ? moment(date).tz('Asia/Manila').format('YYYY-MM-DD HH:mm') : '';
    setSelectedReservation((prev) => (prev ? { ...prev, [field]: formattedDate } : null));
  };

  const [value, setValue] = useState<string[]>([]);
  const cards =
    selectedReservation?.items.map((item) => {
      const fullImageUrl = `http://localhost:8000${item.product.image}`;

      return (
        <Checkbox.Card
          className={classes.root}
          radius="md"
          value={item.product.productId}
          key={item.product.productId}
        >
          <Group wrap="nowrap" align="flex-start">
            <Checkbox.Indicator />
            <div>
              <Text className={classes.label}>Product ID: {item.product.productId}</Text>
              <Text className={classes.description}>Quantity: {item.quantity}</Text>
              <img
                src={fullImageUrl}
                alt={`Product ${item.product.productId}`}
                className={classes.image}
                style={{ width: '100px', height: '100px' }}
              />
            </div>
          </Group>
        </Checkbox.Card>
      );
    }) || [];

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

  return (
    <Container fluid className={classes.wrapper}>
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
        <Container fluid>
          <Title c={'white'} order={2}>
            Transaction History - Admin
          </Title>

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
            <Text>Loading...</Text>
          ) : error ? (
            <Text color="red">{error}</Text>
          ) : (
            <Container fluid>
              <ScrollArea offsetScrollbars type="auto" className={styles.tableContainer}>
                <Grid>
                  <Grid.Col span="auto">
                    <div>
                      <Table className={styles.table} horizontalSpacing="xl" verticalSpacing="xs">
                        <thead>
                          <tr className={styles.tr}>
                            <Th
                              sorted={sortBy === 'reservation_id'}
                              reversed={reverseSortDirection}
                              onSort={() => handleSort('reservation_id')}
                            >
                              Reservation ID
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
                            <Th>Actions</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedData.map((reservation) => {
                            const products = reservation.items
                              .map((item: { product: any }) => item.product.productId)
                              .join(', ');
                            const quantities = reservation.items
                              .map((item: { quantity: any }) => item.quantity)
                              .join(', ');

                            return (
                              <tr
                                key={reservation.reservation_id}
                                className={styles.tr}
                                id={`reservation-${reservation.reservation_id}`}
                              >
                                <td className={styles.td}>{reservation.reservation_id}</td>
                                <td className={styles.td}>
                                  {moment(new Date(reservation.reservation_date))
                                    .tz('Asia/Manila')
                                    .format('YYYY-MM-DD HH:mm')}
                                </td>
                                <td className={styles.td}>
                                  {moment(new Date(reservation.reservation_date_end))
                                    .tz('Asia/Manila')
                                    .format('YYYY-MM-DD HH:mm')}
                                </td>
                                <td className={styles.td}>{reservation.reservation_purpose}</td>
                                <td className={styles.td}>{products}</td>
                                <td className={styles.td}>{quantities}</td>
                                <td className={styles.td}>{reservation.status}</td>
                                <td className={styles.td}>
                                  <Group gap="xs">
                                    <ActionIcon
                                      onClick={() => {
                                        setSelectedReservation(reservation);
                                        setEditModalOpened(true);
                                      }}
                                    >
                                      <IconEdit />
                                    </ActionIcon>
                                    <ActionIcon
                                      color="red"
                                      onClick={() => {
                                        setSelectedReservation(reservation);
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
                    </div>
                  </Grid.Col>
                </Grid>
              </ScrollArea>
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
          <Modal opened={editModalOpened} onClose={handleCloseModal} title="Edit Reservation">
            <LoadingOverlay
              visible={loading}
              zIndex={1000}
              overlayProps={{ radius: 'sm', blur: 2 }}
            />

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
              />

              <TextInput
                label="Reservation Purpose"
                value={selectedReservation?.reservation_purpose || ''}
                onChange={(event) =>
                  setSelectedReservation(
                    (prev) =>
                      ({ ...prev, reservation_purpose: event.currentTarget.value }) as Reservation
                  )
                }
              />

              <Select
                label="Status"
                description="Select the status of the reservation"
                defaultSearchValue={selectedReservation?.status || ''}
                onChange={(value) =>
                  setSelectedReservation((prev) => ({ ...prev, status: value! }) as Reservation)
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
              />
              <DatesProvider settings={{ locale: 'en', firstDayOfWeek: 1, weekendDays: [1, 5] }}>
                <DateTimePicker
                  clearable
                  hideOutsideDates
                  valueFormat="YYYY-MM-DD HH:mm"
                  value={
                    selectedReservation?.reservation_date
                      ? moment(selectedReservation.reservation_date).toDate()
                      : null
                  }
                  onChange={(date) => handleDateChange(date, 'reservation_date')}
                  label="Reservation Date"
                  placeholder="Pick date and time"
                  locale="en"
                />
                <DateTimePicker
                  clearable
                  hideOutsideDates
                  valueFormat="YYYY-MM-DD HH:mm"
                  value={
                    selectedReservation?.reservation_date_end
                      ? moment(selectedReservation.reservation_date_end).toDate()
                      : null
                  }
                  onChange={(date) => handleDateChange(date, 'reservation_date_end')}
                  label="Reservation Date End"
                  placeholder="Pick date and time"
                  locale="en"
                />
              </DatesProvider>

              <Checkbox.Group
                value={value}
                onChange={handleCheckboxChange}
                label="Pick the items you want to reserve/update."
                description="Choose all items that you will need."
              >
                <Stack pt="md" gap="xs">
                  {selectedReservation?.items.map((item, index) => {
                    const fullImageUrl = `http://localhost:8000${item.product.image}`;

                    return (
                      <div key={item.product.productId}>
                        <Checkbox.Card
                          className={classes.root}
                          radius="md"
                          value={item.product.productId}
                        >
                          <Group wrap="nowrap" align="flex-start">
                            <Checkbox.Indicator />
                            <div>
                              <Text className={classes.label}>
                                Product ID: {item.product.productId}
                              </Text>
                              <Text className={classes.description}>Quantity: {item.quantity}</Text>
                              <img
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

              <Button onClick={handleEdit}>Save Changes</Button>
            </Stack>
          </Modal>

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
      </Flex>
    </Container>
  );
}
