import { Button, Group, Paper, Popover, SimpleGrid } from '@mantine/core';
import React, { useState } from 'react';
import { StatsRing } from './dashboardStats/dashboardTab';
import { LineReservations } from './dashboardStats/lineReservations';
import { ProgressProducts } from './dashboardStats/progressbarProducts';
import { StatsGroup } from './dashboardStats/StatsGroup';
import axios from '../../../utils/axiosInstance';
import { notifications } from '@mantine/notifications';
import { DateTimePicker } from '@mantine/dates';

export function Dashboard() {
  const [popoverOpened, setPopoverOpened] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const handleExport = async () => {
    try {
      const response = await axios.get('exportData/', {
        responseType: 'blob',
        params: {
          start_date: startDate?.toISOString(),
          end_date: endDate?.toISOString(),
        },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'data.xlsx');
      document.body.appendChild(link);
      link.click();

      notifications.show({ message: 'Export successful!', color: 'green' });
    } catch (error) {
      notifications.show({ message: 'Export failed.', color: 'red' });
    }
  };
  return (
    <div>
      <Paper p="xl" shadow="xl" style={{ height: 'auto' }}>
        <SimpleGrid cols={1} spacing="lg">
          <StatsRing />
          <LineReservations />
          <ProgressProducts />
          <StatsGroup />
        </SimpleGrid>{' '}
        <Group justify="center" mt="xl">
          <Popover
            opened={popoverOpened}
            onClose={() => setPopoverOpened(false)}
            trapFocus
            position="bottom"
            withArrow
          >
            <Popover.Target>
              <Button onClick={() => setPopoverOpened(true)}>Export Data</Button>
            </Popover.Target>
            <Popover.Dropdown>
              <Group justify="column" gap="sm">
                <DateTimePicker label="Start Date" value={startDate} onChange={setStartDate} />
                <DateTimePicker label="End Date" value={endDate} onChange={setEndDate} />
                <Button onClick={handleExport}>Export</Button>
              </Group>
            </Popover.Dropdown>
          </Popover>
        </Group>
      </Paper>
    </div>
  );
}
