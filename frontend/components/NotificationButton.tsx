import React, { useEffect, useState } from 'react';
import axiosInstance from '@/utils/axiosInstance';
import { Menu, Checkbox, Text, ActionIcon, MantineProvider, Anchor, Button, Container } from '@mantine/core';
import { IconBell } from '@tabler/icons-react';
import moment from 'moment';
import { modals } from '@mantine/modals';
import { useRouter } from 'next/router';
import { useClickOutside } from '@mantine/hooks';
import Link from 'next/link';

interface Notification {
  id: number;
  message: string;
  timestamp: string;
  read: boolean;
  checked: boolean;
  full_name: string | null;
}

const NotificationButton = () => {
  const [notificationsList, setNotificationsList] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastTimestamp, setLastTimestamp] = useState<string | null>(null);
  const [opened, setOpened] = useState<boolean>(false);
  const ref = useClickOutside(() => {
    if (!opened) return; // Close the menu only if it's opened
    setOpened(false);
  });

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('showNotification/');
      const fetchedNotifications: Notification[] = response.data;

      if (fetchedNotifications.length > 0) {
        setLastTimestamp(fetchedNotifications[0].timestamp);

        setNotificationsList(
          fetchedNotifications.map(notification => ({
            ...notification,
            checked: notification.read, // Check if notification is read
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkForNewNotifications = async () => {
    try {
      const response = await axiosInstance.get('long-polling/', {
        params: { last_timestamp: lastTimestamp }
      });
      const newNotifications: Notification[] = response.data.notifications;

      if (newNotifications.length > 0) {
        setNotificationsList(prevNotifications => [
          ...newNotifications.slice(0, 5).map(notification => ({
            ...notification,
            checked: notification.read,
          })),
          ...prevNotifications.slice(0, 5)
        ]);
        setLastTimestamp(newNotifications[newNotifications.length - 1].timestamp);
      }
    } catch (error) {
      console.error('Error checking for new notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(checkForNewNotifications, 5000);
    return () => clearInterval(intervalId);
  }, [lastTimestamp]);

  const markAsRead = async (notificationId: number) => {
    try {
      await axiosInstance.post('mark_as_read/', { id: notificationId });
      setNotificationsList(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true, checked: true } // Mark as read and checked
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markSelectedAsRead = () => {
    const checkedNotifications = notificationsList.filter(notification => notification.checked);
    if (checkedNotifications.length > 0) {
      checkedNotifications.forEach(notification => markAsRead(notification.id));
    }
  };

  const unreadCount = notificationsList.filter(notification => !notification.read).length;
  const router = useRouter();

  const openModal = (notification: Notification) => {
    modals.openConfirmModal({
      title: `Reservation update from ${notification.full_name}`,
      size: 'sm',
      radius: 'md',
      withCloseButton: true,
      children: (
        <Text size="sm">{notification.message}</Text>
      ),
      labels: { confirm: 'Confirm', cancel: 'Cancel' },
      onCancel: () => {
        // setOpened(true);
        // No need to uncheck the notification when the modal is canceled
        // Leave the notification's checked state unchanged
      },
      onConfirm: () => {
        const reservationId = extractReservationId(notification.message);
        router.push({
          pathname: '/transactionsAdmin',
          query: { searchQuery: reservationId },
        });
      },
    });

    // Mark the notification as read when the modal is opened
    markAsRead(notification.id);
  };

  const extractReservationId = (message: string): string => {
    const regex = /reservation\s(\d+_\d{2}-\d{2}-\d{4}-\d{2}_\w+)/;
    const match = message.match(regex);
    return match ? match[1] : '';
  };

  const toggleMenu = () => {
    setOpened(prevOpened => !prevOpened);
  };

  return (
    <Menu opened={opened} shadow="md" width={300}>
      <Menu.Target>
        <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
          <ActionIcon variant="outline" onClick={toggleMenu}>
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
        {loading ? (
          <Menu.Item disabled>Loading...</Menu.Item>
        ) : notificationsList.length > 0 ? (
          notificationsList.slice(0, 5).map(notification => (
            <Menu.Item
            key={notification.id}
            style={{
              backgroundColor: notification.read ? 'transparent' : '#f5f5f5',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            onClick={() => {
              if (notification.read) {
                modals.closeAll();
                openModal(notification); // Open modal when clicking on a read notification
              }
            }}
          >
            <Checkbox
            style={{
             
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
              checked={notification.checked}
              onChange={event => {
                const isChecked = event.currentTarget.checked;
                setNotificationsList(prevNotifications =>
                  prevNotifications.map(notif =>
                    notif.id === notification.id
                      ? { ...notif, checked: isChecked }
                      : notif
                  )
                );
                if (isChecked) {
                  modals.closeAll();
                  openModal(notification); // Open modal when checkbox is checked or notification is read
                }
              }}
              label={<Text 
                style={{
                 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
                 size="sm">{notification.message}</Text>}
              description={moment(notification.timestamp).fromNow()}
              indeterminate={notification.read} // Read notifications should be shown as indeterminate
            />
          </Menu.Item>
          ))
        ) : (
          <Menu.Item disabled>No new notifications</Menu.Item>
        )}
        <Menu.Divider />
        <Menu.Item onClick={markSelectedAsRead} style={{ cursor: 'pointer' }}>
          Mark Selected as Read
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item component={Link} href="/notifications" style={{ cursor: 'pointer' }}>
          View All Notifications
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};

export default NotificationButton;
