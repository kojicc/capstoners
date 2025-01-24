import { Button, Group, Paper, Popover, SimpleGrid, Select } from '@mantine/core';
import React, { useState } from 'react';
import { StatsRing } from './dashboardStats/StatsRing';
import { LineReservations } from './dashboardStats/lineReservations';
import { ProgressProducts } from './dashboardStats/progressbarProducts';
import { StatsGroup } from './dashboardStats/StatsGroup';
import axios from '../../../utils/axiosInstance';
import { notifications } from '@mantine/notifications';
import { DateTimePicker } from '@mantine/dates';

export function Dashboard() {
  const [period, setPeriod] = useState('all');
  return (
    <div>
      <Paper p="xl" shadow="xl" style={{ height: 'auto' }}>
        <Select
          label="Time Period"
          value={period}
          onChange={(value) => setPeriod(value || 'all')}
          data={[
            { value: 'all', label: 'All Time' },
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
            { value: 'annually', label: 'Annually' },
          ]}
          mb="md"
        />
        <SimpleGrid cols={1} spacing="lg">
          <StatsRing period={period} />
          <LineReservations period={period} />
          {/* <ProgressProducts period={period} /> */}
          <StatsGroup period={period} />
        </SimpleGrid>
      </Paper>
    </div>
  );
}
