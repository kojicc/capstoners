import { Card, Group, Stack, Text, Image } from '@mantine/core';

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  quantity: number;
  image: string;
  productId: string;
  category: string;
  type: string;
  reserved: number;
}

export default function ProductStatsCard({
  product,
  label,
}: {
  product: Product;
  label: string;
}): JSX.Element {
  return (
    <Card shadow="sm" padding="sm" radius="md" withBorder>
      <Group justify="apart">
        <Stack gap={4}>
          <Text size="sm" fw={500}>
            {product.name}
          </Text>
          <Text size="xs" color="dimmed">
            ID: {product.productId}
          </Text>
        </Stack>
        <Image src={product.image} height={60} width={60} radius="md" fit="contain" />
      </Group>
      <Group justify="apart" mt="xs">
        <Text size="sm">
          {label === 'Reserved' ? 'Times Reserved:' : 'Current Stock:'}
          <Text span fw={500} ml={4}>
            {label === 'Reserved' ? product.reserved : product.quantity}
          </Text>
        </Text>
      </Group>
    </Card>
  );
}
