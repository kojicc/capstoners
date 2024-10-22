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
  Popover,
  Progress,
} from '@mantine/core';
import { useDisclosure, useHeadroom, useLocalStorage } from '@mantine/hooks';
import { IconChevronDown, IconHanger2, IconSettings, IconCalendar } from '@tabler/icons-react';
import * as Icons from '@tabler/icons-react'; // Import all icons
import classes from './HeaderMegaMenu.module.css';
import { useWindowScroll } from '@mantine/hooks';
import axios from '@/utils/axiosInstance';
import { useRouter } from 'next/router';
import axiosInstance from '@/utils/axiosInstance';
import { useEffect, useState } from 'react';
import { isLoggedIn, useAuth } from '@/utils/auth';
import Cookies from 'js-cookie';
import NotificationButton from '@/components/NotificationButton';
import { CartIcon } from '@/components/cartButton';
import useSWR from 'swr';
import { notifications } from '@mantine/notifications';
import { ActionToggle } from '@/components/darkorlightMode';
import { IconCheck, IconX } from '@tabler/icons-react';

const requirements = [
  { re: /[0-9]/, label: 'Includes number' },
  { re: /[a-z]/, label: 'Includes lowercase letter' },
  { re: /[A-Z]/, label: 'Includes uppercase letter' },
  { re: /[$&+,:;=?@#|'<>.^*()%!-]/, label: 'Includes special symbol' },
];

function getStrength(password: string) {
  let multiplier = 1;

  // Check if the password length is greater than 5
  if (password.length > 5) {
    multiplier = 0;
  }

  // Check each requirement and adjust the multiplier
  requirements.forEach((requirement) => {
    if (!requirement.re.test(password)) {
      multiplier += 1;
    }
  });

  return Math.max(100 - (100 / (requirements.length + 1)) * multiplier, 10);
}

function PasswordRequirement({ meets, label }: { meets: boolean; label: string }) {
  return (
    <Text
      color={meets ? 'teal' : 'red'}
      style={{ display: 'flex', alignItems: 'center' }}
      mt={7}
      size="sm"
    >
      {meets ? (
        <IconCheck style={{ width: 14, height: 14 }} />
      ) : (
        <IconX style={{ width: 14, height: 14 }} />
      )}
      <Box ml={10}>{label}</Box>
    </Text>
  );
}
interface Category {
  categoryId: string;
  icon: any;
  title: string;
  description: string;
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export function Header() {
  // #region useStates
  const { username, role } = useAuth();
  const [isModalOpen, setModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const [linksOpened, { toggle: toggleLinks }] = useDisclosure(false);
  const [popoverOpened, setPopoverOpened] = useState(false);

  const theme = useMantineTheme();

  const { data, error, isLoading } = useSWR('getCategories/', fetcher);
  const router = useRouter();
  const [mockdata, setMockdata] = useState<any[]>([]);
  const [strength, setStrength] = useState(0);
  const [meetsRequirements, setMeetsRequirements] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(false);

  //#endregion

  useEffect(() => {
    const strength = getStrength(newPassword);
    setStrength(strength);
    setMeetsRequirements(
      newPassword.length > 5 &&
        requirements.every((requirement) => requirement.re.test(newPassword))
    );
    setPasswordsMatch(newPassword === confirmPassword);
  }, [newPassword, confirmPassword]);

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
      const updatedMockdata = data.categories.slice(0, 6).map(async (category: any) => {
        const IconComponent = (await import(`@tabler/icons-react`))[
          category.icon as keyof typeof Icons
        ];
        return {
          icon: IconComponent,
          title: category.name,
          description: category.description,
          categoryId: category.categoryId,
        };
      });

      Promise.all(updatedMockdata).then(setMockdata);
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
                <a href="adminDashboard" className={classes.link}>
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
                        Explore Equipment
                      </Text>
                      <Text size="xs" c="dimmed">
                        Discover a wide range of equipment available for your needs
                      </Text>
                    </div>
                    <Button variant="default" component="a" href="reservationLandingPage">
                      Get started
                    </Button>
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

            <ActionToggle />
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
        <Popover
          opened={popoverOpened}
          position="bottom"
          width="target"
          transitionProps={{ transition: 'pop' }}
        >
          <Popover.Target>
            <div
              onFocusCapture={() => setPopoverOpened(true)}
              onBlurCapture={() => setPopoverOpened(false)}
            >
              <PasswordInput
                data-autofocus
                label="New Password"
                placeholder="Enter your new password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.currentTarget.value)}
                required
              />
            </div>
          </Popover.Target>
          <Popover.Dropdown>
            <Progress color={strength === 100 ? 'teal' : 'red'} value={strength} size={5} mb="xs" />
            <PasswordRequirement
              label="Includes at least 6 characters"
              meets={newPassword.length > 5}
            />
            {requirements.map((requirement, index) => (
              <PasswordRequirement
                key={index}
                label={requirement.label}
                meets={requirement.re.test(newPassword)}
              />
            ))}
          </Popover.Dropdown>
        </Popover>
        <PasswordInput
          label="Confirm New Password"
          autoComplete="new-password"
          placeholder="Confirm your new password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.currentTarget.value)}
          required
          error={passwordError}
        />
        {!passwordsMatch && confirmPassword.length > 0 && (
          <Text color="red" size="sm">
            Passwords do not match
          </Text>
        )}
        <Group justify="right" mt="md">
          <Button
            onClick={handlePasswordChange}
            loading={loading}
            disabled={!meetsRequirements || !passwordsMatch}
          >
            Change Password
          </Button>
        </Group>
      </Modal>
    </Box>
  );
}
