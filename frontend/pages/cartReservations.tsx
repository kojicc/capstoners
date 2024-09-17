import { useState, useContext, SetStateAction } from 'react';
import {
  Card,
  Image,
  Text,
  Group,
  Button,
  Paper,
  SimpleGrid,
  Loader,
  Alert,
  Modal,
  TextInput,
  NumberInput,
  Checkbox,
  TagsInput,
  Autocomplete,
  FileInput,
} from '@mantine/core';
import useSWR, { mutate } from 'swr';
import axios from '@/utils/axiosInstance';
import { AuthContext } from '@/utils/authContext';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { DateTimePicker } from '@mantine/dates';
import { useAuth } from '@/utils/auth';

// Define the types for your API response
interface Product {
  productId: string;
  name: string;
  description: string;
  price: string;
  quantity: number; // available quantity
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

export function CartItems() {
  const { username } = useAuth();

  const { data, error } = useSWR<ApiResponse>(`reservationsCart/?username=${username}`, fetcher, {
    refreshInterval: 1000,
  });

  const [selectedItems, setSelectedItems] = useState<{ [key: string]: number }>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CartItem | null>();
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

  if (error) return <Alert color="red">Error loading cart items</Alert>;
  if (!data) return <Loader />;

  const handleDelete = async (productId: string) => {
    setItemToDelete(productId);
    setConfirmationModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const response = await axios.delete('reservationsCart/', {
        data: {
          username,
          productIds: [itemToDelete],
        },
      });
      if (response.status === 200) {
        notifications.show({ title: 'Success', message: 'Product deleted', color: 'green' });
        mutate(`reservationsCart/?username=${username}`);
      } else {
        notifications.show({ title: 'Error', message: 'Error deleting product', color: 'red' });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setConfirmationModalOpen(false);
      setItemToDelete(null);
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

  const handleSelectItem = (productId: string, quantity: number) => {
    setSelectedItems((prevSelectedItems) => {
      const updatedItems = { ...prevSelectedItems };

      if (quantity === 0) {
        // Remove the item if quantity is 0
        delete updatedItems[productId];
      } else {
        // Update or add the item with the new quantity
        updatedItems[productId] = quantity;
      }

      // Log the updated items immediately after the state is set
      console.log('Updated selectedItems', updatedItems);
      return updatedItems;
    });
  };

  const handleCheckout = () => {
    setCheckoutModalOpen(true);
  };

  const confirmCheckout = async () => {
    try {
      let productIds = Object.keys(selectedItems);
      let quantities = Object.values(selectedItems);
      console.log('productIDs and quantities ', selectedItems);

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
        status: reservationStatus,
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
      setSelectedItems({});
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

  return (
    <Paper shadow="xl" radius="lg" withBorder p="xl">
      <Text size="lg" mb="xl" w={500}>
        Cart Items
      </Text>
      <SimpleGrid cols={3} verticalSpacing="lg">
        {data.cart_items.map((item, index) => (
          <Card key={index} shadow="sm" padding="lg" radius="md" withBorder>
            <Card.Section>
              <Image
                src={`http://localhost:8000${item.product.image}`}
                alt={item.product.name}
                height={160}
              />
            </Card.Section>

            <Group mt="md" mb="xs">
              <Checkbox
                checked={selectedItems[item.product.productId] > 0}
                onChange={(e) => {
                  const newQuantity = e.currentTarget.checked ? item.quantity : 0;
                  handleSelectItem(item.product.productId, newQuantity);
                }}
              />
              <Text w={500}>{item.product.name}</Text>
              <Text color="dimmed">Qty: {item.quantity}</Text>
            </Group>

            <Text size="sm" color="dimmed">
              {item.product.description}
            </Text>

            <Group mt="md" mb="xs">
              <Text w={500}>₱{item.product.price}</Text>
              <Button
                variant="light"
                color="blue"
                fullWidth
                mt="md"
                radius="md"
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
                fullWidth
                mt="md"
                radius="md"
                onClick={() => handleDelete(item.product.productId)}
              >
                Delete
              </Button>
            </Group>
          </Card>
        ))}
      </SimpleGrid>

      <Button
        variant="filled"
        color="green"
        mt="xl"
        fullWidth
        radius="md"
        disabled={Object.keys(selectedItems).length === 0}
        onClick={handleCheckout}
      >
        Checkout
      </Button>

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
          <Button variant="light" color="red" onClick={confirmDelete}>
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
    </Paper>
  );
}
