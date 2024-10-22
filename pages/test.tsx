'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import axiosInstance from '@/utils/axiosInstance';
import {
  Container,
  Title,
  Paper,
  Text,
  Group,
  ActionIcon,
  Badge,
  Stack,
  Box,
  useMantineTheme,
} from '@mantine/core';
import { IconCheck, IconTrash, IconBellRinging } from '@tabler/icons-react';
import { Header } from '@/components/LandingPage/header/HeaderLP';

const fetcher = (url: string) => axiosInstance.get(url).then((res) => res.data);

interface Notification {
  id: number;
  message: string;
  timestamp: string;
  read: boolean;
  checked: boolean;
  full_name: string | null;
}
export default function ElegantNotifications() {
  const theme = useMantineTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const { data, error, isLoading } = useSWR('showNotification/', fetcher, {
    refreshInterval: 5000, // Poll every 5 seconds
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    onSuccess: (fetchedNotifications: { notifications: Notification[]; unread_count: number }) => {
      console.log('API Response:', fetchedNotifications); // Log raw response
      const { notifications, unread_count } = fetchedNotifications;
      setNotifications(notifications);
      setUnreadCount(unread_count);
    },
  });

  useEffect(() => {
    if (data) {
      console.log('Fetched Data:', data);
    }
    if (error) {
      console.error('Error fetching data:', error);
    }
  }, [data, error]);

  const markAsRead = async (id: number) => {
    try {
      await axiosInstance.post('mark_as_read/', { id });
      setNotifications((prevNotifications) =>
        prevNotifications.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
      );
      setUnreadCount((prevCount) => prevCount - 1);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter((notif) => notif.id !== id));
  };

  return (
    <>
      <Header />
      <Container size="sm" py="xl">
        <Paper shadow="md" radius="lg" p="md" withBorder mt={60}>
          <Group justify="apart" mb="lg">
            <Group>
              <IconBellRinging size={28} stroke={1.5} color={theme.colors.blue[6]} />
              <Title order={2}>Notifications</Title>
            </Group>
            <Badge size="lg" radius="xl" variant="dot" color="blue">
              {unreadCount} New
            </Badge>
          </Group>
          <Stack gap="xs">
            {isLoading ? (
              <Text>Loading...</Text>
            ) : error ? (
              <Text>Error loading notifications.</Text>
            ) : notifications.length === 0 ? (
              <Text>No notifications available.</Text>
            ) : (
              notifications.map((notification) => (
                <Paper key={notification.id} shadow="sm" radius="md" p="md" withBorder>
                  <Group justify="apart" mb="xs">
                    <Text w={600} size="sm" color={notification.read ? 'dimmed' : 'dark'}>
                      {notification.id}
                    </Text>
                    <Text size="xs" color="dimmed">
                      {notification.timestamp}
                    </Text>
                  </Group>
                  <Text size="sm" color={notification.read ? 'dimmed' : 'dark'} mb="sm">
                    {notification.message}
                  </Text>
                  <Group justify="right" gap="xs">
                    {!notification.read && (
                      <ActionIcon
                        variant="light"
                        color="blue"
                        onClick={() => markAsRead(notification.id)}
                        title="Mark as read"
                      >
                        <IconCheck size={16} />
                      </ActionIcon>
                    )}
                    <ActionIcon
                      variant="light"
                      color="red"
                      onClick={() => deleteNotification(notification.id)}
                      title="Delete notification"
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Paper>
              ))
            )}
          </Stack>
        </Paper>
      </Container>
    </>
  );
}
