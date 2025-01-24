import { LoadingOverlay, Text } from '@mantine/core';
import useSWR from 'swr';
import axiosInstance from '@/utils/axiosInstance';
import classes from './StatsGroup.module.css';
import { useDisclosure } from '@mantine/hooks';

interface MonthlyData {
  [month: string]: number;
}

interface MonthlyDataWithTotal {
  sorted: MonthlyData;
  total: number;
}

const fetcher = (url: string) => axiosInstance.get(url).then(res => res.data);

export function StatsGroup({ period }: { period: string }) {
  const { data: dashboardStats } = useSWR(`dashboard-stats/?period=${period}`, fetcher);

  const [visible, { toggle }] = useDisclosure(false);

  // const { data: pageViewsData, error: pageViewsError } = useSWR<MonthlyData>(
  //   'total-page-views/',
  //   fetcher,
  //   { refreshInterval: 1000 }
  // );

  // const { data: newUsersData, error: newUsersError } = useSWR<MonthlyData>(
  //   'total-new-users/',
  //   fetcher,
  //   { refreshInterval: 1000 }
  // );
  // const { data: completedOrdersData, error: completedOrdersError } = useSWR<MonthlyData>(
  //   'total-completed-orders/',
  //   fetcher,
  //   { refreshInterval: 1000 }
  // );

  const total = dashboardStats?.total;
  const sortedData = dashboardStats?.sorted ?? {};
  console.log('sortedData', sortedData);

  // if (pageViewsError || newUsersError || completedOrdersError) {
  //   return <div>Error loading data</div>;
  // }

  if (!dashboardStats || !dashboardStats || !dashboardStats) {
    return (
      <LoadingOverlay visible={visible} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />
    );
  }

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) {
      return current > 0 ? '∞%' : '0%';
    }
    const change = ((current - previous) / previous) * 100;
    if (change === 0 || change < 0) return '0%';
    return `${Math.round(change)}%`;
  };

  // Calculate page views stats
  const pageViewMonths = Object.keys(dashboardStats).sort();
  const latestPageViewMonth = pageViewMonths.pop() || '';
  const latestCountPageViews = dashboardStats[latestPageViewMonth] || 0;
  const previousPageViewMonth = pageViewMonths.pop() || '';
  const previousCountPageViews = dashboardStats[previousPageViewMonth] || 0;
  const pageViewsChange = previousCountPageViews
    ? calculatePercentageChange(latestCountPageViews, previousCountPageViews)
    : 'New data';

  // Calculate new users stats
  const newUsersMonths = Object.keys(dashboardStats).sort();
  const latestNewUsersMonth = newUsersMonths.pop() || '';
  const latestCountNewUsers = dashboardStats[latestNewUsersMonth] || 0;
  const previousNewUsersMonth = newUsersMonths.pop() || '';
  const previousCountNewUsers = dashboardStats[previousNewUsersMonth] || 0;
  const newUsersChange = previousCountNewUsers
    ? calculatePercentageChange(latestCountNewUsers, previousCountNewUsers)
    : 'New data';

  // Calculate completed orders stats
  const completedOrdersMonths = Object.keys(sortedData);

  const latestCompletedOrdersMonth = completedOrdersMonths.pop() || '';

  // Correct way to access the value
  const latestCountCompletedOrders =
    sortedData[latestCompletedOrdersMonth as keyof typeof sortedData] || 0; // Use the latest month to get the value
  const previousCompletedOrdersMonth = completedOrdersMonths.pop() || '';
  const previousCountCompletedOrders =
    sortedData[previousCompletedOrdersMonth as keyof typeof sortedData] || 0;

  const completedOrdersChange = previousCountCompletedOrders
    ? calculatePercentageChange(latestCountCompletedOrders, previousCountCompletedOrders)
    : 'New data';

  // Update the state
    const data = [
      {
      title: 'Total Page Views',
      stats: dashboardStats.total_page_views.toString(),
      description: `Your website has received ${dashboardStats.total_page_views} total views`,
      },
      {
      title: 'Registered Users',
      stats: dashboardStats.total_users.toString(),
      description: `Currently serving ${dashboardStats.total_users} registered users on the platform`,
      },
      {
      title: 'Orders Awaiting Processing',
      stats: dashboardStats.total_pending_orders.toString(),
      description: `There are ${dashboardStats.total_pending_orders} orders that need attention`,
      },
    ];

  return (
    <div className={classes.root}>
      {data.map((stat) => (
        <div key={stat.title} className={classes.stat}>
          <Text className={classes.count}>{stat.stats}</Text>
          <Text className={classes.title}>{stat.title}</Text>
          <Text className={classes.description}>{stat.description}</Text>
        </div>
      ))}
    </div>
  );
}
