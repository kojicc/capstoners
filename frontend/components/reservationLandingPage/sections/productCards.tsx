import {
  Card,
  Image,
  Text,
  Group,
  Center,
  Button,
  Paper,
  SimpleGrid,
  NumberInput,
  Popover,
  Stack,
} from '@mantine/core';
import useSWR from 'swr';
import axios from '@/utils/axiosInstance';
import { IconGasStation, IconGauge, IconManualGearbox, IconUsers } from '@tabler/icons-react';
import classes from '@/components/modules.css/FeaturesCard.module.css';
import { useContext, useState } from 'react';
import { AuthContext } from '@/utils/authContext';
import { notifications } from '@mantine/notifications';
import { AutocompleteClearable } from './autocompleClearableReservation';
import { useAuth } from '@/utils/auth';

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface Product {
  productId: string;
  name: string;
  description: string;
  image: string;
  price: number;
  discount?: number;
  quantity: number;
  reserved: number;
  category_id: string;
}

interface ProductCardsProps {
  categoryID: string;
  searchQuery: string; // Assuming this is something like "Alcohol - ALC"
}

export function ProductCards({ categoryID, searchQuery }: ProductCardsProps) {
  const [addTocartQuantity, setAddTocartQuantity] = useState(0);
  const [addTocartProductId, setAddTocartProductId] = useState('');
  const { username } = useAuth();

  // const { username } = useContext(AuthContext);
  console.log('username', username);

  const productData = (product: Product) => [
    { label: `Category ID: ${categoryID}`, icon: IconUsers },
    { label: `Total Reservations: ${product.reserved}`, icon: IconGauge },
    { label: `Available Stock: ${product.quantity}`, icon: IconManualGearbox },
    { label: `Product ID: ${product.productId}`, icon: IconGasStation },
  ];

  const { data, error } = useSWR<{ images: Product[]; message: string }>(
    `getImages/?categoryID=${categoryID}`,
    fetcher,
    { refreshInterval: 1000 }
  );

  if (error) return <div>Error loading products</div>;
  if (!data) return <div>Loading...</div>;

  // Extract the second part of searchQuery (e.g., "ALC" from "Alcohol - ALC")
  const searchValue =
    searchQuery.trim().split(' - ')[1]?.toLowerCase() ||
    searchQuery.trim().split('-')[1]?.toLowerCase() ||
    '';
  console.log('searchValue', searchValue);

  // Filter products based on the search value
  const filteredProducts = data.images.filter((product: Product) => {
    const lowerSearchValue = searchValue.toLowerCase();
    return (
      product.productId.toLowerCase().includes(lowerSearchValue) ||
      product.name.toLowerCase().includes(lowerSearchValue) ||
      (product.category_id && product.category_id.toLowerCase().includes(lowerSearchValue))
    );
  });

  const addTocart = async (productId: string, quantity: number) => {
    const response = await axios.post('reservationsCart/', {
      productId,
      quantity,
      username,
    });
    if (response.status === 200) {
      notifications.show({ title: 'Success', message: 'Product added to cart', color: 'green' });
    } else {
      notifications.show({ title: 'Error', message: 'Error adding product to cart', color: 'red' });
    }
  };

  return (
    <Paper shadow="xl" radius="lg" withBorder p="xl" bg={'#592f55'}>
      {/* <AutocompleteClearable /> */}
      <SimpleGrid cols={3} verticalSpacing="lg">
        {filteredProducts.map((product: Product) => (
          <Card key={product.productId} withBorder radius="md" className={classes.card}>
            <Card.Section className={classes.imageSection}>
              <Image
                src={`http://localhost:8000${product.image}`}
                alt={product.name}
                w={200}
                h={200}
                radius={10}
              />
            </Card.Section>

            <Group justify="space-between" mt="md">
              <div>
                <Text fw={500}>{product.name}</Text>
                <Text fz="xs" c="dimmed">
                  {product.description}
                </Text>
              </div>
            </Group>

            <Card.Section className={classes.section} mt="md">
              <Text fz="sm" c="dimmed" className={classes.label}>
                Basic configuration
              </Text>

              <Stack align="flex-start" justify="center" gap="md">
                {productData(product).map((feature) => (
                  <Center key={feature.label}>
                    <feature.icon size="1.05rem" className={classes.icon} stroke={1.5} />
                    <Text size="xs">{feature.label}</Text>
                  </Center>
                ))}
              </Stack>
            </Card.Section>

            <Card.Section className={classes.section}>
              <Group gap={30}>
                <div>
                  <Text fz="xl" fw={700} style={{ lineHeight: 1 }}>
                    ${product.price}
                  </Text>
                  <Text fz="sm" c="dimmed" fw={500} style={{ lineHeight: 1 }} mt={3}>
                    per day
                  </Text>
                </div>

                <Popover width={200} position="bottom" withArrow shadow="md">
                  <Popover.Target>
                    <Button radius="xl" style={{ flex: 1 }}>
                      Rent now
                    </Button>
                  </Popover.Target>
                  <Popover.Dropdown>
                    <NumberInput
                      defaultValue={0}
                      min={1}
                      max={product.quantity}
                      value={addTocartQuantity}
                      onChange={(value) => setAddTocartQuantity(Number(value))}
                      label="Select quantity"
                    />
                    <Button
                      fullWidth
                      mt="md"
                      onClick={() => {
                        addTocart(product.productId, addTocartQuantity);
                        setAddTocartQuantity(0);
                      }}
                    >
                      Add to Cart
                    </Button>
                  </Popover.Dropdown>
                </Popover>
              </Group>
            </Card.Section>
          </Card>
        ))}
      </SimpleGrid>
    </Paper>
  );
}
