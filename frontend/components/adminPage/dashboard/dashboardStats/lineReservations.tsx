import { LineChart } from '@mantine/charts';
import { LoadingOverlay, Paper, Title, Text} from '@mantine/core';
import useSWR from 'swr';
import axios from '@/utils/axiosInstance';
import { useEffect, useState } from 'react';

interface MonthlyData {
  [month: string]: number;
}

interface MonthlyDataWithTotal {
  sorted: MonthlyData;
  total: number;
}

interface CompletedOrdersData {
  sorted: { [key: string]: number };
  total: number;
  period: 'daily' | 'weekly' | 'monthly' | 'annually' | 'all';
}
const dataReserved: { date: string; reservations: number }[] = [];

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export function LineReservations({ period }: { period: string }) {
  const { data: dashboardStats, error } = useSWR(`dashboard-stats/?period=${period}`, fetcher);

  if (error) return <div>Error loading data</div>;
  if (!dashboardStats) return <LoadingOverlay visible={true} />;

  const completedOrders = dashboardStats?.completed_orders as CompletedOrdersData;

  // Transform data for chart
  const formattedData = Object.entries(completedOrders?.sorted || {}).map(([key, value]) => ({
    date: key,
    reservations: value,
  }));

  const yMax = Math.max(...formattedData.map(d => d.reservations), 5);

  return (
    <Paper withBorder p="xl" shadow="xl" style={{ height: 'auto' }}>
      <Title order={2} mb="md">Completed Reservations</Title>
      <LineChart
        h={300}
        data={formattedData}
        series={[{ name: 'reservations', label: 'Total Reservations' }]}
        dataKey="date"
        type="gradient"
        gradientStops={[
          { offset: 0, color: 'red.6' },
          { offset: 20, color: 'orange.6' },
          { offset: 40, color: 'yellow.5' },
          { offset: 70, color: 'lime.5' },
          { offset: 80, color: 'cyan.5' },
          { offset: 100, color: 'blue.5' },
        ]}
        strokeWidth={3}
        curveType="monotone"
        yAxisProps={{
          domain: [0, yMax + Math.ceil(yMax * 0.1)],
          tickCount: 5,
        }}
        xAxisProps={{
          angle: period === 'monthly' ? -45 : 0,
        }}
        tooltipProps={{
          content: ({ payload }) => {
            if (payload && payload.length > 0) {
              return (
                <Paper p="xs" withBorder>
                  <Text size="sm">{`${payload[0].payload.date}: ${payload[0].value} reservations`}</Text>
                </Paper>
              );
            }
            return null;
          },
        }}
      />
    </Paper>
  );
}