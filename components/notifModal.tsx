import React, { useState } from 'react';
import { Modal, Button } from '@mantine/core';

interface ReservationDetails {
    id: number;
    name: string;
    date: string;
    time: string;
}

interface NotifModalProps {
    notification: ReservationDetails;
}

const NotifModal: React.FC<NotifModalProps> = ({ notification }) => {
    const [open, setOpen] = useState(false);

    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <>
            <Button onClick={handleOpen}>View Reservation</Button>
            <Modal opened={open} onClose={handleClose} title="Reservation Details">
                <div>
                    <p>ID: {notification.id}</p>
                    <p>Name: {notification.name}</p>
                    <p>Date: {notification.date}</p>
                    <p>Time: {notification.time}</p>
                </div>
            </Modal>
        </>
    );
};

export default NotifModal;