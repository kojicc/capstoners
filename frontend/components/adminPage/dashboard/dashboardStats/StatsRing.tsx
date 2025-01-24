import { RingProgress, Text, SimpleGrid, Paper, Center, Group, rem } from '@mantine/core';
import { IconArrowUpRight, IconArrowDownRight, IconHanger2, IconTemplate, IconClockPause, IconStarsFilled, IconUsers } from '@tabler/icons-react';
import axios from '@/utils/axiosInstance';
import  useSWR  from 'swr';
import { data } from './data';
const icons = {
  mostReservedProduct: IconStarsFilled,
  pending: IconClockPause,
  users:IconUsers,
};

type IconType = 'mostReservedProduct' | 'pending' | 'users';

const dataRings: { label: string, stats: string, progress: number, color: string, icon: IconType }[] = [
  { label: 'most reserved product', stats: '', progress: 100, color: 'green', icon: 'mostReservedProduct' },
  { label: 'Pending Orders', stats: '', progress: 100, color: 'orange', icon: 'pending' },
  {
    label: 'Total Users',
    stats: '',
    progress: 100,
    color: 'blue',
    icon: 'users',
  },
] ;
  const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export function StatsRing({ period }: { period: string }) {

  const { data: dashboardStats } = useSWR(`dashboard-stats/?period=${period}`, fetcher);

  if (dashboardStats) {
    dataRings[0].stats = dashboardStats.most_reserved_products[0]?.name || 'No data';
    dataRings[1].stats = dashboardStats.total_pending_orders?.toString() || '0';
    dataRings[2].stats = dashboardStats.total_users?.toString() || '0';
  }

  // const { data: MostReservedProduct, error: MostReservedProductError } = useSWR(
  //   'most-reserved-products/',
  //   fetcher,
  //   { refreshInterval: 1000 }
  // );

  // if (MostReservedProduct && MostReservedProduct.length > 0 && !MostReservedProductError) {
  //   dataRings[0].stats = `${MostReservedProduct[0].productId} - ${MostReservedProduct[0].name}`;
  // } else {
  //   // console.log("MostReservedProduct data is not available yet.");
  // }

  // const { data: PendingOrders, error: PendingOrdersError } = useSWR('pending-orders/', fetcher, {
  //   refreshInterval: 1000,
  // });
  // if (PendingOrders && PendingOrders.total_pending_orders && !PendingOrdersError) {
  //   dataRings[1].stats = PendingOrders.total_pending_orders;
  // } else {
  //   // console.log("PendingOrders data is not available yet.");
  // }
  // // console.log("dataPendingOrders",PendingOrders.total_pending_orders);
  // // dataRings[1].stats = PendingOrders.total_pending_orders;

  // const { data: TotalUsers, error: TotalUsersError } = useSWR('total-users/', fetcher, {
  //   refreshInterval: 1000,
  // });
  // if (TotalUsers && TotalUsers.total_users && !TotalUsersError) {
  //   dataRings[2].stats = TotalUsers.total_users;
  // } else {
  //   // console.log("TotalUsers data is not available yet.");
  // }
  // // console.log("dataTotalUsers",TotalUsers.total_users);
  // // dataRings[2].stats = TotalUsers.total_users;

  const stats = dataRings.map((stat) => {
    const Icon = icons[stat.icon];
    return (
      <Paper withBorder radius="md" p="xs" key={stat.label}>
        <Group>
          <RingProgress
            size={80}
            roundCaps
            thickness={8}
            sections={[{ value: stat.progress, color: stat.color }]}
            label={
              <Center>
                <Icon style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
              </Center>
            }
          />

          <div>
            <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
              {stat.label}
            </Text>
            <Text fw={700} size="xl">
              {stat.stats}
            </Text>
          </div>
        </Group>
      </Paper>
    );
  });

  return (
    <SimpleGrid pb={20} cols={{ base: 1, sm: 3 }}>
      {stats}
    </SimpleGrid>
  );
}