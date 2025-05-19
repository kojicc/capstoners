import { useEffect, useState } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '@mantine/core/styles.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { MantineProvider } from '@mantine/core';
import { theme } from '../theme';
import React from 'react';
import '@mantine/dates/styles.css';
import { AuthProvider } from '@/utils/authContext';
import { ModalsProvider } from '@mantine/modals';
import '@mantine/notifications/styles.css';
import { Notifications } from '@mantine/notifications';
import { CategoryIDProvider } from '@/utils/CategoryIDContext';
import '@mantine/dropzone/styles.css';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    AOS.init({
      duration: 1200,
      offset: 50,
      delay: 0,
      once: false,
      easing: 'ease-in-out',
    });
  }, []);

  return (
    <CategoryIDProvider>
      <MantineProvider theme={theme}>
        <AuthProvider>
          <Notifications />
          <ModalsProvider>
            <Head>
              <title>Resorvoia</title>
              <meta
                name="viewport"
                content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
              />
              <link rel="shortcut icon" href="/cthm_icon.png" />
            </Head>
            <Component {...pageProps} />
          </ModalsProvider>
        </AuthProvider>
      </MantineProvider>
    </CategoryIDProvider>
  );
}
