import {
  HoverCard,
  Group,
  Button,
  UnstyledButton,
  Text,
  SimpleGrid,
  ThemeIcon,
  Anchor,
  Divider,
  Center,
  Box,
  Burger,
  Drawer,
  Collapse,
  ScrollArea,
  rem,
  useMantineTheme,
  Menu,
  Modal,
  PasswordInput,
} from '@mantine/core';
import { useDisclosure, useHeadroom, useLocalStorage } from '@mantine/hooks';
import {
  IconNotification,
  IconCode,
  IconBook,
  IconChartPie3,
  IconFingerprint,
  IconCoin,
  IconChevronDown,
  IconArmchair2,
  IconGlass,
  IconGlassFullFilled,
  IconTemplate,
  IconHanger2,
  IconToolsKitchen2,
  IconSettings,
  IconLock,
  IconCalendar,
} from '@tabler/icons-react';
import classes from './HeaderMegaMenu.module.css';
import { useWindowScroll } from '@mantine/hooks';
import axios from '@/utils/axiosInstance';
import { useRouter } from 'next/router';
import axiosInstance from '@/utils/axiosInstance';
import { useContext, useEffect, useState } from 'react';
import { isLoggedIn, useAuth } from '@/utils/auth';
import Cookies from 'js-cookie';
import NotificationButton from '@/components/NotificationButton';
import { CartIcon } from '@/components/cartButton';
import useSWR from 'swr';
import { notifications } from '@mantine/notifications';

interface Category {
  categoryId: string;
  icon: any;
  title: string;
  description: string;
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export function Header() {
  const { username, role } = useAuth();
  const [isModalOpen, setModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const { data, error, isLoading } = useSWR('getCategories/', fetcher);
  const router = useRouter();
  const [mockdata, setMockdata] = useState<any[]>([]);

  const handleNavigation = (name: string, categoryId: string) => {
    router
      .push({
        pathname: '/reservationLandingPage',
        query: { searchQuery: `${name} - ${categoryId}` },
      })
      .then(() => {
        console.log('Navigation successful');
      })
      .catch((err) => {
        console.error('Navigation error:', err);
      });
  };

  useEffect(() => {
    if (error) {
      console.error('Error fetching categories:', error);
    }
    if (data) {
      const updatedMockdata = data.categories.slice(0, 6).map((category: any) => ({
        icon: IconGlass,
        title: category.name,
        description: category.description,
        categoryId: category.categoryId,
      }));

      setMockdata(updatedMockdata);
    }
  }, [data, error]);

  const [isAuthenticated, setIsAuthenticated] = useLocalStorage({
    key: 'isAuthenticated',
    defaultValue: false,
  });

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const loggedIn = await isLoggedIn();
        setIsAuthenticated(loggedIn);
      } catch (error) {
        console.error('Error checking login status:', error);
      }
    };

