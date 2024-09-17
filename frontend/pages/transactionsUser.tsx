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
} from '@mantine/core';
import {
  IconSelector,
  IconChevronDown,
  IconChevronUp,
  IconSearch,
  IconEdit,
  IconTrash,
} from '@tabler/icons-react';
import classes from '../components/modules.css/TableSort.module.css';
import { notifications } from '@mantine/notifications';
import moment from 'moment-timezone';
import { DatesProvider, DateTimePicker } from '@mantine/dates';
import styles from '../components/modules.css/TableSort.module.css';
import { Header } from '@/components/LandingPage/header/HeaderLP';
import useSWR from 'swr';
import { Footer } from '@/components/LandingPage/footer/footer';
import { useRouter } from 'next/router';
// import { ReusableTable } from '@/components/transactionsUser';
// import classes from '../components/modules.css/Demo.module.css';

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
  reserved_date: string;
  is_group: boolean;
  group_members: string[];
  subject: string;
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

function filterData(data: Reservation[] | undefined, search: string): Reservation[] {
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
}

function sortData(
  data: Reservation[],
  {
    sortBy,
    reversed,
    search,
  }: { sortBy: keyof Reservation | null; reversed: boolean; search: string }
) {
  const filteredData = filterData(data, search);
  return filteredData.sort((a, b) => {
    if (!sortBy) return 0;

    const aValue = a[sortBy];
    const bValue = b[sortBy];

    const aString = typeof aValue === 'string' ? aValue.toLowerCase() : '';
    const bString = typeof bValue === 'string' ? bValue.toLowerCase() : '';

    return reversed ? bString.localeCompare(aString) : aString.localeCompare(bString);
  });
}
const fetcher = (url: string) => axiosInstance.get(url).then((res) => res.data);
export default function TransactionHistoryUser() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortedData, setSortedData] = useState<Reservation[]>([]);
  const [sortBy, setSortBy] = useState<keyof Reservation | null>(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);
  const [activePage, setPage] = useState(1);
  const itemsPerPage = 5;
  const router = useRouter();

  useEffect(() => {
    setSortedData(
      sortData(reservations, { sortBy, reversed: reverseSortDirection, search: searchQuery })
    );
  }, [reservations, sortBy, reverseSortDirection, searchQuery]);

  const { data: userReservationData, error: userDataError } = useSWR(
    'reservationsDetail/',
    fetcher
  );

  useEffect(() => {
    try {
      setLoading(true);
      if (userDataError) {
        setError('An error occured while fetching data');
      }
      if (userReservationData) {
        setReservations(userReservationData.reservations);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [userReservationData, userDataError]);

  // useEffect(() => {
  //   fetchReservations();
  // }, []);

  // const fetchReservations = async () => {
  //   const response = await axiosInstance.get('reservationsDetail/');

  //   setReservations(response.data.reservations);
  //   setError('');
  // };

  useEffect(() => {
    if (router.query.searchQuery) {
      setSearchQuery(router.query.searchQuery as string);
    }
  }, [router.query.searchQuery]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleSort = (field: keyof Reservation) => {
    const reversed = field === sortBy ? !reverseSortDirection : false;
    setReverseSortDirection(reversed);
    setSortBy(field);
  };

  const paginatedData = sortedData.slice(
    (activePage - 1) * itemsPerPage,
    activePage * itemsPerPage
  );

  return (
    <div style={{ backgroundColor: '#592f55' }}>
      <Header />

      <Flex gap="md" justify="center" align="center" direction="row" wrap="wrap">
        <Container fluid mt={80}>
          <Title c={'white'} order={2}>
            Transaction History - User
          </Title>
          <Autocomplete
            placeholder="Search reservations using reservation ids"
            value={searchQuery}
            onChange={handleSearch}
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
            <>
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
                          {moment(new Date(reservation.reserved_date))
                            .tz('Asia/Manila')
                            .format('YYYY-MM-DD HH:mm')}
                        </td>
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
                        <td className={styles.td}>
                          {' '}
                          {reservation.is_group ? `Yes - ${reservation.group_members}` : 'No'}
                        </td>
                        <td className={styles.td}>{reservation.subject}</td>
                        <td className={styles.td}>{reservation.reservation_purpose}</td>
                        <td className={styles.td}>{products}</td>
                        <td className={styles.td}>{quantities}</td>
                        <td className={styles.td}>{reservation.status}</td>
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
        </Container>
      </Flex>
      <Footer />
    </div>
  );
}
