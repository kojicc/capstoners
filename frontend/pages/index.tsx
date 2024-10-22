import { ContactUs } from '@/components/LandingPage/contact/ContactUs';

import Header from '../components/LandingPage/header/HeaderLP';
import { Hero } from '../components/LandingPage/hero/Hero';
import { About } from '@/components/LandingPage/abouts/About';
import { Products } from '@/components/LandingPage/products/Products';
import { Footer } from '@/components/LandingPage/footer/footer';
import { useEffect, useState } from 'react';
import { Button } from '@mantine/core';
// import { TransactionsAdmin } from '@/components/adminPage/TransactionsAdmin';
import axios from '@/utils/axiosInstance';

export default function HomePage() {
  useEffect(() => {
    // Send a request to record the page view
    axios
      .get('record-page-view/') // Replace with your actual API route
      .then((response) => {
        console.log('Page view recorded:', response.data);
      })
      .catch((error) => {
        console.error('Error recording page view:', error);
      });
  }, []);

  return (
    <>
      {/* <Button component='a'href='/productsCRUDAdmin'>Crud Test</Button> */}

      <Header />
      <Hero />
      <About />

      {/* <TransactionsAdmin/> */}

      {/* <Products /> */}
      <ContactUs />
      {/* <Button component="a" href="/cart">
        Cart Test
      </Button>
      <Button component="a" href="/test">
        Notification Test
      </Button> */}
      <Footer />
    </>
  );
}
