import { useState, useEffect } from 'react';
import axiosInstance from '@/utils/axiosInstance';
import {
  Accordion,
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
  Select,
  Pagination,
  Checkbox,
  NumberInput,
  Flex,
  Overlay,
  Autocomplete,
  Image,
  Stepper,
  Paper,
  Tabs,
  Badge,
  Avatar,
  Anchor,
  Divider,
  Tooltip,
  AppShell,
} from '@mantine/core';
import {
  IconSelector,
  IconChevronDown,
  IconChevronUp,
  IconSearch,
  IconEdit,
  IconTrash,
  IconClock,
  IconCheck,
  IconX,
  IconTruck,
  IconBox,
  IconCash,
  IconCircleX,
  IconBasketPause,
} from '@tabler/icons-react';
import classes from '../components/modules.css/transactionsUser.module.css';
import { notifications } from '@mantine/notifications';
import moment from 'moment-timezone';
import { DatesProvider, DateTimePicker } from '@mantine/dates';
import styles from '../components/modules.css/TableSort.module.css';
import Header from '@/components/LandingPage/header/HeaderLP';
import useSWR from 'swr';
import { Footer } from '@/components/LandingPage/footer/footer';
import { useRouter } from 'next/router';
import App from './_app';

interface Product {
  image: string;
  productId: string;
  price: number;
  name: string;
}

interface ReservationItem {
  reservation: string;
  product: Product;
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
  // #region useStates
  const [buttonLoading, setButtonLoading] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<string>('TRANSACTIONS');
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
  const [activeTab, setActiveTab] = useState<string>('PENDING');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  //#endregion

