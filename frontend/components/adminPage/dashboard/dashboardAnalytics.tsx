import { Button, Group, Paper, Popover, SimpleGrid, Select } from '@mantine/core';
import React, { useState } from 'react';
import { StatsRing } from './dashboardStats/dashboardTab';
import { LineReservations } from './dashboardStats/lineReservations';
import { ProgressProducts } from './dashboardStats/progressbarProducts';
import { StatsGroup } from './dashboardStats/StatsGroup';
import axios from '../../../utils/axiosInstance';
import { notifications } from '@mantine/notifications';
import { DateTimePicker } from '@mantine/dates';

export function Dashboard() {
  return (
    <div>
      <Paper p="xl" shadow="xl" style={{ height: 'auto' }}>
        <SimpleGrid cols={1} spacing="lg">
          <StatsRing />
          <LineReservations />
          <ProgressProducts />
          <StatsGroup />
        </SimpleGrid>
      </Paper>
    </div>
  );
}
