import React, { useContext } from 'react';
import useSWR from 'swr';
import { ActionIcon, Menu, Text, Loader, Paper, Group, Divider } from '@mantine/core';
import { IconShoppingCart } from '@tabler/icons-react';
import axios from '@/utils/axiosInstance'; // Adjust this import to your Axios setup
import { AuthContext } from '@/utils/authContext';
import {useAuth} from '@/utils/auth';

// Define the types for your API response
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
  // const { username } = useContext(AuthContext);
  const {username} = useAuth();
  const { data, error } = useSWR<ApiResponse>(`reservationsCart/?username=${username}`, fetcher);

  // Handle loading and error states
  if (error) return <Text color="red">Error loading cart items</Text>;
  if (!data) return <Loader size="sm" />;

  return (
    <Menu shadow="md" width={400} position="bottom-end" withArrow>
      <Menu.Target>
        <ActionIcon variant="outline" color="blue" size="lg">
          <IconShoppingCart size={24} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        <Text size="lg" mb="md" w={500}>
          Cart Items
        </Text>
        {data.cart_items.length === 0 ? (
          <Text>No items in cart</Text>
        ) : (
          data.cart_items.slice(0, 5).map((item, index) => (
            <React.Fragment key={index}>
              <Menu.Item>
                <Paper p="sm" shadow="xs" radius="md" withBorder>
                  <Group gap="xs">
                    <img
                      src={`http://localhost:8000${item.product.image}`}
                      alt={item.product.name}
                      style={{ width: 50, height: 50, objectFit: 'cover' }}
                    />
                    <div>
                      <Text w={500}>{item.product.name}</Text>
                      <Text size="sm" color="dimmed">
                        Qty: {item.quantity}
                      </Text>
                      <Text size="sm">Price: ${item.product.price}</Text>
                    </div>
                  </Group>
                </Paper>
              </Menu.Item>
              {index < 4 && <Divider my="xs" />}
            </React.Fragment>
          ))
        )}
      </Menu.Dropdown>
    </Menu>
  );
}
