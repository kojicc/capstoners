import { useState } from 'react';
import useSWR from 'swr';
import axios from '@/utils/axiosInstance';
import { Autocomplete, TextInput, Loader, CloseButton } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

const useData = () => {
  const { data: categoriesData, error: categoriesError } = useSWR('getCategories/', fetcher);
  const { data: productsData, error: productsError } = useSWR('getadminProductDetail/', fetcher);

  return {
    categories: categoriesData?.categories || [],
    products: productsData?.products || [],
    isLoading: !categoriesData && !productsData,
    error: categoriesError || productsError,
  };
};

interface AutocompleteClearableProps {
  setSearchQuery: (query: string) => void;
}

export function AutocompleteClearable({ setSearchQuery }: AutocompleteClearableProps) {
  const { categories, products, isLoading, error } = useData();
  const [value, setValue] = useState('');

  if (isLoading) return <Loader />;
  if (error) return <div>Error loading data</div>;

  const categoryItems = categories.map((category: any) => ({
    value: category.categoryId,
    label: `${category.name} - ${category.categoryId}`,
  }));

  const productItems = products.map((product: any) => ({
    value: product.productId,
    label: product.productId,
  }));

  return (
    <div style={{ position: 'relative' }}>
      <Autocomplete
        placeholder="Search products using product IDs"
        value={value}
        onChange={(query) => {
          setValue(query);
          setSearchQuery(query);
        }}
        leftSection={<IconSearch size={16} />}
        rightSection={
          value && (
            <CloseButton
              size="sm"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setValue('');
                setSearchQuery('');
              }}
              aria-label="Clear value"
            />
          )
        }
        my={20}
        data={[
          {
            group: 'Product Categories',
            items: categoryItems,
          },
          {
            group: 'Product IDs',
            items: productItems,
          },
        ]}
      />
    </div>
  );
}
