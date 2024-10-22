import { useState, useEffect, Key } from 'react';
import axiosInstance from '@/utils/axiosInstance';
import {
  Card,
  Badge,
  TextInput,
  Container,
  Title,
  Text,
  Group,
  rem,
  Stack,
  Pagination,
  Flex,
  Autocomplete,
  Image,
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import moment from 'moment-timezone';
import { Header } from '@/components/LandingPage/header/HeaderLP';
import useSWR from 'swr';
import { Footer } from '@/components/LandingPage/footer/footer';

interface Product {
  image: string;
  productId: string;
  name: string;
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

const fetcher = (url: string) => axiosInstance.get(url).then((res) => res.data);

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

const test: any[] = [];
export default function TransactionHistoryUser() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortedData, setSortedData] = useState<Reservation[]>([]);
  const [sortBy, setSortBy] = useState<keyof Reservation | null>(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);
  const [activePage, setPage] = useState(1);
  const [products2, setProducts] = useState<Product[]>([]);
  const itemsPerPage = 5;

  useEffect(() => {
    setSortedData(
      sortData(reservations, { sortBy, reversed: reverseSortDirection, search: searchQuery })
    );
  }, [reservations, sortBy, reverseSortDirection, searchQuery]);

  const { data: userReservationData, error: userDataError } = useSWR(
    'reservationsDetail/',
    fetcher,
    {
      onSuccess: (data) => {
        // Filter the data to include only the specified statuses and dates within 5 days after the reservation date end
        console.log('nakuha: ', data);
        const filteredData = data.reservations.filter((reservation: Reservation) => {
          const reservationEndDate = moment(reservation.reservation_date_end);
          const currentDate = moment();
          const isWithinFiveDays = currentDate.diff(reservationEndDate, 'days') <= 5;

          return (
            [
              'PENDING',
              'APPROVED',
              'REJECTED',
              'AWAITING RETURN',
              'DAMAGED/LOST/PARTIALLY_COMPLETED',
              'AWAITING PAYMENT',
            ].includes(reservation.status.toUpperCase()) && isWithinFiveDays
          );
        });
        setReservations(filteredData);
        console.log('nakuha:', filteredData);
      },
    }
  );

  const { data: productData, error: productDataError } = useSWR('getImages/', fetcher);

  // Using useEffect to handle the fetched data
  useEffect(() => {
    try {
      setLoading(true);
      if (productDataError) {
        setError('An error occurred while fetching data');
      }
      if (productData) {
        // Set only the images array in the state
        setProducts(productData.images); // Assuming 'images' is the array you want
        console.log('Product data:', productData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [productData, productDataError]);

  // useEffect(() => {
  //   try {
  //     setLoading(true);
  //     if (userDataError) {
  //       setError('An error occurred while fetching data');
  //     }
  //     if (userReservationData) {
  //       setReservations(userReservationData.reservations);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching data:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [userReservationData, userDataError]);

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

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'yellow';
      case 'DECLINED':
        return 'red';
      case 'AWAITING RETURN':
        return 'blue';
      case 'AWAITING PAYMENT':
        return 'orange';
      case 'APPROVED':
        return 'green';
      default:
        return 'gray';
    }
  };

  return (
    <div style={{ backgroundColor: '#592f55' }}>
      <Header />

      <Flex gap="md" justify="center" align="center" direction="row" wrap="wrap">
        <Container fluid mt={80}>
          <Title c={'white'} order={2}>
            Transaction History - Admin
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
              <Stack gap="md">
                {paginatedData.map((reservation) => {
                  const products = reservation.items
                    .map((item) => item.product.productId)
                    .join(', ');
                  const quantities = reservation.items.map((item) => item.quantity).join(', ');

                  return (
                    <Card
                      key={reservation.reservation_id}
                      shadow="sm"
                      padding="lg"
                      radius="md"
                      withBorder
                    >
                      <Group justify="apart" mb="xs">
                        <Text w={500}>Reservation ID: {reservation.reservation_id}</Text>
                        <Badge color={getStatusColor(reservation.status)}>
                          {reservation.status}
                        </Badge>
                      </Group>

                      <Group justify="column" gap="xs">
                        <Text size="sm" color="dimmed">
                          <strong>Reserved Date:</strong>{' '}
                          {moment(new Date(reservation.reserved_date))
                            .tz('Asia/Manila')
                            .format('YYYY-MM-DD HH:mm')}
                        </Text>
                        <Text size="sm" color="dimmed">
                          <strong>Reservation Date Start:</strong>{' '}
                          {moment(new Date(reservation.reservation_date))
                            .tz('Asia/Manila')
                            .format('YYYY-MM-DD HH:mm')}
                        </Text>
                        <Text size="sm" color="dimmed">
                          <strong>Reservation Date End:</strong>{' '}
                          {moment(new Date(reservation.reservation_date_end))
                            .tz('Asia/Manila')
                            .format('YYYY-MM-DD HH:mm')}
                        </Text>
                        <Text size="sm" color="dimmed">
                          <strong>By group?</strong>{' '}
                          {reservation.is_group
                            ? `Yes - ${reservation.group_members.join(', ')}`
                            : 'No'}
                        </Text>
                        <Text size="sm" color="dimmed">
                          <strong>Purpose:</strong> {reservation.reservation_purpose}
                        </Text>
                        <Text size="sm" color="dimmed">
                          <strong>Subject:</strong> {reservation.subject}
                        </Text>
                        <Text size="sm" color="dimmed">
                          <strong>Products Reserved:</strong> {products}
                        </Text>
                        <Text size="sm" color="dimmed">
                          <strong>Quantities Reserved:</strong> {quantities}
                        </Text>

                        <Group>
                          {reservation.items.map((item) => {
                            const matchingProduct = products2.find(
                              (product) => product.productId === item.product.productId
                            );

                            return (
                              <Image
                                key={item.product.productId} // Use unique product ID as key
                                width={150}
                                height={150}
                                src={`http://localhost:8000${matchingProduct?.image}`} // Show the specific image
                                alt={matchingProduct?.name || 'Product Image'}
                              />
                            );
                          })}
                        </Group>
                      </Group>
                    </Card>
                  );
                })}
              </Stack>

              <Pagination
                value={activePage}
                onChange={setPage}
                total={Math.ceil(sortedData.length / itemsPerPage)}
                mt="md"
              />
            </>
          )}
        </Container>
      </Flex>

      <Footer />
    </div>
  );
}
