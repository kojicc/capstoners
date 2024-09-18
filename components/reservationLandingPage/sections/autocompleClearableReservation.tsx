import {
  AwaitedReactNode,
  Dispatch,
  JSXElementConstructor,
  Key,
  ReactElement,
  ReactNode,
  ReactPortal,
  SetStateAction,
  useEffect,
  useState,
} from 'react';
import useSWR from 'swr';
import axios from '@/utils/axiosInstance';
import {
  Autocomplete,
  TextInput,
  Loader,
  CloseButton,
  Tooltip,
  Badge,
  Group,
  ScrollArea,
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import router from 'next/router';

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
  setSearchQuery: Dispatch<SetStateAction<string>>;

  setCategoryID: Dispatch<SetStateAction<string>>;
}

export function AutocompleteClearable({
  setSearchQuery,
  setCategoryID,
}: AutocompleteClearableProps) {
  useEffect(() => {
    if (router.query.searchQuery) {
      setSearchQuery(router.query.searchQuery as string);
    }
  }, [router.query.searchQuery]);
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
      <Tooltip label="Search products using product IDs" position="bottom" withArrow>
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
      </Tooltip>
      <ScrollArea type="auto">
        <Group justify="center" p={10} style={{ cursor: 'pointer' }}>
          {categoryItems.length > 0 ? (
            categoryItems.map(
              (category: {
                value: Key | null | undefined;
                label:
                  | string
                  | number
                  | boolean
                  | ReactElement<any, string | JSXElementConstructor<any>>
                  | Iterable<ReactNode>
                  | ReactPortal
                  | Promise<AwaitedReactNode>
                  | null
                  | undefined;
              }) => (
                <Tooltip
                  label="Click to view products for this category"
                  position="bottom"
                  withArrow
                >
                  <Badge
                    key={category.value}
                    component="a"
                    onClick={() => setCategoryID(category.value?.toString() || '')}
                  >
                    {category.label}
                  </Badge>
                </Tooltip>
              )
            )
          ) : (
            <div>No categories available</div>
          )}
        </Group>
      </ScrollArea>
    </div>
  );
}
