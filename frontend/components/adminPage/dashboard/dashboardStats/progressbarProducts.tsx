// components/ProgressProducts.tsx
import { AwaitedReactNode, JSXElementConstructor, Key, ReactElement, ReactNode, useEffect, useState } from 'react';
import axios from '@/utils/axiosInstance';
import { ColorSwatch, Group, Paper, Progress, Tooltip, Text, LoadingOverlay } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import useSWR from 'swr';

interface CategoryStatus {
  category: string;
  in_stock: number;
  reserved: number;
  broken_damaged: number;
  total: number;
}

interface Totals {
  in_stock: number;
  reserved: number;
  broken_damaged: number;
  total: number;
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export function ProgressProducts({ period }: { period: string }) {
  const { data: dashboardStats } = useSWR(`dashboard-stats/?period=${period}`, fetcher);
  // const [categoryStatuses, setCategoryStatuses] = useState<CategoryStatus[] | null>(null);
  // const [totals, setTotals] = useState<Totals | null>(null);
  const [visible, { toggle }] = useDisclosure(false);

  // const { data, error } = useSWR<{ categories: CategoryStatus[]; totals: Totals }>(
  //   'totalStocks/',
  //   fetcher,
  //   { refreshInterval: 1000 }
  // );
  // walang interval pero nagrereturn data during window focus and out of focus
  // const { data, error } = useSWR<{ categories: CategoryStatus[], totals: Totals }>('totalStocks/', fetcher);
  // const { categories: categoryStatuses, totals } = data || {};

  // useEffect(() => {
  //   const fetchStatus = async () => {
  //     try {
  //       const response = await axios.get('totalStocks/');
  //       setCategoryStatuses(response.data.categories);
  //       setTotals(response.data.totals);
  //     } catch (error) {
  //       console.error('Error fetching product status:', error);
  //     }
  //   };
  //   fetchStatus();
  // }, []);

  // if (!categoryStatuses || !totals)
  //   return (
  //     <LoadingOverlay visible={visible} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />
  //   );

  return (
    <Paper withBorder p="xl" shadow="xl" style={{ height: 'auto' }}>
      {/* 
      <Text>Total Inventory Overview</Text>
      <Progress.Root size="xl" pb={'auto'}>
        <Tooltip label={`In Stock – ${totals.in_stock}`}>
          <Progress.Section
            value={(totals.in_stock / totals.total) * 100}
            color="green"
            striped
            animated
          >
            <Progress.Label>In Stock</Progress.Label>
          </Progress.Section>
        </Tooltip>

      //   <Tooltip label={`Reserved – ${totals.reserved}`}>
      //     <Progress.Section
      //       value={(totals.reserved / totals.total) * 100}
      //       color="yellow"
      //       striped
      //       animated
      //     >
      //       <Progress.Label>Reserved</Progress.Label>
      //     </Progress.Section>
      //   </Tooltip>

      //   <Tooltip label={`Broken/Damaged – ${totals.broken_damaged}`}>
      //     <Progress.Section
      //       value={(totals.broken_damaged / totals.total) * 100}
      //       color="red"
      //       striped
      //       animated
      //     >
      //       <Progress.Label>Broken/Damaged</Progress.Label>
      //     </Progress.Section>
      //   </Tooltip>
      // </Progress.Root> */}

      {dashboardStats.map((categoryStatus: { category: string; in_stock: number; total: number; reserved: number; broken_damaged: number; }) => (
        <div key={categoryStatus.category} style={{ marginBottom: '20px' }}>
          <Text w={500} size="lg">
            {categoryStatus.category}
          </Text>
          <Progress.Root size="xl" pb={'auto'}>
            <Tooltip label={`In Stock – ${categoryStatus.in_stock}`}>
              <Progress.Section
                value={(categoryStatus.in_stock / categoryStatus.total) * 100}
                color="green"
                striped
                animated
              >
                <Progress.Label>In Stock</Progress.Label>
              </Progress.Section>
            </Tooltip>

            <Tooltip label={`Reserved – ${categoryStatus.reserved}`}>
              <Progress.Section
                value={(categoryStatus.reserved / categoryStatus.total) * 100}
                color="orange"
                striped
                animated
              >
                <Progress.Label>Reserved</Progress.Label>
              </Progress.Section>
            </Tooltip>

            <Tooltip label={`Broken/Damaged – ${categoryStatus.broken_damaged}`}>
              <Progress.Section
                value={(categoryStatus.broken_damaged / categoryStatus.total) * 100}
                color="red"
                striped
                animated
              >
                <Progress.Label>Broken/Damaged</Progress.Label>
              </Progress.Section>
            </Tooltip>
          </Progress.Root>
        </div>
      ))}

      <Group justify="center" pt={30}>
        <ColorSwatch color="green" />
        <Text>In Stock</Text>
        <ColorSwatch color="orange" />
        <Text>Reserved</Text>
        <ColorSwatch color="red" />
        <Text>Broken/Damaged</Text>
      </Group>
    </Paper>
  );
}
