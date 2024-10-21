import React, { useState } from 'react';
import useSWR from 'swr';
import axiosInstance from '@/utils/axiosInstance';
import { Menu, Checkbox, Text, ActionIcon, MenuDivider, Pagination, Center } from '@mantine/core';
import { IconBell } from '@tabler/icons-react';
import moment from 'moment';
import { modals } from '@mantine/modals';
import { useRouter } from 'next/router';
import { useClickOutside } from '@mantine/hooks';
import { useAuth } from '@/utils/auth';

interface Notification {
  id: number;
  message: string;
  timestamp: string;
  read: boolean;
  checked: boolean;
  full_name: string | null;
}

const fetcher = (url: string) => axiosInstance.get(url).then((res) => res.data);

const chunk = <T,>(array: T[], size: number): T[][] => {
  if (!array.length) {
    return [];
  }
  const head = array.slice(0, size);
  const tail = array.slice(size);
  return [head, ...chunk(tail, size)];
};

const NotificationButton = () => {
  // #region useState
  const { username, role } = useAuth();

  const [notificationsList, setNotificationsList] = useState<Notification[]>([]);
  const [lastTimestamp, setLastTimestamp] = useState<string | null>(null);
  const [opened, setOpened] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [activePage, setPage] = useState(1);
  const ref = useClickOutside(() => setOpened(false));
  //#endregion

  interface FetchedNotifications {
    notifications: Notification[];
    unread_count: number;
  }

  const { data, error, isLoading } = useSWR('showNotification/', fetcher, {
    refreshInterval: 5000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    onSuccess: (fetchedNotifications: FetchedNotifications) => {
      const { notifications, unread_count } = fetchedNotifications;
      setLastTimestamp(notifications.length > 0 ? notifications[0].timestamp : null);
      setNotificationsList(
        notifications.map((notification) => ({
          ...notification,
          checked: notification.read,
        }))
      );
      setUnreadCount(unread_count);
    },
  });

  const markAsRead = async (notificationId: number) => {
    try {
      await axiosInstance.post('mark_as_read/', { id: notificationId });
      setNotificationsList((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true, checked: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const router = useRouter();

  const openModal = (notification: Notification) => {
    modals.openConfirmModal({
      title: `Reservation update from ${notification.full_name}`,
      size: 'sm',
      radius: 'md',
      withCloseButton: true,
      children: <Text size="sm">{notification.message}</Text>,
      labels: { confirm: 'Confirm', cancel: 'Cancel' },
      onCancel: () => {
        // No action on cancel
      },
      onConfirm: () => {
        const reservationId = extractReservationId(notification.message);
        router.push({
          pathname: username && role === 'admin' ? '/adminDashboard' : '/transactionsUser',
          query: { searchQuery: reservationId },
        });
      },
    });

    markAsRead(notification.id);
  };

  const extractReservationId = (message: string): string => {
    const regex1 = /Reservation\s(\d+_\d{2}-\d{2}-\d{4}-\d{2}_\w+)/;
    const regex2 = /Your reservation\s(\w+_\d{2}-\d{2}-\d{4}-\d{2}_\w+)/;
    const regex3 = /New reservation\s(\w+_\d{2}-\d{2}-\d{4}-\d{2}_\w+)/;

    const match1 = message.match(regex1);
    const match2 = message.match(regex2);
    const match3 = message.match(regex3);
    console.log('Matches', match1, match2, match3);

    if (match1) {
      return match1[1];
    } else if (match2) {
      return match2[1];
    } else if (match3) {
      return match3[1];
    } else {
      return '';
    }
  };

  const toggleMenu = () => {
    setOpened((prevOpened) => !prevOpened);
  };

  const paginatedNotifications = chunk(notificationsList, 5);
  const currentNotifications = paginatedNotifications[activePage - 1] || [];

  return (
    <Menu opened={opened} shadow="md" width={300}>
      <Menu.Target>
        <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
          <ActionIcon variant="outline" size={'lg'} onClick={toggleMenu}>
            <IconBell size={24} />
          </ActionIcon>
          {unreadCount > 0 && (
            <Text
              size="xs"
              style={{
                position: 'absolute',
                top: -10,
                right: -10,
                backgroundColor: 'red',
                borderRadius: '50%',
                width: 20,
                height: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
              }}
            >
              {unreadCount}
            </Text>
          )}
        </div>
      </Menu.Target>

      <Menu.Dropdown ref={ref}>
        <Menu.Label>Latest Notifications</Menu.Label>
        <MenuDivider />
        {isLoading ? (
          <Menu.Item disabled>Loading...</Menu.Item>
        ) : currentNotifications.length > 0 ? (
          currentNotifications.map((notification) => (
            <Menu.Item
              key={notification.id}
              style={{
                backgroundColor: notification.read ? 'transparent' : '#f5f5f5',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: notification.read ? 'inherit' : '#000',
              }}
              mb={5}
              onClick={() => {
                if (notification.read) {
                  modals.closeAll();
                  openModal(notification);
                }
              }}
            >
              <Checkbox
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                checked={notification.checked}
                onChange={(event) => {
                  const isChecked = event.currentTarget.checked;
                  setNotificationsList((prevNotifications) =>
                    prevNotifications.map((notif) =>
                      notif.id === notification.id ? { ...notif, checked: isChecked } : notif
                    )
                  );
                  if (isChecked) {
                    modals.closeAll();
                    openModal(notification);
                  }
                }}
                label={
                  <Text
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    size="sm"
                  >
                    {notification.message}
                  </Text>
                }
                description={moment(notification.timestamp).fromNow()}
                indeterminate={notification.read}
              />
            </Menu.Item>
          ))
        ) : (
          <Menu.Item disabled>No new notifications</Menu.Item>
        )}
        <Menu.Divider />
        <Center>
          <Pagination
            total={paginatedNotifications.length}
            value={activePage}
            onChange={setPage}
            mt="sm"
          />
        </Center>
      </Menu.Dropdown>
    </Menu>
  );
};

export default NotificationButton;
