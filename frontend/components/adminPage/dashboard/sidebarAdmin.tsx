import React, { useEffect, useState } from 'react';
import {
  AppShell,
  Box,
  Burger,
  Button,
  Divider,
  Flex,
  Grid,
  Group,
  NavLink,
  Popover,
  ScrollArea,
  Select,
  Stack,
  Title,
  Text,
} from '@mantine/core';
import { useDisclosure, useLocalStorage } from '@mantine/hooks';
import {
  IconGauge,
  IconHistory,
  IconEdit,
  IconTablePlus,
  IconUsers,
  IconHomeFilled,
  IconCloudDownload,
  IconFilter,
  IconCalendar,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import TransactionHistory from '@/components/adminPage/Transactions/transactionsAdmin'; // Ensure this path is correct
import { Dashboard } from './dashboardAnalytics';
import ProductAddPage from '@/components/adminPage/inventoryManagement/inventoryManagementTabs';
import UserAccountsManage from '../manageUserAccounts/userAccountsManageTabs';
import { useRouter } from 'next/router';
import ClassroomCrud from '../classManagement/classCrud';
import NotificationButton from '@/components/NotificationButton';
import { CartIcon } from '@/components/cartButtonComponent/cartButton';
import axiosInstance from '@/utils/axiosInstance';
import Cookies from 'js-cookie';
import { useAuth } from '@/utils/auth';
import { ColorSchemeToggle } from '@/components/ColorSchemeToggle/ColorSchemeToggle';
import { ActionToggle } from '@/components/darkorlightMode';
import { DateTimePicker } from '@mantine/dates';
import axios from '@/utils/axiosInstance';
import { notifications } from '@mantine/notifications';

export function NavbarSection() {
  const [popoverOpened, setPopoverOpened] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [period, setPeriod] = useState<string | null>('all');
  const [buttonLoading, setButtonLoading] = useState(false);
  const [opened, { toggle }] = useDisclosure();
  const [activeMain, setActiveMain] = useState('Dashboard');
  const [activeSub, setActiveSub] = useState('');
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const [isAuthenticated, setIsAuthenticated] = useLocalStorage({
    key: 'isAuthenticated',
    defaultValue: false,
  });
  const { username, role } = useAuth();
  const [exportLoading, setExportLoading] = useState(false);
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);

  // Update the period onChange handler
  const handlePeriodChange = (value: string | null) => {
    setPeriod(value);
    setShowCustomDateRange(value === 'custom');
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);
      notifications.show({
        id: 'export-progress',
        loading: true,
        title: 'Exporting Data',
        message: 'Preparing your data file, please wait...',
        autoClose: false,
        withCloseButton: false,
      });

      // Only include date parameters if custom range is selected
      const params: any = {
        period: period,
      };

      if (showCustomDateRange) {
        params.start_date = startDate?.toISOString();
        params.end_date = endDate?.toISOString();
      }

      const response = await axios.get('exportData/', {
        responseType: 'blob',
        params,
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // Use current date as part of filename if not provided by server
      const date = new Date().toISOString().split('T')[0];
      const filename = `Reservoia_Export_${date}.xlsx`;
      link.setAttribute('download', filename);

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Update notification to success
      notifications.update({
        id: 'export-progress',
        color: 'green',
        title: 'Export Successful',
        message: `Your data has been exported as ${filename}`,
        icon: <IconCheck size="1.2rem" />,
        autoClose: 5000,
      });

      setPopoverOpened(false); // Close the popover after export
    } catch (error) {
      console.error('Export error:', error);
      // Update notification to error
      notifications.update({
        id: 'export-progress',
        color: 'red',
        title: 'Export Failed',
        message: 'There was an error exporting your data. Please try again.',
        icon: <IconX size="1.2rem" />,
        autoClose: 5000,
      });
    } finally {
      setExportLoading(false);
    }
  };

  const router = useRouter();
  const handleLogout = async () => {
    try {
      const response = await axiosInstance.get('logout/');
      setIsAuthenticated(false);
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
      Cookies.remove('Role');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    // If searchQuery is present, set Transactions as the active component
    if (router.query.searchQuery) {
      setActiveMain('Transactions');
    }
  }, [router.query.searchQuery]);

  const nestedLinks = [
    {
      label: 'Dashboard',
      icon: IconGauge,
      component: <Dashboard />, // Component for Dashboard
    },
    // {
    //   label: 'Classroom Management',
    //   icon: IconEdit,
    //   component: <ClassroomCrud />,
    // },
    {
      label: 'Transactions',
      icon: IconHistory,
      component: <TransactionHistory />, // Component for Transactions
    },
    {
      label: 'Inventory Management',
      icon: IconTablePlus,
      component: <ProductAddPage />,
    },
    {
      label: 'Manage User Accounts',
      icon: IconUsers,
      component: <UserAccountsManage />,
    },
    // {
    //   label: 'Go to Landing Page',
    //   icon: IconGauge,
    //   href: '/',
    // },
  ];

  const handleMainClick = (label: React.SetStateAction<string>) => {
    setActiveMain(label);
    setActiveSub('');
  };

  // const getComponent = () => {
  //   const activeMainItem = nestedLinks.find((item) => item.label === activeMain);
  //   if (activeMainItem && activeMainItem.links) {
  //     const activeSubItem = activeMainItem.links.find((subItem) => subItem.label === activeSub);
  //     return activeSubItem ? activeSubItem.component : activeMainItem.component;
  //   }
  //   return activeMainItem ? activeMainItem.component : null;
  // };

  const getComponent = () => {
    const activeMainItem = nestedLinks.find((item) => item.label === activeMain);
    if (activeMainItem) {
      return activeMainItem ? activeMainItem.component : null;
    }
  };

  const items = nestedLinks.map((item) => (
    <React.Fragment key={item.label}>
      <NavLink
        w={'100%'}
        // href={item.href}
        active={activeMain === item.label}
        label={item.label}
        leftSection={<item.icon size="1rem" stroke={1.5} />}
        onClick={() => handleMainClick(item.label)} // Update active main item
      ></NavLink>
      {/* <NavLink
        w={'100%'}
        href="#required-for-focus"
        active={activeMain === item.label}
        label={item.label}
        leftSection={<item.icon size="1rem" stroke={1.5} />}
        onClick={() => handleMainClick(item.label)} // Update active main item
      >
        {item.links &&
          item.links.map((subItem) => (
            <NavLink
              key={subItem.label}
              label={subItem.label}
              onClick={() => handleSubClick(subItem)} // Update active subitem
              childrenOffset={28}
            />
          ))}
      </NavLink> */}
      <Divider my="md" />
    </React.Fragment>
  ));

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding="md"
      withBorder={true}
    >
      <AppShell.Header bg={'#592f55'}>
        {' '}
        <Group pt={10} justify="flex-end" mr={30}>
          <Burger
            pl={10}
            opened={mobileOpened}
            onClick={toggleMobile}
            hiddenFrom="sm"
            size="md"
            color="white"
            mr={'auto'}
          />
          <Burger
            pl={10}
            opened={desktopOpened}
            onClick={toggleDesktop}
            visibleFrom="sm"
            size="md"
            color="white"
            mr={'auto'}
          />
          {/* <Header /> */}
          <Title order={1} size="xl" c="white">
            Welcome {username}!
          </Title>

          <Group visibleFrom="sm">
            <Button
              component="a"
              onClick={handleLogout}
              variant="outline"
              color="white"
              fw={700}
              // className={classes.btn}
            >
              Logout
            </Button>
            <NotificationButton />
            <CartIcon />
            <ActionToggle />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md" m={'auto'}>
        <AppShell.Section grow my="md" component={ScrollArea}>
          <Title pb={'lg'} order={2}>
            Admin Dashboard
          </Title>
          <Box pt={'lg'} w={'100%'}>
            {items}
          </Box>
        </AppShell.Section>
        <AppShell.Section>
          <Divider my="md" />

          <Stack justify="center" mt="xl">
            <NavLink
              w={'100%'}
              href="/"
              label="Go to Landing Page"
              leftSection={<IconHomeFilled size="1rem" stroke={1.5} />}
            />
            <Popover
              opened={popoverOpened}
              onClose={() => !exportLoading && setPopoverOpened(false)}
              trapFocus
              closeOnEscape={false}
              closeOnClickOutside={false}
              position="bottom"
              withArrow
              shadow="lg"
              radius="md"
            >
              <Popover.Target>
                <Button
                  onClick={() => setPopoverOpened((o) => !o)}
                  leftSection={<IconCloudDownload size="1.2rem" />}
                  color="blue"
                >
                  Export Data
                </Button>
              </Popover.Target>
              <Popover.Dropdown
                onClick={(e) => e.stopPropagation()}
                p="lg"
                style={{ minWidth: '450px' }}
              >
                <Stack gap="md">
                  <Title order={4}>Export Analytics Data</Title>
                  <Text size="sm" color="dimmed">
                    Choose export options for your data
                  </Text>

                  <Select
                    label="Time Period"
                    placeholder="Select data period"
                    value={period}
                    onChange={handlePeriodChange}
                    data={[
                      { value: 'daily', label: 'Daily View' },
                      { value: 'weekly', label: 'Weekly View' },
                      { value: 'monthly', label: 'Monthly View' },
                      { value: 'annually', label: 'Annual View' },
                      { value: 'custom', label: 'Custom Date Range' },
                      { value: 'all', label: 'All Time Data' },
                    ]}
                    leftSection={<IconFilter size="1rem" />}
                  />

                  {showCustomDateRange && (
                    <Stack gap="xs" mb="md">
                      <Text size="sm" w={500}>
                        Custom Date Range
                      </Text>
                      <Group grow>
                        <DateTimePicker
                          label="Start Date"
                          placeholder="Select start date"
                          value={startDate}
                          onChange={setStartDate}
                          dropdownType="modal"
                          leftSection={<IconCalendar size="1rem" />}
                          clearable
                          required
                        />
                        <DateTimePicker
                          label="End Date"
                          placeholder="Select end date"
                          value={endDate}
                          onChange={setEndDate}
                          dropdownType="modal"
                          leftSection={<IconCalendar size="1rem" />}
                          clearable
                          minDate={startDate || undefined}
                          required
                        />
                      </Group>
                    </Stack>
                  )}

                  <Text size="xs" color="dimmed" mt="sm">
                    Data will be exported in Excel format containing page views, reservations,
                    product information, and user statistics.
                  </Text>

                  <Group justify="right" gap="sm" mt="md">
                    <Button
                      variant="default"
                      onClick={() => setPopoverOpened(false)}
                      disabled={exportLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleExport}
                      loading={exportLoading}
                      disabled={exportLoading || (showCustomDateRange && (!startDate || !endDate))}
                      color="blue"
                      leftSection={<IconCloudDownload size="1rem" />}
                    >
                      {exportLoading ? 'Exporting...' : 'Export Data'}
                    </Button>
                  </Group>
                </Stack>
              </Popover.Dropdown>
            </Popover>
          </Stack>
          <Divider my="md" />
        </AppShell.Section>
        <AppShell.Section hiddenFrom="sm">
          <Divider my="md" />
          <Group justify="flex-end">
            <Title order={1} size="xl" mr={'auto'}>
              Welcome {username}!
            </Title>

            <Button component="a" onClick={handleLogout} variant="outline" color="dark" fw={700}>
              Logout
            </Button>
            <NotificationButton />
            <CartIcon />
            <ActionToggle />
          </Group>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main style={{ backgroundColor: '#2F4059' }}>{getComponent()}</AppShell.Main>
    </AppShell>
  );
}
