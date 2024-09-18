import React, { useState } from 'react';
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
  NumberInput,
  TagsInput,
  Autocomplete,
  Anchor,
  Stack,
  Box,
} from '@mantine/core';
import { IconShoppingCart } from '@tabler/icons-react';
import axios from '@/utils/axiosInstance'; // Adjust this import to your Axios setup
import { useAuth } from '@/utils/auth';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/router';
import dayjs from 'dayjs';
import { DateTimePicker } from '@mantine/dates';

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

// Fetcher function using Axios
const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export function CartIcon() {
  const [opened, setOpened] = useState(false);
  const { username } = useAuth();
  const { data, error } = useSWR<ApiResponse>(`reservationsCart/?username=${username}`, fetcher, {
    refreshInterval: 1000,
  });

  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CartItem | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [reservationDate, setReservationDate] = useState<Date | null>(null);
  const [reservationEndDate, setReservationEndDate] = useState<Date | null>(null);
  const [reservationPurpose, setReservationPurpose] = useState('');
  const [reservationStatus, setReservationStatus] = useState('PENDING');
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [isGroupCheckout, setIsGroupCheckout] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [subject, setSubject] = useState('');

  // Calculate total price based on selected items
  const totalPrice = selectedItems.reduce((total, productId) => {
    const item = data?.cart_items.find((item) => item.product.productId === productId);
    return total + (item ? item.quantity * parseFloat(item.product.price) : 0);
  }, 0);

  // Handle checkbox toggle
  const handleCheckboxChange = (productId: string) => {
    setSelectedItems((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  // Handle deletion of items
  const handleDelete = async () => {
    try {
      await axios.delete('reservationsCart/', {
        data: { username, productIds: selectedItems },
      });

      // Update the cart after deletion
      mutate(`reservationsCart/?username=${username}`);

      // Show notification and reset selected items
      notifications.show({ message: 'Items deleted from cart', color: 'green' });
      setSelectedItems([]);
    } catch (error) {
      notifications.show({ message: 'Failed to delete items', color: 'red' });
      console.error(error);
    }
  };

  // Handle loading and error states
  if (error) return <Text color="red">Error loading cart items</Text>;
  if (!data) return <Loader size="sm" />;

  // Handle checkout by passing selected items to checkout page
  const handleCheckout = () => {
    setCheckoutModalOpen(true);
  };

  const confirmCheckout = async () => {
    try {
      let productIds = selectedItems;
      let quantities = selectedItems.map(
        (productId) =>
          data.cart_items.find((item) => item.product.productId === productId)?.quantity || 0
      );

      // Make the API call
      const response = await axios.post('reservationsCreateUpdate/', {
        username,
        productIds,
        quantities,
        reservation_date: reservationDate
          ? dayjs(reservationDate).format('YYYY-MM-DD HH:mm')
          : null,
        reservation_date_end: reservationEndDate
          ? dayjs(reservationEndDate).format('YYYY-MM-DD HH:mm')
          : null,
        reservation_purpose: reservationPurpose,
        is_group: isGroupCheckout,
        group_members: isGroupCheckout ? selectedUsers : [],
        subject: subject,
      });

      // Handle the success response after retry (if any)
      notifications.show({
        title: 'Success',
        message: `Checkout successful and your reservation ID is ${response.data.reservation_id}`,
        color: 'green',
      });

      // Clear the selected items, form data, and refresh the cart
      setSelectedItems([]);
      setReservationDate(null);
      setReservationEndDate(null);
      setReservationPurpose('');
      setReservationStatus('PENDING');
      setIsGroupCheckout(false);
      setSelectedUsers([]);
      setSubject('');
      mutate(`reservationsCart/?username=${username}`);
    } catch (error) {
      // Show an error notification if the request fails even after retrying
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
          <Text>No items in cart</Text>
        ) : (
          <Stack gap="md">
            {data.cart_items.map((item, index) => (
              <Paper key={item.product.productId} p="md" shadow="xs" radius="md" withBorder>
                <Group align="flex-start">
                  <Checkbox
                    checked={selectedItems.includes(item.product.productId)}
                    onChange={() => handleCheckboxChange(item.product.productId)}
                  />
                  <img
                    src={`http://localhost:8000${item.product.image}`}
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
          <Button color="red" onClick={handleDelete} disabled={selectedItems.length === 0}>
            Delete Selected ({selectedItems.length} items)
          </Button>
          <Button onClick={handleCheckout} disabled={selectedItems.length === 0}>
            Checkout ({selectedItems.length} items)
          </Button>
        </Group>
      </Drawer>

      {/* Update Modal */}
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
              max={selectedItem.product.quantity} // Set max to available stock
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

      {/* Confirmation Modal */}
      <Modal
        opened={confirmationModalOpen}
        onClose={() => setConfirmationModalOpen(false)}
        title="Confirm Deletion"
      >
        <Text size="sm" mb="md">
          Are you sure you want to delete this item from your cart?
        </Text>
        <Group>
          <Button variant="light" color="red" onClick={handleDelete}>
            Confirm
          </Button>
          <Button variant="light" color="gray" onClick={() => setConfirmationModalOpen(false)}>
            Cancel
          </Button>
        </Group>
      </Modal>

      {/* Checkout Modal */}
      <Modal
        opened={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        title="Checkout"
      >
        <Checkbox
          label="Is this a group checkout?"
          checked={isGroupCheckout}
          onChange={(e) => setIsGroupCheckout(e.currentTarget.checked)}
          mb="md"
        />
        {isGroupCheckout && (
          <>
            <TagsInput
              label="Group Members"
              placeholder="Add users"
              value={selectedUsers}
              onChange={setSelectedUsers}
              mb="md"
            />
            <Autocomplete
              label="Subject"
              placeholder="Select a subject"
              value={subject}
              onChange={setSubject}
              data={['Math', 'Science', 'History']} // Example subjects, replace with actual data
              mb="md"
            />
          </>
        )}
        <TextInput
          label="Reservation Purpose"
          value={reservationPurpose}
          onChange={(e) => setReservationPurpose(e.target.value)}
          mb="md"
        />
        <DateTimePicker
          required
          label="Reservation Start Date"
          value={reservationDate}
          onChange={setReservationDate}
          mb="md"
        />
        <DateTimePicker
          required
          label="Reservation End Date"
          value={reservationEndDate}
          onChange={setReservationEndDate}
          mb="md"
        />
        <Autocomplete
          label="Subject"
          placeholder="Select a subject"
          value={subject}
          onChange={setSubject}
          data={['Math', 'Science', 'History']} // Example subjects, replace with actual data
          mb="md"
        />
        <Group mt="md">
          <Button variant="filled" color="green" onClick={confirmCheckout}>
            Confirm Checkout
          </Button>
          <Button variant="light" color="gray" onClick={() => setCheckoutModalOpen(false)}>
            Cancel
          </Button>
        </Group>
      </Modal>
    </>
  );
}
