import React, { useEffect, useState } from 'react';
import {
  AppShell,
  Box,
  Burger,
  Button,
  Divider,
  Grid,
  Group,
  NavLink,
  ScrollArea,
  Title,
} from '@mantine/core';
import { useDisclosure, useLocalStorage } from '@mantine/hooks';
import { IconGauge, IconHistory, IconEdit, IconTablePlus, IconUsers } from '@tabler/icons-react';
import TransactionHistory from '@/components/adminPage/Transactions/transactionsAdmin'; // Ensure this path is correct
import { Dashboard } from './dashboardMain';
import ProductAddPage from '@/components/adminPage/inventoryManagement/inventoryManagementTabs';
import { Header } from '../../LandingPage/header/HeaderLP';
import UserAccountsManage from '../manageUserAccounts/userAccountsManageTabs';
import { useRouter } from 'next/router';
import ClassroomCrud from '../classManagement/classCrud';
import NotificationButton from '@/components/NotificationButton';
import { CartIcon } from '@/components/cartButton';
import axiosInstance from '@/utils/axiosInstance';
import Cookies from 'js-cookie';
import { useAuth } from '@/utils/auth';
import { ColorSchemeToggle } from '@/components/ColorSchemeToggle/ColorSchemeToggle';
import { ActionToggle } from '@/components/darkorlightMode';

export function NavbarSection() {
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
    {
      label: 'Classroom Management',
      icon: IconEdit,
      component: <ClassroomCrud />,
    },
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
      layout="alt"
    >
      <AppShell.Header bg={'#592f55'}>
        <Grid h="100%">
          <Grid.Col span={6}>
            {' '}
            <Burger
              pl={10}
              pt={25}
              opened={mobileOpened}
              onClick={toggleMobile}
              hiddenFrom="sm"
              size="md"
              color="white"
            />
            <Burger
              pl={10}
              pt={25}
              opened={desktopOpened}
              onClick={toggleDesktop}
              visibleFrom="sm"
              size="md"
              color="white"
            />
          </Grid.Col>

          {/* <Header /> */}

          <Grid.Col span={6}>
            <Group justify="flex-end" pt={10} mr={30}>
              <Title order={1} size="xl" c="white">
                Welcome {username}!
              </Title>
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
          </Grid.Col>
        </Grid>
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
          <NavLink
            w={'100%'}
            href="/"
            label="Go to Landing Page"
            leftSection={<IconGauge size="1rem" stroke={1.5} />}
          />
        </AppShell.Section>
      </AppShell.Navbar>
      <AppShell.Main style={{ backgroundColor: '#2F4059' }}>{getComponent()}</AppShell.Main>
    </AppShell>
  );
}
