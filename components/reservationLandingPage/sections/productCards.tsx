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
  LoadingOverlay,
  Pagination,
} from '@mantine/core';
import useSWR from 'swr';
import axios from '@/utils/axiosInstance';
import { IconGasStation, IconGauge, IconManualGearbox, IconUsers } from '@tabler/icons-react';
import classes from '@/components/modules.css/FeaturesCard.module.css';
import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
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
  category: string;
}

interface ProductCardsProps {
  categoryID: string;
  searchQuery: string;
}

function chunk<T>(array: T[], size: number): T[][] {
  if (!array.length) {
    return [];
  }
  const head = array.slice(0, size);
  const tail = array.slice(size);
  return [head, ...chunk(tail, size)];
}

export function ProductCards({ categoryID, searchQuery }: ProductCardsProps) {
  const [addTocartQuantity, setAddTocartQuantity] = useState(1); // Set initial quantity to 1
  const [addTocartProductId, setAddTocartProductId] = useState('');
  const { username } = useAuth();
  const [activePage, setPage] = useState(1);
  const [openedPopover, setOpenedPopover] = useState<string | null>(null); // Track the opened popover

  useEffect(() => {
    setPage(1);
  }, [categoryID, searchQuery]);

  const productData = (product: Product) => [
    { label: `Category ID: ${product.category}`, icon: IconUsers },
    { label: `Total Reservations: ${product.reserved}`, icon: IconGauge },
    { label: `Available Stock: ${product.quantity}`, icon: IconManualGearbox },
    { label: `Product ID: ${product.productId}`, icon: IconGasStation },
  ];

  const { data, error } = useSWR<{ images: Product[]; message: string }>('getImages/', fetcher, {
    refreshInterval: 1000,
  });

  if (error) return <div>Error loading products</div>;
  if (!data)
    return <LoadingOverlay visible zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />;

  const searchValue =
    searchQuery.trim().split(' - ')[1]?.toLowerCase() ||
    searchQuery.trim().split('-')[1]?.toLowerCase() ||
    '';

  const filteredProducts = data.images.filter((product: Product) => {
    const lowerSearchValue = searchValue.toLowerCase();
    if (lowerSearchValue) {
      return (
        product.productId.toLowerCase().includes(lowerSearchValue) ||
        product.name.toLowerCase().includes(lowerSearchValue) ||
        (product.category && product.category.toLowerCase().includes(lowerSearchValue))
      );
    }
    if (categoryID) {
      return (
        product.category === categoryID &&
        (product.productId.toLowerCase().includes(lowerSearchValue) ||
          product.name.toLowerCase().includes(lowerSearchValue) ||
          (product.category && product.category.toLowerCase().includes(lowerSearchValue)))
      );
    } else {
      return true;
    }
  });

  const paginatedProducts = chunk(filteredProducts, 5);
  const currentProducts = paginatedProducts[activePage - 1] || [];

  const addTocart = async (productId: string, quantity: number, productName: string) => {
    const response = await axios.post('reservationsCart/', {
      productId,
      quantity,
      username,
    });
    if (response.status === 200) {
      notifications.show({
        title: 'Success',
        message: `${quantity} ${productName}(s) added to cart`,
        color: 'green',
      });
    } else {
      notifications.show({
        title: 'Error',
        message: `Error adding ${productName} to cart`,
        color: 'red',
      });
    }
  };

  return (
    <Paper shadow="xl" radius="lg" withBorder p="xl" bg={'#592f55'}>
      <SimpleGrid
        cols={{ base: 1, sm: 2, lg: 3 }}
        spacing={{ base: 10, sm: 'xl' }}
        verticalSpacing={{ base: 'md', sm: 'xl' }}
      >
        {currentProducts.map((product: Product) => (
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
                    ₱{product.price}
                  </Text>
                  <Text fz="sm" c="dimmed" fw={500} style={{ lineHeight: 1 }} mt={3}>
                    per broken item
                  </Text>
                </div>

                {product.quantity === 0 ? (
                  <Button radius="xl" p={0} style={{ flex: 1 }} disabled>
                    Out of Stock
                  </Button>
                ) : (
                  <Popover
                    width={200}
                    position="bottom"
                    withArrow
                    shadow="md"
                    opened={openedPopover === product.productId}
                    onChange={(opened) => setOpenedPopover(opened ? product.productId : null)}
                  >
                    <Popover.Target>
                      <Button
                        radius="xl"
                        style={{ flex: 1 }}
                        onClick={() =>
                          setOpenedPopover((prev) =>
                            prev === product.productId ? null : product.productId
                          )
                        }
                      >
                        Rent now
                      </Button>
                    </Popover.Target>
                    <Popover.Dropdown>
                      <NumberInput
                        defaultValue={1}
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
                          addTocart(product.productId, addTocartQuantity, product.name);
                          setAddTocartQuantity(1); // Reset quantity to 1
                          setAddTocartProductId('');
                          setOpenedPopover(null); // Close the popover
                        }}
                      >
                        Add to Cart
                      </Button>
                    </Popover.Dropdown>
                  </Popover>
                )}
              </Group>
            </Card.Section>
          </Card>
        ))}
      </SimpleGrid>
      <Center>
        <Pagination
          total={paginatedProducts.length}
          value={activePage}
          onChange={setPage}
          mt="sm"
        />
      </Center>
    </Paper>
  );
}
