import { HeroBullets } from '@/components/reservationLandingPage/hero/HeroReservation';
import { ProductCards } from '@/components/reservationLandingPage/sections/productCards';
import { Autocomplete, Container, Paper, Stack } from '@mantine/core';
import { CartItems } from './cartReservations';
import { CartIcon } from '@/components/cartButton';
import { AutocompleteClearable } from '@/components/reservationLandingPage/sections/autocompleClearableReservation';
import { useState } from 'react';
// import { CheckoutPage } from './checkoutPage';

const reservationLandingPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryID, setCategoryID] = useState  ('');

  return (
    <>
      <CartIcon />
      <HeroBullets />
      {/* <CheckoutPage /> */}
      <Container>
        <Stack gap="xl" mt={50} />
        <AutocompleteClearable setSearchQuery={setSearchQuery} />
        <ProductCards categoryID={categoryID} searchQuery={searchQuery} />
        <Stack />
      </Container>

      <Paper p="xl" mt={50} shadow="xl">
        <CartItems />
      </Paper>
    </>
  );
};

export default reservationLandingPage;
