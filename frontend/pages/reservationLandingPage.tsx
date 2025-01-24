import { HeroBullets } from '@/components/reservationLandingPage/hero/HeroReservation';
import { ProductCards } from '@/components/reservationLandingPage/sections/productCards';
import {
  AppShell,
  Autocomplete,
  Badge,
  Container,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Title,
} from '@mantine/core';
import CartItems from './cartReservations';
import { CartIcon } from '@/components/cartButtonComponent/cartButton';
import { AutocompleteClearable } from '@/components/reservationLandingPage/sections/autocompleClearableReservation';
import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import axios from '@/utils/axiosInstance';
import Header from '@/components/LandingPage/header/HeaderLP';
import { Text } from '@mantine/core';
import { useDisclosure, useScrollIntoView } from '@mantine/hooks';
import { Tooltip } from '@mantine/core';
import { Footer } from '@/components/LandingPage/footer/footer';
import { useRouter } from 'next/router';
import { withRoleProtection } from '@/utils/withRoleProtection';

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
  const [opened, { toggle }] = useDisclosure();

  // Create a ref for the Container you want to scroll into view
  const { scrollIntoView, targetRef } = useScrollIntoView<HTMLDivElement>({
    offset: 60, // Adjust the offset as needed
  });

  useEffect(() => {
    if (router.isReady && searchFromHeader) {
      scrollIntoView({ alignment: 'start' });
    }
    setCategoryID(searchFromHeader as string);

  }, [router.isReady, searchFromHeader, scrollIntoView]);

  return (
    <div>
      <AppShell
        header={{ height: 60 }}
        navbar={{ width: 300, breakpoint: 'sm', collapsed: { desktop: true, mobile: !opened } }}
        padding="md"
      >
        <AppShell.Header bg={'#592f55'}>
          <Header />
        </AppShell.Header>

        <AppShell.Main>
          <HeroBullets scrollTo={() => scrollIntoView({ alignment: 'start' })} />
          <Container fluid>
            {/* <ReservationCategoryCards /> */}
            <>
              <Stack ref={targetRef}>
                <AutocompleteClearable
                  setSearchQuery={setSearchQuery}
                  setCategoryID={setCategoryID}
                />
              </Stack>

              <ProductCards
                categoryID={categoryID}
                searchQuery={
                  searchQuery || (typeof searchFromHeader === 'string' ? searchFromHeader : '')
                }
              />
            </>
          </Container>
        </AppShell.Main>
        <Footer />
      </AppShell>

      {/* <CheckoutPage /> */}

      {/* <Paper p="xl" mt={50} shadow="xl">
        <CartItems />
      </Paper> */}
    </div>
  );
};

export default withRoleProtection(ReservationLandingPage, ['admin', 'student']);
