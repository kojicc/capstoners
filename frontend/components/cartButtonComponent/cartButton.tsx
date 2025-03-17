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
  rem,
  Tooltip,
} from '@mantine/core';
import { IconShoppingCart, IconClock } from '@tabler/icons-react';
import axios from '@/utils/axiosInstance'; // Adjust this import to your Axios setup
import { useAuth } from '@/utils/auth';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/router';
import dayjs from 'dayjs';
import { DateInput, TimeInput } from '@mantine/dates';
import classes from './cart.module.css';

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
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [opened, setOpened] = useState(false);
  const { username, class_section } = useAuth();
  const [class_section_new, setClassSectionNew] = useState('');
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
  const [cartItemCount, setCartItemCount] = useState<number>(0);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isSameDay, setIsSameDay] = useState(false);
  const [showSameDayModal, setShowSameDayModal] = useState(false);

  // const { data: usersData, error: usersError } = useSWR<Users[]>(
  //   `adminupdateUsers/?class_section=${class_section}`,
  //   fetcher,
  //   {
  //     // refreshInterval: 1000,
  //     onSuccess: (data) => {
  //       setUsers(data);
  //     },
  //   }
  // );

  //#endregion

  // Add function to check if selected date is today
  const checkIfSameDay = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const { data, error } = useSWR<ApiResponse>(`reservationsCart/?username=${username}`, fetcher, {
    refreshInterval: 1000,
    onSuccess: (data) => {
      setCartItemCount(data.cart_items.length);
    },
  });

  // Filter items with 0 stock
  const outOfStockItems = data?.cart_items.filter((item) => item.product.quantity === 0);

  useEffect(() => {
    const isFormValid =
      reservationPurpose.trim() !== '' &&
      selectedDate !== null &&
      selectedSubject.trim() !== '' &&
      (!isGroupCheckout || selectedUsers.length > 0);

    setDisabledCheckoutButton(!isFormValid);
  }, [
    reservationPurpose,
    selectedDate,
    selectedClassTime,
    selectedSubject,
    isGroupCheckout,
    selectedUsers,
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

  const handleDelete = async (productIds: string[]) => {
    setDeleteLoading(true);
    try {
      await axios.delete('reservationsCart/', {
        data: { username, productIds },
      });

      mutate(`reservationsCart/?username=${username}`);
      notifications.show({ message: 'Items deleted from cart', color: 'green' });
      setSelectedItems((prev) => prev.filter((id) => !productIds.includes(id)));
    } catch (error) {
      notifications.show({ message: 'Failed to delete items', color: 'red' });
      console.error(error);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (error) return <Text color="red">Error loading cart items</Text>;
  if (!data) return <Loader size="sm" />;

  const handleCheckout = () => {
    setCheckoutModalOpen(true);
  };

  const confirmCheckout = async () => {
    try {
      setCheckoutLoading(true);

      // Validate required fields
      if (!selectedDate || !startTime || !endTime || !reservationPurpose || !selectedSubject) {
        notifications.show({
          title: 'Error',
          message: 'Please fill in all required fields',
          color: 'red',
        });
        return;
      }

      // Format the date and times
      const day = dayjs(selectedDate).format('dddd');

      // Format times as HH:mm:ss
      const formattedStartTime = startTime.includes(':') ? startTime : `${startTime}:00`;
      const formattedEndTime = endTime.includes(':') ? endTime : `${endTime}:00`;

      // Get selected items and quantities
      const productIds = selectedItems;
      const quantities = selectedItems.map(
        (productId) =>
          data.cart_items.find((item) => item.product.productId === productId)?.quantity || 0
      );

      // Create payload
      const payload = {
        username,
        productIds,
        quantities,
        reservation_purpose: reservationPurpose,
        is_group: isGroupCheckout,
        group_members: isGroupCheckout ? selectedUsers : [],
        subject: selectedSubject,
        reservation_day: day,
        reservation_date: formattedStartTime,
        reservation_date_end: formattedEndTime,
        reserved_date: selectedDate,
        status: 'PENDING',
        user_class_section: class_section_new ? class_section_new : class_section,
        same_day_reservation: isSameDay, // Add this line
      };

      console.log('Sending payload:', payload); // Debug log

      const response = await axios.post('reservationsCreateUpdate/', payload);

      if (response.data) {
        notifications.show({
          title: 'Success',
          message: `Checkout successful! Reservation ID: ${response.data.reservation_id}`,
          color: 'green',
        });

        // Reset form
        setSelectedItems([]);
        setReservationPurpose('');
        setReservationStatus('PENDING');
        setIsGroupCheckout(false);
        setSelectedUsers([]);
        setStartTime('');
        setEndTime('');
        setSelectedSubject('');
        setSelectedDate(null);
        mutate(`reservationsCart/?username=${username}`);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage =
        (error as any).response?.data?.message || 'An error occured, please try again later.';
      notifications.show({
        message: errorMessage,
        color: 'red',
      });
    } finally {
      setCheckoutModalOpen(false);
      setCheckoutLoading(false);
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

  const handleSelectAll = () => {
    const allProductIds = data.cart_items.map((item) => item.product.productId);
    setSelectedItems(allProductIds);
  };

  const handleDeselectAll = () => {
    setSelectedItems([]);
  };

  return (
    <>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <ActionIcon
          variant="outline"
          color="blue"
          size="lg"
          onClick={() => setOpened(true)}
          style={{ position: 'relative', display: 'inline-block' }}
        >
          <IconShoppingCart size={24} />
        </ActionIcon>
        {cartItemCount > 0 && (
          <Text
            size="xs"
            style={{
              position: 'absolute',
              top: -10,
              right: -10,
              backgroundColor: 'red',
              borderRadius: '50%',
              width: 20,
              height: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
            }}
          >
            {cartItemCount}
          </Text>
        )}
      </div>

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
          <>
            <Group justify="apart" mb="md">
              <Button variant="light" color="blue" onClick={handleSelectAll}>
                Select All
              </Button>
              <Button variant="light" color="blue" onClick={handleDeselectAll}>
                Deselect All
              </Button>
            </Group>
            <Stack gap="md">
              {data.cart_items
                .filter((item) => item.product.quantity > 0)
                .map((item, index) => (
                  <Paper key={item.product.productId} p="md" shadow="xs" radius="md" withBorder>
                    <Group align="flex-start">
                      <Checkbox.Card
                        className={classes.root}
                        radius="md"
                        checked={selectedItems.includes(item.product.productId)}
                        onClick={() => handleCheckboxChange(item.product.productId)}
                      >
                        <Group wrap="nowrap" align="flex-start">
                          <Checkbox.Indicator />
                          <img
                            src={`${item.product.image}`}
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
                        </Group>
                      </Checkbox.Card>

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
                        onClick={() => handleDelete([item.product.productId])}
                      >
                        Delete
                      </Button>
                    </Group>
                  </Paper>
                ))}
            </Stack>
          </>
        )}
        <Divider my="md" />
        <Group justify="apart" mt="md">
          <Text size="md" w={500}>
            Total Price to be paid if broken: ₱{totalPrice.toFixed(2)}
          </Text>
          <Text size="xs" color="dimmed">
            You will only be charged if items are broken. See{' '}
            <Anchor href="/tos">Terms of Service</Anchor> for more information.
          </Text>
        </Group>
        <Divider my="md" />
        <Group justify="right" mt="md">
          <Button
            color="red"
            onClick={() => handleDelete(selectedItems)}
            disabled={selectedItems.length === 0}
            loading={deleteLoading}
          >
            Delete Selected ({selectedItems.length} items)
          </Button>
          <Button
            onClick={() => {
              handleCheckout();
              setOpened(false);
            }}
            loading={checkoutLoading}
            disabled={selectedItems.length === 0}
          >
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
                      src={`${item.product.image}`}
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
                      onClick={() => handleDelete([item.product.productId])}
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
          <Button variant="light" color="red" onClick={() => handleDelete([selectedItems[0]])}>
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
                                    src={`${item?.product.image}`}
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
                  <Stack>
                    <Tooltip label="Enter new class section or leave blank to keep current class section">
                      <TextInput
                        label={`Current Class Section - ${class_section}`}
                        placeholder={`Leave blank for old section`}
                        value={class_section_new}
                        onChange={(e) => setClassSectionNew(e.target.value)}
                        mb="md"
                      />
                    </Tooltip>
                    <TextInput
                      label="Reservation Purpose"
                      placeholder="Enter reservation purpose"
                      value={reservationPurpose}
                      onChange={(e) => setReservationPurpose(e.target.value)}
                      mb="md"
                    />

                    <DateInput
                      minDate={new Date()}
                      label="Date input"
                      placeholder="Pick a date"
                      value={selectedDate}
                      onChange={(date) => {
                        if (date && checkIfSameDay(date)) {
                          setShowSameDayModal(true);
                          setIsSameDay(true);
                        } else {
                          setIsSameDay(false);
                        }
                        setSelectedDate(date);
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
                      value={startTime}
                      onChange={(event) => setStartTime(event.currentTarget.value)}
                      mb="md"
                    />

                    <TimeInput
                      label="End Time"
                      placeholder="Enter end time"
                      leftSection={
                        <IconClock style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
                      }
                      value={endTime}
                      onChange={(event) => setEndTime(event.currentTarget.value)}
                      mb="md"
                    />

                    <TextInput
                      label="Subject"
                      placeholder="Enter subject"
                      value={selectedSubject}
                      onChange={(event) => setSelectedSubject(event.currentTarget.value)}
                      mb="md"
                    />
                  </Stack>
                </Paper>
              </Flex>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 12, lg: 'auto' }}>
              <Paper shadow="xl" radius="lg" withBorder p="xl">
                <Stack>
                  <Divider label="Items Being Borrowed" />
                  <Title order={3} w={700}>
                    Selected Equipment
                  </Title>
                  {selectedItems.map((productId) => {
                    const item = data.cart_items.find(
                      (item) => item.product.productId === productId
                    );
                    return (
                      <Group key={productId} justify="apart">
                        <Text>{item?.product.name}</Text>
                        <Text size="sm" c="dimmed">
                          Qty: {item?.quantity}
                        </Text>
                      </Group>
                    );
                  })}
                  <Divider />
                  <Title order={4} c="red">
                    Penalty Charges (Only if items are broken/damaged)
                  </Title>
                  <Group justify="apart">
                    <Text>Total potential penalty:</Text>
                    <Text c="red">₱{totalPrice.toFixed(2)}</Text>
                  </Group>
                  <Text size="xs" c="dimmed">
                    Note: These charges only apply if equipment is damaged or broken. See{' '}
                    <Anchor href="/tos">Terms of Service</Anchor> for more information.
                  </Text>
                  <Button
                    variant="filled"
                    disabled={disabledCheckoutButton}
                    color="green"
                    onClick={confirmCheckout}
                    loading={checkoutLoading}
                  >
                    Confirm Checkout
                  </Button>
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>
        </Paper>
      </Modal>

      <Modal
        opened={showSameDayModal}
        onClose={() => {
          setShowSameDayModal(false);
          setSelectedDate(null);
        }}
        title="Same Day Reservation"
        centered
      >
        <Text>
          Warning: This will be marked as a same-day reservation. Making same-day reservations will
          result in grade deductions for the subject and professor specified in your reservation.
          Are you sure you want to continue?
        </Text>
        <Group mt="md" justify="flex-end">
          <Button variant="light" color="red" onClick={() => setShowSameDayModal(false)}>
            Continue
          </Button>
        </Group>
      </Modal>
    </>
  );
}
