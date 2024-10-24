import React, { useState, useRef, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import {
  ActionIcon,
  Text,
  Loader,
  Paper,
  Group,
  Divider,
  Drawer,
  Button,
  Checkbox,
  Modal,
  TextInput,
  TagsInput,
  Autocomplete,
  Anchor,
  Stack,
  Box,
  Select,
  NumberInput,
  Grid,
  Image,
  Title,
  Table,
  Flex,
} from '@mantine/core';
import { IconShoppingCart, IconClock } from '@tabler/icons-react';
import axios from '@/utils/axiosInstance'; // Adjust this import to your Axios setup
import { useAuth } from '@/utils/auth';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/router';
import dayjs from 'dayjs';
import { DateInput } from '@mantine/dates';

interface Product {
  productId: string;
  name: string;
  description: string;
  price: string;
  quantity: number;
  image: string;
  reserved: number;
  broken_damaged: number;
  category: string;
}

interface CartItem {
  user: string;
  quantity: number;
  product: Product;
}

interface ApiResponse {
  cart_items: CartItem[];
  message: string;
}

interface ClassSchedule {
  class_section: string;
  class_name: string;
  class_days: {
    [day: string]: {
      start: string;
      end: string;
      subject: string;
    }[];
  };
  class_instructor: string;
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
}

// Fetcher function using Axios
const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export function CartIcon() {
  // #region useStates
  const [opened, setOpened] = useState(false);
  const { username, class_section } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState('');
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CartItem | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [reservationPurpose, setReservationPurpose] = useState('');
  const [reservationStatus, setReservationStatus] = useState('PENDING');
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [isGroupCheckout, setIsGroupCheckout] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedClassTime, setSelectedClassTime] = useState('');
  const [subject, setSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [disabledCheckoutButton, setDisabledCheckoutButton] = useState(true);
  const [users, setUsers] = useState<Users[]>([]);
  const [cthmSubjects, setCthmSubjects] = useState<string[]>([]);

  const { data: usersData, error: usersError } = useSWR<Users[]>(
    `adminupdateUsers/?class_section=${class_section}`,
    fetcher,
    {
      // refreshInterval: 1000,
      onSuccess: (data) => {
        setUsers(data);
      },
    }
  );

  //#endregion

  const { data, error } = useSWR<ApiResponse>(`reservationsCart/?username=${username}`, fetcher, {
    refreshInterval: 1000,
  });

  // Filter items with 0 stock
  const outOfStockItems = data?.cart_items.filter((item) => item.product.quantity === 0);

  // const { data: classSchedules } = useSWR<ClassSchedule[]>(
  //   `classScheduleCRUD/?class_section=${class_section}`,
  //   fetcher,
  //   {
  //     onSuccess: (data) => {
  //       setCthmSubjects(data.map((user) => user.class_name));
  //     },
  //   }
  // );

  const { data: classSchedules } = useSWR<ClassSchedule[]>(
    `classScheduleCRUD/?class_section=${class_section}`,
    fetcher,
    {
      onSuccess: (data) => {
        const subjects = data.flatMap((schedule) =>
          Object.values(schedule.class_days)
            .flat()
            .map((day) => day.subject)
        );
        setCthmSubjects(subjects); // Store subjects
      },
    }
  );

  useEffect(() => {
    const isFormValid =
      reservationPurpose.trim() !== '' &&
      selectedDate !== null &&
      selectedClassTime.trim() !== '' &&
      selectedSubject.trim() !== '' &&
      (!isGroupCheckout || selectedUsers.length > 0);

    const isTimeValid = () => {
      if (!selectedDate || !classSchedules) return false;

      const selectedDay = selectedDate ? dayjs(selectedDate).format('dddd').toUpperCase() : '';
      const today = dayjs();

      const classTimes = classSchedules.flatMap(
        (schedule) => schedule.class_days[selectedDay]?.map((time) => time.end) || []
      );

      return classTimes.every((endTime) =>
        today.isBefore(
          dayjs(selectedDate)
            .set('hour', parseInt(endTime.split(':')[0]))
            .set('minute', parseInt(endTime.split(':')[1]))
        )
      );
    };

    setDisabledCheckoutButton(!isFormValid || !isTimeValid());
  }, [
    reservationPurpose,
    selectedDate,
    selectedClassTime,
    selectedSubject,
    isGroupCheckout,
    selectedUsers,
    classSchedules,
  ]);

  const totalPrice = selectedItems.reduce((total, productId) => {
    const item = data?.cart_items.find((item) => item.product.productId === productId);
    return total + (item ? item.quantity * parseFloat(item.product.price) : 0);
  }, 0);

  const handleCheckboxChange = (productId: string) => {
    setSelectedItems((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleDelete = async (productId: string) => {
    try {
      await axios.delete('reservationsCart/', {
        data: { username, productIds: [productId] },
      });

      mutate(`reservationsCart/?username=${username}`);
      notifications.show({ message: 'Item deleted from cart', color: 'green' });
      setSelectedItems((prev) => prev.filter((id) => id !== productId));
    } catch (error) {
      notifications.show({ message: 'Failed to delete item', color: 'red' });
      console.error(error);
    }
  };

  if (error) return <Text color="red">Error loading cart items</Text>;
  if (!data) return <Loader size="sm" />;

  const handleCheckout = () => {
    setCheckoutModalOpen(true);
  };

  const confirmCheckout = async () => {
    try {
      //#region Checkout
      let productIds = selectedItems;
      let quantities = selectedItems.map(
        (productId) =>
          data.cart_items.find((item) => item.product.productId === productId)?.quantity || 0
      );

      const [day] = selectedClassTime.split(' ');
      const startTime = selectedClassTime.split(' ')[1];
      const endTime = selectedClassTime.split(' ')[3];

      const reservation_date = dayjs(selectedDate)
        .set('hour', parseInt(startTime.split(':')[0]))
        .set('minute', parseInt(startTime.split(':')[1]))
        .set('second', parseInt(startTime.split(':')[2]))
        .format();

      const reservation_date_end = dayjs(selectedDate)
        .set('hour', parseInt(endTime.split(':')[0]))
        .set('minute', parseInt(endTime.split(':')[1]))
        .set('second', 0)
        .format();

      //#endregion

      const response = await axios.post('reservationsCreateUpdate/', {
        username,
        productIds,
        quantities,
        reservation_purpose: reservationPurpose,
        is_group: isGroupCheckout,
        group_members: isGroupCheckout ? selectedUsers : [],
        subject: selectedSubject,
        reservation_day: day,
        reservation_date: reservation_date,
        reservation_date_end: reservation_date_end,
      });

      notifications.show({
        title: 'Success',
        message: `Checkout successful and your reservation ID is ${response.data.reservation_id}`,
        color: 'green',
      });

      setSelectedItems([]);
      setReservationPurpose('');
      setReservationStatus('PENDING');
      setIsGroupCheckout(false);
      setSelectedUsers([]);
      setSelectedClassTime('');
      setSubject('');
      mutate(`reservationsCart/?username=${username}`);
    } catch (error) {
      console.error(error);
      notifications.show({ title: 'Error', message: 'Checkout failed', color: 'red' });
    } finally {
      setCheckoutModalOpen(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    setUpdateLoading(true);
    try {
      const response = await axios.put('reservationsCart/', {
        username,
        productIds: [selectedItem.product.productId],
        quantities: [selectedItem.quantity],
      });
      if (response.status === 200) {
        notifications.show({ title: 'Success', message: 'Product updated', color: 'green' });
        mutate(`reservationsCart/?username=${username}`);
      } else {
        notifications.show({ title: 'Error', message: 'Error updating product', color: 'red' });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setUpdateLoading(false);
      setModalOpen(false);
    }
  };
  const selectedDay = selectedDate ? dayjs(selectedDate).format('dddd').toUpperCase() : '';

  const filteredClassTimeOptions =
    selectedDate && classSchedules
      ? classSchedules
          .filter((schedule) => schedule.class_section === class_section) // Filter by class section
          .flatMap((schedule) =>
            Object.entries(schedule.class_days)
              .filter(([day]) => day.toUpperCase() === selectedDay)
              .flatMap(([day, times]) =>
                times.map((time) => ({
                  value: `${day} ${time.start} - ${time.end}`,
                  label: `${time.subject} (${day} ${time.start} - ${time.end})`,
                  subject: time.subject, // Include the subject in the option
                }))
              )
          )
      : [];

  // const cthmSubjects = [
  //   'Hospitality Management',
  //   'Tourism Management',
  //   'Culinary Arts',
  //   'Hotel Administration',
  //   'Event Management',
  // ];

  const getSelectableDates = (days: string[], weeksToConsider: number = 10) => {
    const daysOfWeek = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];
    const today = new Date();
    const dates = [];

    for (let weekOffset = 0; weekOffset < weeksToConsider; weekOffset++) {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() + weekOffset * 7);

      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        if (days.includes(daysOfWeek[date.getDay()])) {
          dates.push(date);
        }
      }
    }
    return dates;
  };

  const allClassDays = classSchedules
    ? Array.from(
        new Set(
          classSchedules.flatMap((schedule) =>
            Object.keys(schedule.class_days).map((day) => day.toUpperCase())
          )
        )
      )
    : [];

  // Generate selectable dates for the next 10 weeks (or any number you choose)
  const selectableDates = getSelectableDates(allClassDays, 10);

  return (
    <>
      <ActionIcon variant="outline" color="blue" size="lg" onClick={() => setOpened(true)}>
        <IconShoppingCart size={24} />
      </ActionIcon>

      <Drawer
        opened={opened}
        onClose={() => setOpened(false)}
        title="Your Cart"
        padding="xl"
        size="lg"
        position="right"
      >
        {data.cart_items.length === 0 ? (
          <Title>No items in cart</Title>
        ) : (
          <Stack gap="md">
            {data.cart_items
              .filter((item) => item.product.quantity > 0)
              .map((item, index) => (
                <Paper key={item.product.productId} p="md" shadow="xs" radius="md" withBorder>
                  <Group align="flex-start">
                    <Checkbox
                      checked={selectedItems.includes(item.product.productId)}
                      onChange={() => handleCheckboxChange(item.product.productId)}
                    />
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${item.product.image}`}
                      alt={item.product.name}
                      style={{ width: 50, height: 50, objectFit: 'cover' }}
                    />
                    <Box>
                      <Text w={500}>{item.product.name}</Text>
                      <Text size="sm" color="dimmed">
                        Qty in Cart: {item.quantity}
                      </Text>
                      <Text size="sm">Price: ₱{item.product.price}</Text>
                      <Text size="xs" color="dimmed">
                        Available Stock: {item.product.quantity}
                      </Text>
                    </Box>
                    <Button
                      variant="light"
                      color="blue"
                      onClick={() => {
                        setSelectedItem(item);
                        setModalOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="light"
                      color="red"
                      onClick={() => handleDelete(item.product.productId)}
                    >
                      Delete
                    </Button>
                  </Group>
                </Paper>
              ))}
          </Stack>
        )}
        <Divider my="md" />
        <Group justify="apart" mt="md">
          <Text w={500}>Total: ₱{totalPrice.toFixed(2)}</Text>
          <Text size="xs" color="dimmed">
            You will only be charged if items are broken. See{' '}
            <Anchor href="/tos">Terms of Service</Anchor> for more information.
          </Text>
        </Group>
        <Divider my="md" />
        <Group justify="right" mt="md">
          <Button
            color="red"
            onClick={() => handleDelete(selectedItems[0])}
            disabled={selectedItems.length === 0}
          >
            Delete Selected ({selectedItems.length} items)
          </Button>
          <Button onClick={handleCheckout} disabled={selectedItems.length === 0}>
            Checkout ({selectedItems.length} items)
          </Button>
        </Group>
        <Divider my="md" />
        {outOfStockItems && outOfStockItems.length > 0 && (
          <>
            <Title order={3}>Out of Stock Items</Title>
            <Stack gap="md">
              {outOfStockItems.map((item) => (
                <Paper key={item.product.productId} p="md" shadow="xs" radius="md" withBorder>
                  <Group align="flex-start">
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${item.product.image}`}
                      alt={item.product.name}
                      style={{ width: 50, height: 50, objectFit: 'cover' }}
                    />
                    <Box>
                      <Text w={500}>{item.product.name}</Text>
                      <Text size="sm" color="dimmed">
                        Qty in Cart: {item.quantity}
                      </Text>
                      <Text size="sm">Price: ₱{item.product.price}</Text>
                      <Text size="xs" color="dimmed">
                        No stocks available
                      </Text>
                    </Box>
                    <Button
                      variant="light"
                      color="red"
                      onClick={() => handleDelete(item.product.productId)}
                    >
                      Delete
                    </Button>
                  </Group>
                </Paper>
              ))}
            </Stack>
          </>
        )}
      </Drawer>

      {/* updatecartItemModal */}
      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Update Cart Item">
        {selectedItem && (
          <>
            <TextInput label="Product Name" value={selectedItem.product.name} readOnly mb="md" />
            <NumberInput
              label="Quantity"
              value={selectedItem.quantity}
              onChange={(value) =>
                setSelectedItem((prev) => (prev ? { ...prev, quantity: value as number } : null))
              }
              min={1}
              max={selectedItem.product.quantity}
              mb="md"
            />
            <Group mt="md">
              <Button variant="light" color="blue" onClick={handleUpdate} loading={updateLoading}>
                Update
              </Button>
              <Button variant="light" color="gray" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
            </Group>
          </>
        )}
      </Modal>

      {/* deleteConfirmationModal */}
      <Modal
        opened={confirmationModalOpen}
        onClose={() => setConfirmationModalOpen(false)}
        title="Confirm Deletion"
      >
        <Text size="sm" mb="md">
          Are you sure you want to delete this item from your cart?
        </Text>
        <Group>
          <Button variant="light" color="red" onClick={() => handleDelete(selectedItems[0])}>
            Confirm
          </Button>
          <Button variant="light" color="gray" onClick={() => setConfirmationModalOpen(false)}>
            Cancel
          </Button>
        </Group>
      </Modal>

      {/* checkoutModal */}
      <Modal
        opened={checkoutModalOpen}
        onClose={() => {
          setCheckoutModalOpen(false);
          setSelectedDate(null);
          setSelectedItems([]);
          setReservationPurpose('');
          setReservationStatus('PENDING');
          setIsGroupCheckout(false);
          setSelectedUsers([]);
          setSelectedClassTime('');
          setSubject('');
        }}
        title="Checkout"
        fullScreen
        radius={0}
        transitionProps={{ transition: 'fade', duration: 200 }}
      >
        <Paper shadow="xl" radius="lg" withBorder p="md">
          <Grid>
            <Grid.Col span={{ base: 12, md: 12, lg: 12 }}>
              <Paper shadow="xl" radius="lg" withBorder p="xl">
                <Stack justify="center" align="center">
                  <Title order={1} size="h1">
                    Checkout Page
                  </Title>
                  <Text size="sm" color="dimmed">
                    {dayjs().format('MMMM D, YYYY h:mm A')}
                  </Text>
                </Stack>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 12, lg: 'auto' }}>
              <Flex
                direction={{ base: 'column', sm: 'row' }}
                gap={{ base: 'sm', sm: 'lg' }}
                justify={{ sm: 'center' }}
              >
                <Paper shadow="xl" radius="lg" withBorder p="xl">
                  <Stack>
                    <Title order={1}>Products</Title>
                    <Table.ScrollContainer minWidth={500}>
                      <Table striped highlightOnHover withTableBorder withColumnBorders>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Product Name</Table.Th>
                            <Table.Th>Product Image</Table.Th>
                            <Table.Th>Quantity</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {selectedItems.map((productId) => {
                            const item = data.cart_items.find(
                              (item) => item.product.productId === productId
                            );
                            return (
                              <Table.Tr key={productId}>
                                <Table.Td>{item?.product.name}</Table.Td>
                                <Table.Td>
                                  <Image
                                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${item?.product.image}`}
                                    alt={item?.product.name}
                                    width={50}
                                    height={50}
                                    radius="md"
                                  />
                                </Table.Td>
                                <Table.Td>{item?.quantity}</Table.Td>
                              </Table.Tr>
                            );
                          })}
                        </Table.Tbody>
                      </Table>
                    </Table.ScrollContainer>
                  </Stack>
                </Paper>

                <Paper shadow="xl" radius="lg" withBorder p="xl">
                  <Divider label="Reservation Details" p={10} />
                  <Stack>
                    <Checkbox
                      label="Is this a group checkout?"
                      checked={isGroupCheckout}
                      onChange={(e) => setIsGroupCheckout(e.currentTarget.checked)}
                      mb="md"
                    />
                    {isGroupCheckout && (
                      <TagsInput
                        label="Group Members"
                        placeholder="Add users"
                        value={selectedUsers}
                        onChange={setSelectedUsers}
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
                      value={reservationPurpose}
                      onChange={(e) => setReservationPurpose(e.target.value)}
                      mb="md"
                    />
                    <DateInput
                      hideOutsideDates
                      clearable
                      minDate={selectableDates.length > 0 ? selectableDates[0] : undefined}
                      maxDate={
                        selectableDates.length > 0
                          ? selectableDates[selectableDates.length - 1]
                          : undefined
                      }
                      label="Date input"
                      placeholder="Date input"
                      value={selectedDate}
                      onChange={setSelectedDate}
                      excludeDate={(date) => {
                        const selectedDay = dayjs(date).format('dddd').toUpperCase();
                        const today = dayjs();
                        const classTimes = classSchedules?.flatMap(
                          (schedule) =>
                            schedule.class_days[selectedDay]?.map((time) => time.end) || []
                        );

                        const isCurrentWeek = selectableDates.some((d) =>
                          dayjs(d).isSame(date, 'day')
                        );
                        const isNextWeek = selectableDates.some((d) =>
                          dayjs(d).isSame(dayjs(date).add(7, 'day'), 'day')
                        );

                        return (
                          (!isCurrentWeek && !isNextWeek) || // Exclude if not in current or next week
                          today.isAfter(date, 'day') || // Exclude past dates
                          (classTimes?.some((endTime) =>
                            today.isAfter(
                              dayjs(date)
                                .set('hour', parseInt(endTime.split(':')[0]))
                                .set('minute', parseInt(endTime.split(':')[1]))
                            )
                          ) ??
                            false)
                        );
                      }}
                      mb="md"
                    />

                    <Select
                      label="Class Schedule"
                      placeholder="Select your class schedule"
                      data={filteredClassTimeOptions}
                      value={selectedDate ? selectedClassTime : null}
                      onChange={(value) => {
                        setSelectedClassTime(value || '');
                        const selectedOption = filteredClassTimeOptions.find(
                          (option) => option.value === value
                        );
                        setSelectedSubject(selectedOption ? selectedOption.subject : '');
                      }}
                      disabled={!selectedDate}
                      mb="md"
                      required
                    />
                    <TextInput
                      label="Subject"
                      placeholder="Subject will be set based on class schedule"
                      value={selectedSubject}
                      disabled
                      mb="md"
                    />
                  </Stack>
                </Paper>
              </Flex>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 12, lg: 'auto' }}>
              <Paper shadow="xl" radius="lg" withBorder p="xl">
                <Stack>
                  <Divider label="Total Prices" />
                  <Title order={3} w={700}>
                    Prices
                  </Title>
                  {selectedItems.map((productId) => {
                    const item = data.cart_items.find(
                      (item) => item.product.productId === productId
                    );
                    return (
                      <Group key={productId} justify="apart">
                        <Text>{item?.product.name}</Text>
                        <Text>
                          ₱
                          {((item?.quantity ?? 0) * parseFloat(item?.product.price ?? '0')).toFixed(
                            2
                          )}
                        </Text>
                      </Group>
                    );
                  })}
                  <Divider />
                  <Group justify="apart">
                    <Text>Total</Text>
                    <Text>₱{totalPrice.toFixed(2)}</Text>
                  </Group>
                  <Text size="xs" color="dimmed">
                    You will only be charged if items are broken. See{' '}
                    <Anchor href="/tos">Terms of Service</Anchor> for more information.
                  </Text>
                  <Button
                    variant="filled"
                    disabled={disabledCheckoutButton}
                    color="green"
                    onClick={confirmCheckout}
                  >
                    Confirm Checkout
                  </Button>
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>
        </Paper>
      </Modal>
    </>
  );
}
