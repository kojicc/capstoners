import { LineChart } from '@mantine/charts';
import { Paper } from '@mantine/core';
import useSWR from 'swr';
import axios from '@/utils/axiosInstance';
import { use, useEffect, useState } from 'react';


interface MonthlyData {
  [month: string]: number;
}

interface MonthlyDataWithTotal {
  sorted: MonthlyData;
  total: number;
}
const dataReserved:  { date: string; reservations: number; }[] = [];

  const fetcher = (url: string) => axios.get(url).then(res => res.data);

export function LineReservations() {
  const { data:completedOrdersData, error:completedOrdersDataError } = useSWR<MonthlyDataWithTotal>('total-completed-orders/', fetcher, { refreshInterval: 1000 });

  if(completedOrdersDataError ){
    return <div>Error loading data</div>;
  }

  if (!completedOrdersData) {
    return null;
  }
  const total = completedOrdersData.total;
  const sortedData = completedOrdersData.sorted;
  
  // Transform sortedData to the format required for dataReserved
  const formattedData = Object.keys(sortedData).map(month => ({
    date: month,
    reservations: sortedData[month],
  }));

  // const completedOrdersMonths = Object.keys(completedOrdersData ?? {});
  // console.log("useSWR data",completedOrdersMonths);
// const data = Object.keys(completedOrdersData);

//   data.forEach((key) => {
//     dataReserved.push({ date: key, reservations: completedOrdersData
//     [key] });
//   }
  

  console.log("dataReserved",dataReserved);
  return (
    <Paper p="xl" shadow="xl" style={{ height: 'auto' }}>

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
      strokeWidth={5}
      curveType="natural"
      yAxisProps={{ domain: [0, total] }}
      valueFormatter={(value) => `${value}`}
    />
    </Paper>
  );
}