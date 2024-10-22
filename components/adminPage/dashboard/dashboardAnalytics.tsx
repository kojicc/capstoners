import { Paper, SimpleGrid } from '@mantine/core';
import React from 'react';
import { StatsRing } from './dashboardStats/dashboardTab';
import { LineReservations } from './dashboardStats/lineReservations';
import { ProgressProducts } from './dashboardStats/progressbarProducts';
import { StatsGroup } from './dashboardStats/StatsGroup';

export function Dashboard() {
  return (
    <div>
      <Paper p="xl" shadow="xl" style={{ height: 'auto' }}>
        <SimpleGrid cols={1} spacing="lg">
          <StatsRing />
          <LineReservations />
          <ProgressProducts />
          <StatsGroup />
        </SimpleGrid>{' '}
      </Paper>
    </div>
  );
}
