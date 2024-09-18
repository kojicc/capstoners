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

export function StatsGroup() {
  const [visible, { toggle }] = useDisclosure(false);

  const { data: pageViewsData, error: pageViewsError } = useSWR<MonthlyData>('total-page-views/', fetcher, { refreshInterval: 1000 });

  const { data: newUsersData, error: newUsersError } = useSWR<MonthlyData>('total-new-users/', fetcher, { refreshInterval: 1000 });
  const { data: completedOrdersData, error: completedOrdersError } = useSWR<MonthlyData>('total-completed-orders/', fetcher, { refreshInterval: 1000 });

  const total = completedOrdersData?.total ;
  const sortedData = completedOrdersData?.sorted ?? {};
  console.log("sortedData",sortedData);

  if (pageViewsError || newUsersError || completedOrdersError) {
    return <div>Error loading data</div>;
  }

  if (!pageViewsData || !newUsersData || !completedOrdersData) {
    return <LoadingOverlay visible={visible} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
    ;
  }

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0)
      { return current > 0 ? '∞%' : '0%';}
    const change = ((current - previous) / previous) * 100;
    if (change === 0 || change<0) return '0%';
    return `${Math.round(change)}%`;
  };

  // Calculate page views stats
  const pageViewMonths = Object.keys(pageViewsData).sort();
  const latestPageViewMonth = pageViewMonths.pop() || '';
  const latestCountPageViews = pageViewsData[latestPageViewMonth] || 0;
  const previousPageViewMonth = pageViewMonths.pop() || '';
  const previousCountPageViews = pageViewsData[previousPageViewMonth] || 0;
  const pageViewsChange = previousCountPageViews ? calculatePercentageChange(latestCountPageViews, previousCountPageViews) : 'New data';

  // Calculate new users stats
  const newUsersMonths = Object.keys(newUsersData).sort();
  const latestNewUsersMonth = newUsersMonths.pop() || '';
  const latestCountNewUsers = newUsersData[latestNewUsersMonth] || 0;
  const previousNewUsersMonth = newUsersMonths.pop() || '';
  const previousCountNewUsers = newUsersData[previousNewUsersMonth] || 0;
  const newUsersChange = previousCountNewUsers ? calculatePercentageChange(latestCountNewUsers, previousCountNewUsers) : 'New data';

  // Calculate completed orders stats
  const completedOrdersMonths = Object.keys(sortedData); 

const latestCompletedOrdersMonth = completedOrdersMonths.pop() || '';  

// Correct way to access the value
const latestCountCompletedOrders = sortedData[latestCompletedOrdersMonth as keyof typeof sortedData] || 0; // Use the latest month to get the value
const previousCompletedOrdersMonth = completedOrdersMonths.pop() || '';
const previousCountCompletedOrders = sortedData[previousCompletedOrdersMonth as keyof typeof sortedData] || 0;

const completedOrdersChange = previousCountCompletedOrders
  ? calculatePercentageChange(latestCountCompletedOrders, previousCountCompletedOrders)
  : 'New data';

  // Update the state
  const data = [
    { 
      title: 'Page views', 
      stats: latestCountPageViews.toString(), 
      description: previousCountPageViews  && pageViewsChange!=='0%'
        ? `${pageViewsChange} compared to ${previousPageViewMonth}, ${latestCountPageViews} page views this month`
        : `Congratulations! ${latestCountPageViews} page views this month`
    },
    { 
      title: 'New users', 
      stats: latestCountNewUsers.toString(), 
      description: previousCountNewUsers && newUsersChange!=='0%'
        ? `${newUsersChange} compared to ${previousNewUsersMonth}, ${latestCountNewUsers} new users this month`
        : `Congratulations! ${latestCountNewUsers} new users this month`
    },
    { 
      title: 'Completed orders', 
      stats: latestCountCompletedOrders, 
      description: previousCountCompletedOrders && completedOrdersChange!=='0%'
        ? `${completedOrdersChange} from ${latestCompletedOrdersMonth} compared to ${previousCompletedOrdersMonth}, ${latestCountCompletedOrders} orders completed this month`
        : `Congratulations! ${latestCountCompletedOrders} orders completed this month`
    },
  ];

  return (
    <div className={classes.root}>
      {data.map(stat => (
        <div key={stat.title} className={classes.stat}>
          <Text className={classes.count}>{stat.stats}</Text>
          <Text className={classes.title}>{stat.title}</Text>
          <Text className={classes.description}>{stat.description}</Text>
        </div>
      ))}
    </div>
  );
}