    checkLoginStatus();
  }, []);

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

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.post('forgetPassword/', {
        username,
        newPassword,
      });
      console.log('Password change response:', response.data);
      setModalOpen(false);
      notifications.show({
        title: 'Password changed',
        message: 'Your password has been successfully changed and you will be logged out.',
        color: 'teal',
      });
    } catch (error) {
      console.error('Password change error:', error);
    } finally {
      setLoading(false);
      handleLogout();
    }
  };

  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const [linksOpened, { toggle: toggleLinks }] = useDisclosure(false);

  const theme = useMantineTheme();
  IconHanger2;

  const links = mockdata.map((item) => (
    <UnstyledButton
      className={classes.subLink}
      key={item.title}
      component="a"
      onClick={() => handleNavigation(item.title, item.categoryId)}
    >
      <Group wrap="nowrap" align="flex-start">
        <ThemeIcon size={34} variant="default" radius="md">
          <item.icon style={{ width: rem(22), height: rem(22) }} color={theme.colors.blue[6]} />
        </ThemeIcon>
        <div>
          <Text size="sm" fw={500}>
            {item.title}
          </Text>
          <Text size="xs" c="dimmed">
            {item.description}
          </Text>
        </div>
      </Group>
    </UnstyledButton>
  ));

  const [scroll, scrollTo] = useWindowScroll();
  const pinned = useHeadroom({ fixedAt: 20 });

  const isScrolledPastThreshold = scroll.y < 20;

  return (
    <Box
      className={classes.box}
      style={{
        backgroundSize: 'cover',
        backgroundPosition: 'relative',
        backgroundBlendMode: 'color-burn',
      }}
    >
      <header
        className={classes.header}
        style={{
          transition: '0.7s ease',
          backgroundColor: isScrolledPastThreshold ? 'transparent' : '#592f55',
        }}
      >
        <Group justify="space-between" h="100%">
          <Text>
            <Anchor
              href="/"
              style={{ fontSize: 35, fontWeight: 700, color: 'white', paddingLeft: 60 }}
            >
              CTHM
            </Anchor>
            <span style={{ fontWeight: 700, color: '#f3c565', paddingRight: -100 }}>.</span>
          </Text>

          <Group h="100%" gap={0} visibleFrom="sm">
            <a href="/" className={classes.link}>
              Home
            </a>
            {username ? (
              role === 'admin' ? (
                <a href="" className={classes.link}>
                  Admin Dashboard
                </a>
              ) : (
                <Menu trigger="click-hover" withArrow position="bottom-start">
                  <Menu.Target>
                    <a className={classes.link} style={{ cursor: 'pointer' }}>
                      Support
                    </a>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<IconSettings size={14} />}
                      onClick={() => setModalOpen(true)}
                    >
                      Change Password
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconCalendar size={14} />}
                      onClick={() => router.push('transactionsUser')}
                    >
                      Transaction History
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              )
            ) : null}
            <HoverCard width={600} position="bottom" radius="md" shadow="md" withinPortal>
              <HoverCard.Target>
                <a href="reservationLandingPage" className={classes.link}>
                  <Center inline>
                    <Box component="span" mr={5}>
                      Equipments
                    </Box>
                    <IconChevronDown
                      style={{ width: rem(16), height: rem(16) }}
                      color={theme.colors.blue[6]}
                    />
                  </Center>
                </a>
              </HoverCard.Target>

              <HoverCard.Dropdown style={{ overflow: 'hidden' }}>
                <Group justify="space-between" px="md">
                  <Text fw={500}>Features</Text>
                  <Anchor href="reservationLandingPage" fz="xs">
                    View all
                  </Anchor>
                </Group>

                <Divider my="sm" />

                <SimpleGrid cols={2} spacing={0}>
                  {links}
                </SimpleGrid>

                <div className={classes.dropdownFooter}>
                  <Group justify="space-between">
                    <div>
                      <Text fw={500} fz="sm">
                        Get started
                      </Text>
                      <Text size="xs" c="dimmed">
                        Their food sources have decreased, and their numbers
                      </Text>
                    </div>
                    <Button variant="default">Get started</Button>
                  </Group>
                </div>
              </HoverCard.Dropdown>
            </HoverCard>
            <a
              href="https://portal.dlsud.edu.ph/mydlsud/Login.aspx?ReturnUrl=%2fmydlsud%2fStudent%2findex.aspx"
              className={classes.link}
            >
              DLSUD Portal
            </a>
          </Group>

          <Group visibleFrom="sm">
            {isAuthenticated ? (
              <>
                <Button
                  component="a"
                  onClick={handleLogout}
                  variant="outline"
                  color="white"
                  fw={700}
                  className={classes.btn}
                >
                  Logout
                </Button>
                <NotificationButton />
                <CartIcon />
              </>
            ) : (
              <>
                <Button
                  component="a"
                  href="login/"
                  variant="outline"
                  color="white"
                  fw={700}
                  className={classes.btn}
                >
                  Login
                </Button>
              </>
            )}
          </Group>

          <Burger opened={drawerOpened} onClick={toggleDrawer} hiddenFrom="sm" />
        </Group>
      </header>

      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        size="100%"
        padding="md"
        title="Navigation"
        hiddenFrom="sm"
        zIndex={1000000}
        className={classes.drawer}
      >
        <ScrollArea h={`calc(100vh - ${rem(80)})`} mx="-md">
          <Divider my="sm" />

          <a href="/" className={classes.link}>
            Home
          </a>
          <UnstyledButton className={classes.link} onClick={toggleLinks}>
            <Center inline>
              <Box component="span" mr={5}>
                Features
              </Box>
              <IconChevronDown
                style={{ width: rem(16), height: rem(16) }}
                color={theme.colors.blue[6]}
              />
            </Center>
          </UnstyledButton>
          <Collapse ml={50} in={linksOpened}>
            {links}
          </Collapse>
          <a href="#" className={classes.link}>
            Learn
          </a>
          <a href="#" className={classes.link}>
            Academy
          </a>

          <Divider my="sm" />

          <Group justify="center" grow pb="xl" px="md">
            <Button variant="default">Log in</Button>
            <Button>Sign up</Button>
          </Group>
        </ScrollArea>
      </Drawer>

      <Modal
        opened={isModalOpen}
        onClose={() => setModalOpen(false)}
        title="Change Password"
        centered
      >
        <PasswordInput
          label="New Password"
          placeholder="Enter your new password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.currentTarget.value)}
          required
        />
        <PasswordInput
          label="Confirm New Password"
          autoComplete="new-password"
          placeholder="Confirm your new password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.currentTarget.value)}
          required
          error={passwordError}
        />
        <Group justify="right" mt="md">
          <Button onClick={handlePasswordChange} loading={loading}>
            Change Password
          </Button>
        </Group>
      </Modal>
    </Box>
  );
}
