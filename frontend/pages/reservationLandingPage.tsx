import { HeroBullets } from '@/components/reservationLandingPage/hero/HeroReservation';
import { ProductCards } from '@/components/reservationLandingPage/sections/productCards';
import { Autocomplete, Badge, Container, Group, Paper, ScrollArea, Stack } from '@mantine/core';
import { CartItems } from './cartReservations';
import { CartIcon } from '@/components/cartButton';
import { AutocompleteClearable } from '@/components/reservationLandingPage/sections/autocompleClearableReservation';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import axios from '@/utils/axiosInstance';

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

  const { data, error } = useSWR('getCategories/', fetcher);

  useEffect(() => {
    if (data) {
      // Log data to confirm structure
      console.log('Fetched Data:', data);

      // Ensure data is in the expected format
      if (data.categories && Array.isArray(data.categories)) {
        setCategories(data.categories);
      } else {
        console.error('Unexpected data format:', data);
      }
    }
  }, [data]);

  if (error) return <div>Failed to load</div>;
  if (!data) return <div>Loading...</div>;

  // Map categories to categoryData
  const categoryData = categories.map((category) => ({
    value: category.categoryId,
    label: category.name,
  }));

  return (
    <>
      <CartIcon />
      {/* <HeroBullets /> */}
      {/* <CheckoutPage /> */}
      <Container>
        {/* <ReservationCategoryCards /> */}
        <Stack gap="xl" mt={50} />
        <AutocompleteClearable setSearchQuery={setSearchQuery} />
        <ScrollArea type='auto' >
          <Group justify="center" p={10} style={{ cursor: 'pointer' }}>
            {categoryData.length > 0 ? (
              categoryData.map((category) => (
                <Badge
                  key={category.value}
                  component="a"
                  onClick={() => setCategoryID(category.value)}
                >
                  {category.label}
                </Badge>
              ))
            ) : (
              <div>No categories available</div>
            )}
          </Group>
        </ScrollArea>
        <ProductCards categoryID={categoryID} searchQuery={searchQuery} />
        <Stack />
      </Container>

      <Paper p="xl" mt={50} shadow="xl">
        <CartItems />
      </Paper>
    </>
  );
};

export default ReservationLandingPage;
