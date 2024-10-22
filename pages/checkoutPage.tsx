import { useState, useContext } from 'react';
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
  NumberInput,
} from '@mantine/core';
import useSWR, { mutate } from 'swr';
import axios from '@/utils/axiosInstance'; // Adjust this import to your Axios setup
import { AuthContext } from '@/utils/authContext';
import { notifications } from '@mantine/notifications';
import { useAuth } from '@/utils/auth';

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

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function CartItems() {
  const { username } = useAuth();

  // const { username } = useContext(AuthContext);
  const { data, error } = useSWR<ApiResponse>(`reservationsCart/?username=${username}`, fetcher);

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CartItem | null>(null);
  const [updateQuantity, setUpdateQuantity] = useState<number | ''>('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  if (error) return <Alert color="red">Error loading cart items</Alert>;
  if (!data) return <Loader />;

  const handleDelete = async (productId: string) => {
    setItemToDelete(productId);
    setConfirmationModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleteLoading(true);
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
      }
    } catch (error) {
      notifications.show({ title: 'Error', message: 'Error deleting product', color: 'red' });
    } finally {
      setDeleteLoading(false);
      setConfirmationModalOpen(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem || updateQuantity === '') return;
    setUpdateLoading(true);
    try {
      const response = await axios.put('reservationsCart/', {
        username,
        productIds: [selectedItem.product.productId],
        quantities: [updateQuantity],
      });
      if (response.status === 200) {
        notifications.show({ title: 'Success', message: 'Quantity updated', color: 'green' });
        mutate(`reservationsCart/?username=${username}`);
      }
    } catch (error) {
      notifications.show({ title: 'Error', message: 'Error updating quantity', color: 'red' });
    } finally {
      setUpdateLoading(false);
      setModalOpen(false);
    }
  };

  const handleProceedToCheckout = () => {
    // You can add a checkout process here (e.g., reserving products)
    // ...
    notifications.show({
      title: 'Proceeding to Checkout',
      message: 'Checkout process started',
      color: 'blue',
    });
  };

  return (
    <div>
      <SimpleGrid cols={3} spacing="lg">
        {data.cart_items.map((item) => (
          <Card key={item.product.productId} shadow="sm" padding="lg">
            <Card.Section>
              <Image src={item.product.image} alt={item.product.name} height={160} />
            </Card.Section>
            <Group p="apart" mt="md" mb="xs">
              <Text w={500}>{item.product.name}</Text>
              <Text color="dimmed">Qty: {item.quantity}</Text>
            </Group>
            <Text size="sm" color="dimmed">
              {item.product.description}
            </Text>
            <Text size="sm" color="dimmed">
              Price: {item.product.price}
            </Text>
            <Group p="apart" mt="md">
              <Button
                variant="light"
                color="blue"
                onClick={() => {
                  setSelectedItem(item);
                  setUpdateQuantity(item.quantity);
                  setModalOpen(true);
                }}
              >
                Update Quantity
              </Button>
              <Button
                variant="light"
                color="red"
                onClick={() => handleDelete(item.product.productId)}
              >
                Delete
              </Button>
            </Group>
          </Card>
        ))}
      </SimpleGrid>

      <Button mt="lg" fullWidth onClick={handleProceedToCheckout}>
        Proceed to Checkout
      </Button>

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Update Quantity">
        <NumberInput
          value={updateQuantity}
          onChange={(val) => setUpdateQuantity((val as number) || '')}
          min={1}
          label="Quantity"
        />
        <Group p="right" mt="md">
          <Button onClick={handleUpdate} loading={updateLoading}>
            Update
          </Button>
        </Group>
      </Modal>

      <Modal
        opened={confirmationModalOpen}
        onClose={() => setConfirmationModalOpen(false)}
        title="Confirm Deletion"
      >
        <Text>Are you sure you want to delete this item?</Text>
        <Group p="right" mt="md">
          <Button variant="light" onClick={() => setConfirmationModalOpen(false)}>
            Cancel
          </Button>
          <Button color="red" onClick={confirmDelete} loading={deleteLoading}>
            Delete
          </Button>
        </Group>
      </Modal>
    </div>
  );
}