  const handleCancelClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setCancelModalOpen(true);
  };

  const confirmCancel = async () => {
    setButtonLoading(true);
    if (!selectedReservation) return;

    try {
      await axiosInstance.post('reservationsCreateUpdate/', {
        reservationId: selectedReservation.reservation_id,
        status: 'CANCELLED',
      });

      notifications.show({
        title: 'Success',
        message: 'Reservation cancelled successfully',
        color: 'green',
      });

      setReservations((prev) =>
        prev.filter(
          (reservation) => reservation.reservation_id !== selectedReservation.reservation_id
        )
      );
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to cancel reservation',
        color: 'red',
      });
    } finally {
      setCancelModalOpen(false);
      setSelectedReservation(null);
      setButtonLoading(false);
    }
  };

  useEffect(() => {
    setSortedData(
      sortData(reservations, { sortBy, reversed: reverseSortDirection, search: searchQuery })
    );
  }, [reservations, sortBy, reverseSortDirection, searchQuery]);

  const { data: userReservationData, error: userDataError } = useSWR(
    'reservationsDetail/',
    fetcher,
    { refreshInterval: 1000 }
  );

  useEffect(() => {
    try {
      setLoading(true);
      if (userDataError) {
        setError('An error occurred while fetching data');
      }
      if (userReservationData) {
        setReservations(userReservationData.reservations);
        if (router.query.searchQuery) {
          const query = router.query.searchQuery as string;
          setSearchQuery(query);
          const status = getStatusFromQuery(query);
          setActiveTab(status);
        }
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [userReservationData, userDataError, router.query.searchQuery]);

  const getStatusFromQuery = (query: string): string => {
    // Logic to get status from query
    console.log('Query:', query);
    console.log('User Reservation Data:', userReservationData);
    if (!userReservationData) return 'PENDING';
    const reservation = userReservationData.reservations.find(
      (res: Reservation) => res.reservation_id === query
    );
    return reservation ? reservation.status : 'APPROVED';
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleSort = (field: keyof Reservation) => {
    const reversed = field === sortBy ? !reverseSortDirection : false;
    setReverseSortDirection(reversed);
    setSortBy(field);
  };
  const paginatedData = sortedData
    .filter((reservation) => {
      if (activeTab === 'OTHER') {
        return !['PENDING', 'APPROVED', 'AWAITING RETURN', 'COMPLETED'].includes(
          reservation.status
        );
      }
      return reservation.status === activeTab;
    })
    .slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage);
  // const paginatedData = sortedData
  //   .filter((reservation) => reservation.status === activeTab)
  //   .slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage);

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 1;
      case 'APPROVED':
        return 2;
      case 'AWAITING RETURN':
        return 3;
      case 'COMPLETED':
        return 4;
      case 'DAMAGED/LOST/PARTIALLY_COMPLETED':
        return 1;
      case 'AWAITING PAYMENT':
        return 2;
      case 'RESOLVED':
        return 3;
      case 'CANCELLED':
        return 5;
      default:
        return 0;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'yellow';
      case 'APPROVED':
        return 'blue';
      case 'AWAITING RETURN':
        return 'orange';
      case 'COMPLETED':
        return 'green';
      case 'DAMAGED/LOST/PARTIALLY_COMPLETED':
        return 'red';
      case 'AWAITING PAYMENT':
        return 'orange';
      case 'RESOLVED':
        return 'green';
      case 'CANCELLED':
        return 'red';
      default:
        return 'gray';
    }
  };

  const StepContent = ({
    label,
    description,
    icon,
  }: {
    label: string;
    description: string;
    icon: JSX.Element;
  }) => <Stepper.Step label={label} description={description} icon={icon} />;

  const pendingCount = reservations.filter(
    (reservation) => reservation.status === 'PENDING'
  ).length;
  const approvedCount = reservations.filter(
    (reservation) => reservation.status === 'APPROVED'
  ).length;
  const awaitingReturnCount = reservations.filter(
    (reservation) => reservation.status === 'AWAITING RETURN'
  ).length;
  const completedCount = reservations.filter(
    (reservation) => reservation.status === 'COMPLETED'
  ).length;
  const damagedLostCount = reservations.filter(
    (reservation) => reservation.status === 'DAMAGED/LOST/PARTIALLY_COMPLETED'
  ).length;
  const awaitingPaymentCount = reservations.filter(
    (reservation) => reservation.status === 'AWAITING PAYMENT'
  ).length;
  const resolvedCount = reservations.filter(
    (reservation) => reservation.status === 'RESOLVED'
  ).length;
  const cancelledCount = reservations.filter(
    (reservation) => reservation.status === 'CANCELLED'
  ).length;

  return (
    <>
      <AppShell
        header={{ height: 60 }}
        navbar={{ width: 300, breakpoint: 'sm', collapsed: { desktop: true } }}
        padding="md"
        style={{ backgroundColor: '#2F4059' }}
      >
        <AppShell.Header bg={'#592f55'}>
          <Header />
        </AppShell.Header>
        <AppShell.Main>
          <Flex gap="md" justify="center" align="center" direction="row" wrap="wrap">
            <Container fluid mt={80}>
              <Title c={'white'} order={2}>
                Transaction History - User
              </Title>
              <Autocomplete
                placeholder="Search reservations using reservation ids"
                value={searchQuery}
                onChange={handleSearch}
                leftSection={
                  <IconSearch style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
                }
                mb="md"
                data={[
                  {
                    group: 'ReservationIDs',
                    items: reservations
                      .filter((reservation) => reservation.status === activeTab)
                      .map((reservation: { reservation_id: any }) => reservation.reservation_id),
                  },
                ]}
                limit={5}
                comboboxProps={{
                  transitionProps: { transition: 'pop', duration: 200 },
                  dropdownPadding: 10,
                  shadow: 'xl',
                }}
                rightSection={
                  <ActionIcon
                    onClick={() => {
                      setSearchQuery('');
                      router.query.searchQuery = '';
                      setSearchQuery('');
                    }}
                    color="gray"
                  >
                    <IconTrash size={20} />
                  </ActionIcon>
                }
              />

              {loading ? (
                <Title order={1}>You have no reservations yet!</Title>
              ) : error ? (
                <Text color="red">{error}</Text>
              ) : (
                <Container fluid mb={20}>
                  <Tabs
                    value={activeMainTab}
                    onChange={(value) => {
                      setActiveMainTab(value || 'TRANSACTIONS');
                      // Reset to default tabs when switching between main tabs
                      if (value === 'TRANSACTIONS') {
                        setActiveTab('PENDING');
                      } else if (value === 'RETURNS') {
                        setActiveTab('CANCELLED');
                      }
                      setSearchQuery('');
                    }}
                    color="blue"
                  >
                    <Tabs.List className={classes.tabLabel} grow>
                      <Tabs.Tab
                        className={classes.tab}
                        value="TRANSACTIONS"
                        leftSection={<IconClock size={14} />}
                      >
                        Transactions
                      </Tabs.Tab>

                      <Tabs.Tab
                        className={classes.tab}
                        value="RETURNS"
                        leftSection={<IconTruck size={14} />}
                      >
                        Returns
                      </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value={activeMainTab} mt={20}>
                      <Tabs
                        value={activeTab}
                        onChange={(value) => {
                          setActiveTab(value || 'PENDING');
                          setSearchQuery('');
                        }}
                        color="blue"
                      >
                        <Tabs.List className={classes.tabLabel} grow>
                          {activeMainTab === 'TRANSACTIONS' ? (
                            <>
                              <Tabs.Tab
                                className={classes.tab}
                                value="PENDING"
                                leftSection={<IconBasketPause size={14} />}
                              >
                                Pending ({pendingCount})
                              </Tabs.Tab>

                              <Tabs.Tab
                                className={classes.tab}
                                value="APPROVED"
                                leftSection={<IconCheck size={14} />}
                              >
                                Approved ({approvedCount})
                              </Tabs.Tab>

                              <Tabs.Tab
                                className={classes.tab}
                                value="AWAITING RETURN"
                                leftSection={<IconTruck size={14} />}
                              >
                                Awaiting Return ({awaitingReturnCount})
                              </Tabs.Tab>

                              <Tabs.Tab
                                className={classes.tab}
                                value="COMPLETED"
                                leftSection={<IconBox size={14} />}
                              >
                                Completed ({completedCount})
                              </Tabs.Tab>
                            </>
                          ) : (
                            <>
                              <Tabs.Tab
                                className={classes.tab}
                                value="CANCELLED"
                                leftSection={<IconX size={14} />}
                              >
                                Cancelled ({cancelledCount})
                              </Tabs.Tab>

                              <Tabs.Tab
                                className={classes.tab}
                                value="DAMAGED/LOST/PARTIALLY_COMPLETED"
                                leftSection={<IconX size={14} />}
                              >
                                Damaged/Lost ({damagedLostCount})
                              </Tabs.Tab>

                              <Tabs.Tab
                                className={classes.tab}
                                value="AWAITING PAYMENT"
                                leftSection={<IconCash size={14} />}
                              >
                                Awaiting Payment ({awaitingPaymentCount})
                              </Tabs.Tab>

                              <Tabs.Tab
                                className={classes.tab}
                                value="RESOLVED"
                                leftSection={<IconCheck size={14} />}
                              >
                                Resolved ({resolvedCount})
                              </Tabs.Tab>
                            </>
                          )}
                        </Tabs.List>

                        <Tabs.Panel value={activeTab}>
                          <Stack mt={10}>
                            {paginatedData.length === 0 ? (
                              <Paper shadow="xl" radius="md" withBorder p="xl">
                                <Center>
                                  <Stack align="center" gap="md">
                                    <Title order={2}>
                                      No {activeTab.toLowerCase()} reservations!
                                    </Title>
                                    <Anchor href="/reservationLandingPage">
                                      <Button
                                        component="a"
                                        variant="filled"
                                        color="blue"
                                        leftSection={<IconBox size={14} />}
                                      >
                                        Order Now
                                      </Button>
                                    </Anchor>
                                  </Stack>
                                </Center>
                              </Paper>
                            ) : (
                              <>
                                {paginatedData.map((reservation) => {
                                  const products = reservation.items
                                    .map((item: { product: any }) => item.product.productId)
                                    .join(', ');
                                  const quantities = reservation.items
                                    .map((item: { quantity: any }) => item.quantity)
                                    .join(', ');

                                  const totalPrice = reservation.items.reduce(
                                    (total, item) => total + item.product.price * item.quantity,
                                    0
                                  );

                                  return (
                                    <Paper
                                      key={reservation.reservation_id}
                                      shadow="xl"
                                      radius="md"
                                      withBorder
                                      p="xl"
                                    >
                                      <Accordion classNames={classes} p={10} order={5}>
                                        <Accordion.Item value={reservation.reservation_id}>
                                          <Accordion.Control style={{ height: 'auto' }}>
                                            <Group>
                                              <Group>
                                                <Text w={500}>Product Image:</Text>
                                                {reservation.items.map((item) => (
                                                  <Avatar
                                                    key={item.product.productId}
                                                    src={`${item.product.image}`}
                                                    alt={item.product.productId}
                                                    size={80}
                                                    radius="md"
                                                  />
                                                ))}
                                              </Group>
                                              <Group>
                                                <Text w={500}>Reservation ID:</Text>
                                                <Text>{reservation.reservation_id}</Text>
                                              </Group>
                                            </Group>
                                          </Accordion.Control>
                                          <Accordion.Panel>
                                            <Divider label={'Reservation Details:'} m={10} p={20} />

                                            {[
                                              'DAMAGED/LOST/PARTIALLY_COMPLETED',
                                              'AWAITING PAYMENT',
                                              'RESOLVED',
                                            ].includes(reservation.status) ? (
                                              <Stepper active={getStatusStep(reservation.status)}>
                                                <Stepper.Step
                                                  label="Damaged/Lost"
                                                  description="Item is damaged or lost"
                                                  icon={<IconX />}
                                                  completedIcon={
                                                    getStatusStep(reservation.status) === 5 ? (
                                                      <IconCircleX
                                                        style={{ width: rem(20), height: rem(20) }}
                                                      />
                                                    ) : null
                                                  }
                                                  color={getStatusColor(reservation.status)}
                                                />
                                                <Stepper.Step
                                                  label="Awaiting Payment"
                                                  description="Awaiting payment for damages"
                                                  icon={<IconCash />}
                                                  completedIcon={
                                                    getStatusStep(reservation.status) === 5 ? (
                                                      <IconCircleX
                                                        style={{ width: rem(20), height: rem(20) }}
                                                      />
                                                    ) : null
                                                  }
                                                  color={getStatusColor(reservation.status)}
                                                />
                                                <Stepper.Step
                                                  label="Resolved/Paid"
                                                  description="Issue resolved or payment made"
                                                  icon={<IconCheck />}
                                                  completedIcon={
                                                    getStatusStep(reservation.status) === 5 ? (
                                                      <IconCircleX
                                                        style={{ width: rem(20), height: rem(20) }}
                                                      />
                                                    ) : null
                                                  }
                                                  color={getStatusColor(reservation.status)}
                                                />
                                              </Stepper>
                                            ) : (
                                              <Stepper active={getStatusStep(reservation.status)}>
                                                <Stepper.Step
                                                  label="Pending"
                                                  description="Reservation is pending"
                                                  icon={<IconClock />}
                                                  completedIcon={
                                                    getStatusStep(reservation.status) === 5 ? (
                                                      <IconCircleX
                                                        style={{ width: rem(20), height: rem(20) }}
                                                      />
                                                    ) : null
                                                  }
                                                  color={getStatusColor(reservation.status)}
                                                />
                                                <Stepper.Step
                                                  label="Approved"
                                                  description="Reservation is approved"
                                                  icon={<IconCheck />}
                                                  completedIcon={
                                                    getStatusStep(reservation.status) === 5 ? (
                                                      <IconCircleX
                                                        style={{ width: rem(20), height: rem(20) }}
                                                      />
                                                    ) : null
                                                  }
                                                  color={getStatusColor(reservation.status)}
                                                />
                                                <Stepper.Step
                                                  label="Awaiting Return"
                                                  description="Picked up and awaiting return"
                                                  icon={<IconTruck />}
                                                  completedIcon={
                                                    getStatusStep(reservation.status) === 5 ? (
                                                      <IconCircleX
                                                        style={{ width: rem(20), height: rem(20) }}
                                                      />
                                                    ) : null
                                                  }
                                                  color={getStatusColor(reservation.status)}
                                                />
                                                <Stepper.Step
                                                  label="Completed"
                                                  description="Reservation is completed"
                                                  icon={<IconBox />}
                                                  completedIcon={
                                                    getStatusStep(reservation.status) === 5 ? (
                                                      <IconCircleX
                                                        style={{ width: rem(20), height: rem(20) }}
                                                      />
                                                    ) : null
                                                  }
                                                  color={getStatusColor(reservation.status)}
                                                />
                                                {reservation.status === 'CANCELLED' && (
                                                  <Stepper.Step
                                                    label="Cancelled"
                                                    description="Reservation is cancelled"
                                                    icon={<IconX />}
                                                    completedIcon={
                                                      getStatusStep(reservation.status) === 5 ? (
                                                        <IconCircleX
                                                          style={{
                                                            width: rem(20),
                                                            height: rem(20),
                                                          }}
                                                        />
                                                      ) : null
                                                    }
                                                    color={getStatusColor(reservation.status)}
                                                  />
                                                )}
                                                <Stepper.Completed>
                                                  <Center>
                                                    <Title order={1} mt={25}>
                                                      {reservation.status === 'CANCELLED'
                                                        ? 'Order Cancelled'
                                                        : 'Order Delivered'}
                                                    </Title>
                                                  </Center>
                                                </Stepper.Completed>
                                              </Stepper>
                                            )}

                                            <Stack mt={50}>
                                              <Group grow>
                                                <Text w={500}>Reservation ID:</Text>
                                                <Text>{reservation.reservation_id}</Text>
                                              </Group>
                                              <Group grow>
                                                <Text w={500}>Reserved Date:</Text>
                                                <Text>
                                                  {moment(new Date(reservation.reserved_date))
                                                    .tz('Asia/Manila')
                                                    .format('YYYY-MM-DD HH:mm')}
                                                </Text>
                                              </Group>
                                              <Group grow>
                                                <Text w={500}>Reservation Date Start:</Text>
                                                <Text>
                                                  {moment(reservation.reservation_date, 'HH:mm:ss')
                                                    .tz('Asia/Manila')
                                                    .format('hh:mm A')}
                                                </Text>
                                              </Group>
                                              <Group grow>
                                                <Text w={500}>Reservation Date End:</Text>
                                                <Text>
                                                  {moment(
                                                    reservation.reservation_date_end,
                                                    'HH:mm:ss'
                                                  )
                                                    .tz('Asia/Manila')
                                                    .format('hh:mm A')}
                                                </Text>
                                              </Group>
                                              <Group grow>
                                                <Text w={500}>By Group:</Text>
                                                <Text>
                                                  {reservation.is_group
                                                    ? `Yes - ${reservation.group_members}`
                                                    : 'No'}
                                                </Text>
                                              </Group>
                                              <Group grow>
                                                <Text w={500}>Subject:</Text>
                                                <Text>{reservation.subject}</Text>
                                              </Group>
                                              <Group grow>
                                                <Text w={500}>Purpose:</Text>
                                                <Text>{reservation.reservation_purpose}</Text>
                                              </Group>
                                              <Group grow>
                                                <Text w={500}>Products:</Text>
                                                <Text>{products}</Text>
                                              </Group>
                                              <Group grow>
                                                <Text w={500}>Quantities:</Text>
                                                <Text>{quantities}</Text>
                                              </Group>
                                              <Group grow>
                                                <Text w={500}>Status:</Text>
                                                <Badge color={getStatusColor(reservation.status)}>
                                                  {reservation.status}
                                                </Badge>
                                              </Group>
                                              <Group grow>
                                                <Text w={500}>Remarks:</Text>
                                                <Text>
                                                  {reservation.remarks
                                                    ? reservation.remarks
                                                    : 'No remarks.'}
                                                </Text>
                                              </Group>
                                              <Divider label={'Products:'} m={10} p={20} />
                                              <Center>
                                                <Stack>
                                                  {reservation.items.map((item) => (
                                                    <Group
                                                      key={item.product.productId}
                                                      align="center"
                                                    >
                                                      <Image
                                                        src={`${item.product.image}`}
                                                        alt={item.product.productId}
                                                        width={180}
                                                        height={180}
                                                        radius="md"
                                                      />
                                                      <Stack gap={0}>
                                                        <Text>{item.product.name}</Text>
                                                        <Text>Stock: {item.quantity}</Text>
                                                      </Stack>
                                                    </Group>
                                                  ))}
                                                </Stack>
                                              </Center>
                                              <Divider
                                                label={'Potential Damage Charges'}
                                                m={10}
                                                p={20}
                                              />
                                              <Stack gap="xs" align="center" justify="center">
                                                <Group>
                                                  <Title order={1}>Total Damage Cost:</Title>
                                                  <Title order={1}>₱{totalPrice}</Title>
                                                </Group>
                                                <Text ta={'center'} size="sm" color="red" w={500}>
                                                  Important: This is NOT an upfront payment
                                                </Text>
                                                <Text size="xs" color="dimmed">
                                                  This amount will ONLY be charged if items are
                                                  returned damaged or broken.{' '}
                                                  <Anchor href="/tos" w={500}>
                                                    See Terms of Service
                                                  </Anchor>{' '}
                                                  for damage assessment details.
                                                </Text>
                                              </Stack>
                                              {activeTab === 'PENDING' && (
                                                <Center>
                                                  <Tooltip
                                                    label="This action is not reversible"
                                                    withArrow
                                                  >
                                                    <Button
                                                      color="red"
                                                      onClick={() => handleCancelClick(reservation)}
                                                    >
                                                      Cancel Reservation
                                                    </Button>
                                                  </Tooltip>
                                                </Center>
                                              )}
                                            </Stack>
                                          </Accordion.Panel>
                                        </Accordion.Item>
                                      </Accordion>
                                    </Paper>
                                  );
                                })}
                              </>
                            )}
                          </Stack>
                        </Tabs.Panel>
                      </Tabs>
                    </Tabs.Panel>
                  </Tabs>
                  <Flex justify="center">
                    <Pagination
                      value={activePage}
                      onChange={setPage}
                      total={Math.ceil(paginatedData.length / itemsPerPage)}
                      mt="md"
                      color="blue"
                    />
                  </Flex>
                </Container>
              )}
            </Container>
          </Flex>
        </AppShell.Main>
      </AppShell>

      <Footer />

      {/* cancel modal */}
      <Modal
        opened={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Reservation"
      >
        <Text size="sm" mb="md">
          This will cancel the reservation and it is not reversible. Are you sure you want to
          proceed?
        </Text>
        <Group>
          <Button loading={buttonLoading} variant="light" color="red" onClick={confirmCancel}>
            Confirm
          </Button>
          <Button variant="light" color="gray" onClick={() => setCancelModalOpen(false)}>
            Cancel
          </Button>
        </Group>
      </Modal>
    </>
  );
}
