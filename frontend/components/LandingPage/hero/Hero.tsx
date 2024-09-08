import cx from 'clsx';
import {
  Title,
  Text,
  Container,
  Button,
  Overlay,
  Flex,
  ActionIcon,
  BackgroundImage,
} from '@mantine/core';
import classes from './HeroImageBackground.module.css';
import {
  IconAdjustments,
  IconBuildingStore,
  IconBuildingWarehouse,
  IconCalendarMonth,
  IconChartBar,
} from '@tabler/icons-react';
import { useState, useEffect, useContext } from 'react';
import { fetchDecodedAccessToken, isLoggedIn } from '../../../utils/auth';
import { fetchAccessToken } from '../../../utils/auth';
import { AuthContext } from '@/utils/authContext';

import { useLocalStorage } from '@mantine/hooks';

interface Role {
  role: string;
  username: string;
}

export function Hero() {
  const { role } = useContext(AuthContext);

  // useEffect(() => {
  //   const checkRole = async () => {
  //     try{
  //        const role = await fetchDecodedAccessToken();
  //       if (role && typeof role === 'object' && 'role' in role) {
  //         console.log("role siya", (role as Role).role);
  //         setRole((role as Role).role);
  //       } else {
  //         console.error('Role is not in the expected format:', role);
  //       }
  //     } catch (error) {
  //       console.error('Error checking role:', error);

  //     }
  //   }
  //   checkRole();
  // }
  // , []);

  const [isDisabled, setIsDisabled] = useLocalStorage({
    key: 'isDisabled',
    defaultValue: false,
  });

  useEffect(() => {
    const checkLoginStatus = async () => {
      console.log('Component mounted, checking login status...');
      try {
        const loggedIn = await isLoggedIn();
        if (loggedIn) {
          console.log('User is logged in, enabling button.');
          setIsDisabled(false);
        } else {
          console.log('User is not logged in, disabling button.');
          setIsDisabled(true);
        }
      } catch (error) {
        console.error('Error checking login status:', error);
      }
    };

    checkLoginStatus();
  }, []);
  return (
    <div className={classes.wrapper}>
      <Overlay color="#000" opacity={1} zIndex={1} />

      <div className={classes.inner}>
        <Title className={classes.title}>
          Go Beyond the Limits <br></br>with CHTM.{' '}
        </Title>

        <div className={classes.controls}>
          {role === 'admin' ? (
            <>
              <Button
                className={classes.disabled}
                component="a"
                href="adminDashboard"
                data-disabled={isDisabled}
                onClick={isDisabled ? (event) => event.preventDefault() : undefined}
                size="xl"
                h={120}
                w={150}
              >
                <div className={classes.buttonContent}>
                  <IconBuildingStore className={classes.icon} size={35} />

                  <Text fw={700} c="white">
                    Dashboard
                  </Text>
                </div>
              </Button>

              <Button
                className={classes.disabled}
                component="a"
                href="productsCRUDAdmin"
                data-disabled={isDisabled}
                onClick={isDisabled ? (event) => event.preventDefault() : undefined}
                size="xl"
                h={120}
                w={150}
              >
                <div className={classes.buttonContent}>
                  <IconChartBar className={classes.icon} size={35} />

                  <Text fw={700} c="white">
                    Reservation
                  </Text>
                </div>
              </Button>
            </>
          ) : (
            <>
              <Button
                className={classes.disabled}
                component="a"
                href="reservationLandingPage"
                data-disabled={isDisabled}
                onClick={isDisabled ? (event) => event.preventDefault() : undefined}
                size="xl"
                h={120}
                w={150}
              >
                <div className={classes.buttonContent}>
                  <IconBuildingStore className={classes.icon} size={35} />

                  <Text fw={700} c="white">
                    Reserve
                  </Text>
                </div>
              </Button>

              <Button
                className={classes.disabled}
                component="a"
                href="https://mantine.dev"
                data-disabled={isDisabled}
                onClick={isDisabled ? (event) => event.preventDefault() : undefined}
                size="xl"
                h={120}
                w={150}
              >
                <div className={classes.buttonContent}>
                  <IconChartBar className={classes.icon} size={35} />

                  <Text fw={700} c="white">
                    Status
                  </Text>
                </div>
              </Button>

              <Button
                className={classes.disabled}
                component="a"
                href="transactionsAdmin"
                data-disabled={isDisabled}
                onClick={isDisabled ? (event) => event.preventDefault() : undefined}
                size="xl"
                h={120}
                w={150}
              >
                <div className={classes.buttonContent}>
                  <IconCalendarMonth className={cx(classes.icon, classes.thIcon)} size={35} />

                  <Text fw={700} c="white">
                    Transaction<br></br> History
                  </Text>
                </div>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
