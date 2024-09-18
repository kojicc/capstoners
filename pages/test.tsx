import React, { useEffect, useState } from 'react';
import axiosInstance from '@/utils/axiosInstance';
import { notifications } from '@mantine/notifications';
import { Button } from '@mantine/core';
import NotificationButton from '@/components/NotificationButton';

const Notifications = () => {
    const [notificationsList, setNotificationsList] = useState<any[]>([]);
    const [lastTimestamp, setLastTimestamp] = useState<string | null>(null);
    



     // Function to extract reservation ID from the notification message
     const extractReservationId = (message: string): string | null => {
        // Update regex to match the full reservation ID, including possible timestamps or other details
        const match = message.match(/reservation ([\d_]+-[\d_]+-[\d_]+-[\d_]+)/);
        return match ? match[1] : null;
    };





    // Function to show notification using Mantine
    const showNotificationUI = (notification: any) => {
        console.log("extractReservationId ",extractReservationId(notification.message) );
        console.log("notificatin id",notification.reservation_id);

        const reservationid = extractReservationId(notification.message);

        if (notification.message === `Your reservation ${reservationid} has been approved successfully and is awaiting your pickup.`) 
            {
                notifications.show({
                    id: notification.timestamp, // Use timestamp as a unique id
                    message: notification.message,
                    autoClose: 5000,
                    title: "Approved Reservation Notification",
                    color: 'green',
                    withCloseButton: true,
                    onClose: () => console.log('Notification closed'),
                });
            }
        
        else if (notification.message === `Your reservation ${reservationid} has been cancelled.`)
        {
            notifications.show({
                id: notification.timestamp, // Use timestamp as a unique id
                message: notification.message,
                autoClose: 5000,
                title: "Cancellation Notification",
                color: 'red',
                withCloseButton: true,
                onClose: () => console.log('Notification closed'),
            });
        }

        else if (notification.message === `Your reservation ${reservationid} has been rejected.`)
        {
            notifications.show({
                id: notification.timestamp, // Use timestamp as a unique id
                message: notification.message,
                autoClose: 5000,
                title: "Rejection Notification",
                color: 'red',
                withCloseButton: true,
                onClose: () => console.log('Notification closed'),
            });
        }

        else if (notification.message === `Your reservation ${reservationid} has been completed.`)
        {
            notifications.show({
                id: notification.timestamp, // Use timestamp as a unique id
                message: notification.message,
                autoClose: 5000,
                title: "Completion Notification",
                color: 'green',
                withCloseButton: true,
                onClose: () => console.log('Notification closed'),
            });
        }

        else if (notification.message === `Your reservation ${reservationid} is awaiting return.`)
        {
            notifications.show({
                id: notification.timestamp, // Use timestamp as a unique id
                message: notification.message,
                autoClose: 5000,
                title: "Return Notification",
                color: 'blue',
                withCloseButton: true,
                onClose: () => console.log('Notification closed'),
            });
        }

        else if (notification.message === `Your reservation ${reservationid} has been marked as damaged/lost/partially completed.`)
        {
            notifications.show({
                id: notification.timestamp, // Use timestamp as a unique id
                message: notification.message,
                autoClose: 5000,
                title: "Damaged/Lost/Partially Completed Notification",
                color: 'red',
                withCloseButton: true,
                onClose: () => console.log('Notification closed'),
            });
        }
        else if (notification.message === `Your reservation ${reservationid} is awaiting payment.`)
        {
            notifications.show({
                id: notification.timestamp, // Use timestamp as a unique id
                message: notification.message,
                autoClose: 5000,
                title: "Payment Notification",
                color: 'yellow',
                withCloseButton: true,
                onClose: () => console.log('Notification closed'),
            });
        }

        else if (notification.message === `Your reservation ${reservationid} has been created successfully."`)
        {
            notifications.show({
                id: notification.timestamp, // Use timestamp as a unique id
                message: notification.message,
                autoClose: 5000,
                title: "Creation Notification",
                color: 'blue',
                withCloseButton: true,
                onClose: () => console.log('Notification closed'),
            });
        }

        else{
            notifications.show({
                id: notification.timestamp, // Use timestamp as a unique id
                message: notification.message,
                autoClose: 5000,
                title: "General Notification",
                color: 'blue',
                withCloseButton: true,
                onClose: () => console.log('Notification closed'),
        }
        );
        }
        
    };

    // Function to fetch all notifications initially
    const fetchAllNotifications = async () => {
        try {
            const response = await axiosInstance.get('showNotification/');
            const fetchedNotifications = response.data;

            setNotificationsList(fetchedNotifications);
            if (fetchedNotifications.length > 0) {
                setLastTimestamp(fetchedNotifications[0].timestamp);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    // Function to fetch new notifications via long polling
    const fetchNewNotifications = async () => {
        try {
            const response = await axiosInstance.get('long-polling/', {
                params: { last_timestamp: lastTimestamp }
            });
            const newNotifications = response.data.notifications;

            if (newNotifications.length > 0) {
                // Update the list with new notifications
                setNotificationsList(prevNotifications => [
                    ...prevNotifications,
                    ...newNotifications
                ]);
                

                // Show new notifications using Mantine
                newNotifications.forEach(showNotificationUI);

                // Update the last timestamp
                setLastTimestamp(newNotifications[newNotifications.length - 1].timestamp);
            }
        } catch (error) {
            console.error('Error fetching new notifications:', error);
        }
    };

    useEffect(() => {
        // Fetch all notifications on component mount
        fetchAllNotifications();

        // Polling every 5 seconds for new notifications
        const intervalId = setInterval(fetchNewNotifications, 5000);

        // Cleanup on component unmount
        return () => clearInterval(intervalId);
    }, [lastTimestamp]);

    return (
        <div>
             <NotificationButton />
            <h2>Notifications</h2>
            <ul>
                {notificationsList.map((notification, index) => (
                    <li key={index}>{notification.message}</li>
                ))}
            </ul>
            <Button
      onClick={() =>
        notifications.show({
          title: 'Default notification',
          message: 'Do not forget to star Mantine on GitHub! 🌟',
        })
      }
    >
      Show notification
    </Button>
        </div>
    );
};

export default Notifications;
