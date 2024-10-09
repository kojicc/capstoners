import React, { useEffect, useState } from 'react';
import { AppShell, Box, Burger, Divider, Group, NavLink, ScrollArea, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconGauge, IconHistory, IconEdit, IconTablePlus, IconUsers } from '@tabler/icons-react';
import TransactionHistory from '@/components/adminPage/Transactions/transactionsAdmin'; // Ensure this path is correct
import { Dashboard } from './dashboardMain';
import ProductAddPage from '@/components/adminPage/inventoryManagement/inventoryManagementTabs';
import { Header } from '../../LandingPage/header/HeaderLP';
import UserAccountsManage from '../manageUserAccounts/userAccountsManageTabs';
import { useRouter } from 'next/router';

export function NavbarSection() {
  const [opened, { toggle }] = useDisclosure();
  const [activeMain, setActiveMain] = useState('Dashboard');
  const [activeSub, setActiveSub] = useState('');

  const router = useRouter();

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
      label: 'Transactions',
      icon: IconHistory,
      component: <TransactionHistory />, // Component for Transactions
    },
    {
      label: 'Inventory Management',
      icon: IconHistory,
      component: <ProductAddPage />,
    },
    {
      label: 'Manage User Accounts',
      icon: IconHistory,
      component: <UserAccountsManage />,
    },
    {
      label: 'Go to Landing Page',
      icon: IconHistory,
      href: '/',
    },
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
        href={item.href}
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
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
      withBorder={true}
      layout="alt"
    >
      <AppShell.Header>
        <Group h="100%" mx={'auto'}>
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" pos={'absolute'} />
          {/* <Header /> */}
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
      </AppShell.Navbar>
      <AppShell.Main style={{ backgroundColor: '#2F5933' }}>{getComponent()}</AppShell.Main>
    </AppShell>
  );
}
