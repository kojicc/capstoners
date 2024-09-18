import { HeroBullets } from '@/components/reservationLandingPage/hero/HeroReservation';
import { ProductCards } from '@/components/reservationLandingPage/sections/productCards';
import {
  Autocomplete,
  Badge,
  Container,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Title,
} from '@mantine/core';
import { CartItems } from './cartReservations';
import { CartIcon } from '@/components/cartButton';
import { AutocompleteClearable } from '@/components/reservationLandingPage/sections/autocompleClearableReservation';
import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import axios from '@/utils/axiosInstance';
import { Header } from '@/components/LandingPage/header/HeaderLP';
import { Text } from '@mantine/core';
import { useScrollIntoView } from '@mantine/hooks';
import { Tooltip } from '@mantine/core';
import { Footer } from '@/components/LandingPage/footer/footer';
import { useRouter } from 'next/router';

interface Category {
  categoryId: string;
  name: string;
  description: string;
  icon: string;
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

const ReservationLandingPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryID, setCategoryID] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const router = useRouter();
  const { searchQuery: searchFromHeader } = router.query; // Get search query from URL

  // Create a ref for the Container you want to scroll into view
  const { scrollIntoView, targetRef } = useScrollIntoView<HTMLDivElement>({
    offset: 60, // Adjust the offset as needed
  });

  useEffect(() => {
    if (router.isReady && searchFromHeader) {
      scrollIntoView({ alignment: 'start' });
    }
  }, [router.isReady, searchFromHeader, scrollIntoView]);

  return (
    <div>
      <Header />

      <HeroBullets scrollTo={() => scrollIntoView({ alignment: 'start' })} />
      {/* <CheckoutPage /> */}
      <Container pt={50}>
        {/* <ReservationCategoryCards /> */}
        <>
          <Stack ref={targetRef}>
            <AutocompleteClearable setSearchQuery={setSearchQuery} setCategoryID={setCategoryID} />
          </Stack>

          <ProductCards
            categoryID={categoryID}
            searchQuery={
              searchQuery || (typeof searchFromHeader === 'string' ? searchFromHeader : '')
            }
          />
        </>
      </Container>

      {/* <Paper p="xl" mt={50} shadow="xl">
        <CartItems />
      </Paper> */}
      <Footer />
    </div>
  );
};

export default ReservationLandingPage;
