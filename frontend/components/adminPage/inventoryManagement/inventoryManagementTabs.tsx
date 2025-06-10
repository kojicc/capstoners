import React, { useContext, useEffect, useState } from 'react';
import useProtectedRoute from '../../../utils/protectedRoute'; // Ensure this path is correct
import {
  Button,
  Text,
  Image,
  TextInput,
  Select,
  SimpleGrid,
  Card,
  Container,
  Group,
  Stack,
  LoadingOverlay,
  Tabs,
  rem,
  Autocomplete,
  Flex,
  NumberInput,
  Paper,
  CloseButton,
  Title,
} from '@mantine/core';
import { Dropzone, FileWithPath, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import axios from '../../../utils/axiosInstance';
import classes from '@/components/modules.css/FloatingLabelInput.module.css';

import { modals } from '@mantine/modals';
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';
import { AuthContext } from '@/utils/authContext';
import {
  IconPhoto,
  IconMessageCircle,
  IconSettings,
  IconSearch,
  IconBuildingWarehouse,
  IconBadgeTmFilled,
  IconCategoryFilled,
  IconFileDescription,
  IconIdBadge2,
  IconAlertTriangle,
  IconChartBar,
} from '@tabler/icons-react';
import ActionsGridViewAdmin from '@/components/CategoryCrudGridComponent';
import UpdateCrudProductsAdmin from '@/components/adminPage/inventoryManagement/productCrudAdmin';
import { useCategoryID } from '../../../utils/CategoryIDContext';
import axiosInstance from '../../../utils/axiosInstance';
import { notifications } from '@mantine/notifications';
import { useForm } from '@mantine/form';
import { readLocalStorageValue, useLocalStorage } from '@mantine/hooks';
import useSWR from 'swr';
import ProductStatsCard from './ProductStatsCard';

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  quantity: number;
  image: string;
  productId: string;
  category: string;
  type: string;
  reserved: number;
  broken_damaged?: number;
}

interface Category {
  categoryId: string;
  name: string;
  description: string;
  icon: string;
}

interface ProductType {
  id: string;
  name: string;
  description: string;
}
interface ProductStats {
  most_reserved: Product[];
  lowest_stock: Product[];
}

// Add inside the component before return

// // Fetcher function
// ganto mag fetch ng data from backend with query
// const fetcher = ([url, categoryID]: [string, string]) => {
//   const query = categoryID ? `?categoryID=${categoryID}` : '?categoryID=';
//   console.log('Fetching URL:', `${url}${query}`); // Check the URL here
//   return axiosInstance.get(`${url}${query}`).then((res) => res.data);
// };
// ganto mag fetch ng data from backend with query

//  const { data: products, error: productsError } = useSWR(
//    ['getImages/', state.categoryID || ''], // Pass an empty string when categoryID is falsy to fetch all products
//    fetcher,
//    { refreshInterval: 1000 }
//  );

const fetcher = (url: string) => axiosInstance.get(url).then((res) => res.data);

const ProductAddPage = () => {
  // #region usestates
  const [images, setImages] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { state } = useCategoryID();
  const [prodID, setprodID] = useState<string>('');
  const [prodName, setprodName] = useState<string>('');
  const [prodDesc, setprodDesc] = useState<string>('');
  const [prodPrice, setprodPrice] = useState<number>(0);
  const [prodQuantity, setprodQuantity] = useState<number>(0);
  const [prodCategory, setprodCategory] = useState<string>('');
  const [prodCategoryID, setprodCategoryID] = useState<string>('');
  const [prodImage, setprodImage] = useState<FileWithPath[]>([]);
  const [focused, setFocused] = useState<boolean>(false);
  const [value, setValue] = useState<string>('');
  const [openedPopoverId, setOpenedPopoverId] = useState<string | null>(null);

  const [nextProductId, setNextProductId] = useState('');
  const [error, setError] = useState('');
  const floating = value.trim().length !== 0 || focused || undefined;
  const [searchProduct, setSearchProduct] = useState<Product[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);

  const [searchInput, setSearchInput] = useState<string>('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Boolean>(false);
  const iconStyle = { width: rem(12), height: rem(12) };
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  let categoryData = [];
  const [categories, setCategories] = useState<Category[]>([]);

  // #endregion

  const { data: productStats, error: statsError } = useSWR<ProductStats>(
    selectedCategory ? `getProductStats/?categoryId=${selectedCategory}` : 'getProductStats/',
    fetcher,
    { refreshInterval: 1000 }
  );

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
  };

  const { data: allProducts, error: productsError } = useSWR('getImages/', fetcher, {
    refreshInterval: 1000,
  });

  useEffect(() => {
    if (allProducts) {
      console.log('All products:', allProducts);
      setProductsList(allProducts.images || []); // Store all products
      setImages(allProducts.images || []);
      setFilteredProducts(allProducts.images || []);
      setIsLoading(false);
    }
  }, [allProducts]);

  useEffect(() => {
    if (productsList) {
      let filtered = productsList;
      if (searchInput) {
        filtered = filtered.filter(
          (product) =>
            product.productId.toLowerCase().includes(searchInput) ||
            product.category.toLowerCase().includes(searchInput) ||
            product.name.toLowerCase().includes(searchInput)
        );
      }

      // Filter by category ID if set
      if (state.categoryID) {
        // Filter by search input
        if (searchInput) {
          filtered = filtered.filter(
            (product) =>
              product.productId.toLowerCase().includes(searchInput) ||
              product.category.toLowerCase().includes(searchInput) ||
              product.name.toLowerCase().includes(searchInput)
          );
        } else {
          filtered = filtered.filter((product) => product.category === state.categoryID);
        }
      }

      // Set the filtered results
      setImages(filtered);
      setFilteredProducts(filtered);
    }
  }, [state.categoryID, searchInput, productsList]);

  const [categoryChanged, setCategoryChanged, removeValue] = useLocalStorage({
    key: 'categoryChanged',
    defaultValue: '0',
  });

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'categoryChanged') {
        setCategoryChanged(event.newValue ?? '0');
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [setCategoryChanged]);

  const { data: categoriesData, error: categoriesError } = useSWR('getCategories/', fetcher, {
    refreshInterval: 1000,
  });

  useEffect(() => {
    if (categoriesData?.categories) {
      setCategories(categoriesData.categories);
      console.log('Categories loaded:', categoriesData.categories); // Debug log
    }
  }, [categoriesData]);

  useEffect(() => {
    removeValue();
  }, [categoryChanged]);

  useEffect(() => {
    const value = readLocalStorageValue({ key: 'categoryChanged' });
  }, []);

  const handleSearch = (value: string) => {
    const searchValue = value.trim().toLowerCase().split(' - ')[0];
    setSearchInput(searchValue);
  };

  return (
    <Paper shadow="xl" radius={'md'} p={'xl'}>
      <LoadingOverlay visible={isLoading} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />

      <Tabs color="teal" variant="pills" defaultValue="Create" classNames={classes}>
        <Tabs.List grow>
          <Tabs.Tab value="Create" leftSection={<IconPhoto style={iconStyle} />}>
            Create
          </Tabs.Tab>
          <Tabs.Tab
            color="yellow"
            value="Update/Delete"
            leftSection={<IconMessageCircle style={iconStyle} />}
          >
            Update
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="Create">
          <Paper shadow="sm" radius={'md'} p={'lg'}>
            <Group justify="center" grow>
              <Select
                placeholder="Filter by category"
                value={selectedCategory}
                onChange={handleCategoryChange}
                data={categories.map((cat) => ({
                  value: cat.categoryId,
                  label: cat.name,
                }))}
                clearable
                style={{ width: 200 }}
                p={'xs'}
              />
            </Group>
            <Group grow mb="md">
              <Paper shadow="sm" radius="md" p="md" withBorder>
                <Stack>
                  <Group justify="apart">
                    <Group>
                      <IconChartBar size={24} color="blue" />
                      <Title order={4}>Most Reserved Products</Title>
                    </Group>
                  </Group>
                  {productStats?.most_reserved && productStats.most_reserved.length > 0 ? (
                    productStats.most_reserved.map((product) => (
                      <ProductStatsCard
                        key={product.productId}
                        product={product}
                        label="Reserved"
                      />
                    ))
                  ) : (
                    <Text c="dimmed" ta="center" py="md">
                      No reserved products {selectedCategory ? 'in this category' : ''}
                    </Text>
                  )}
                </Stack>
              </Paper>

              <Paper shadow="sm" radius="md" p="md" withBorder>
                <Stack>
                  <Group justify="apart">
                    <Group>
                      <IconAlertTriangle size={24} color="orange" />
                      <Title order={4}>Low Stock Alert</Title>
                    </Group>
                  </Group>
                  {productStats?.lowest_stock && productStats.lowest_stock.length > 0 ? (
                    productStats.lowest_stock.map((product) => (
                      <ProductStatsCard key={product.productId} product={product} label="Stock" />
                    ))
                  ) : (
                    <Text c="dimmed" ta="center" py="md">
                      No low stock products {selectedCategory ? 'in this category' : ''}
                    </Text>
                  )}
                </Stack>
              </Paper>
            </Group>
          </Paper>
          <Paper shadow="xl" radius={'md'} withBorder p={'xl'} mt={20}>
            <ActionsGridViewAdmin />

            <Autocomplete
              rightSection={
                searchInput !== '' && (
                  <CloseButton
                    size="sm"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setSearchInput('');
                      handleSearch('');
                    }}
                    aria-label="Clear value"
                  />
                )
              }
              placeholder="Search products using Product IDs or Category IDs"
              mt={20}
              leftSection={<IconSearch style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
              mb="md"
              data={[
                {
                  group: 'Category IDs',
                  items: categories.map(
                    (category: { categoryId: any; name: any }) =>
                      `${category.categoryId} - ${category.name}`
                  ),
                },
                {
                  group: 'Product IDs',
                  items: productsList.map((product: { productId: any }) => product.productId),
                },
              ]}
              limit={5}
              comboboxProps={{
                transitionProps: { transition: 'pop', duration: 200 },
                dropdownPadding: 10,
                shadow: 'xl',
              }}
              value={searchInput}
              onChange={handleSearch}
            />
            <Card shadow="sm" padding="lg">
              <Text size="lg" fw={500}>
                Recently Uploaded Products
              </Text>
              {isLoading ? (
                <p>Loading images...</p>
              ) : (
                <div>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.slice(0, 5).map((product) => (
                      <Card key={product.id} shadow="xl" padding="lg" mt="md">
                        <Group>
                          <Stack align="stretch">
                            <Text>
                              <b>Product ID: </b>
                              {product.productId}
                            </Text>
                            <Text>
                              <b>Product Category:</b> {product.category}
                            </Text>

                            <Text>
                              <b>Product Type:</b> {product.type}
                            </Text>
                            <Text>
                              <b>Product Name:</b> {product.name}
                            </Text>
                            <Text lineClamp={4}>
                              <b>Product Description:</b> {product.description}
                            </Text>
                            <Text>
                              <b>Quantity:</b> {product.quantity}
                            </Text>
                            <Text c = "green">
                              <b>Reserved:</b> {product.reserved}
                              {product.reserved > 0 ? '(Reserved)' : ''}
                            </Text>
                            <Text c="red">
                              <b>Damaged Count:</b> {product.broken_damaged || 0}
                              {(product.broken_damaged ?? 0) > 0 ? '(Damaged)' : ''}
                            </Text>
                          </Stack>
                          <Image
                            mx={'auto'}
                            src={`${product.image}`}
                            alt={product.name}
                            radius="md"
                            h={200}
                            w={500}
                          />
                        </Group>
                        <Text mt="md" color="dimmed">
                          <b>Product Price (₱): </b>
                          {product.price}
                        </Text>
                        <Text mt="md" color="dimmed">
                          Reservees will only be charged if items are broken. See Terms of Service
                          for more information.
                        </Text>
                      </Card>
                    ))
                  ) : (
                    <Title order={1} ta={'center'}>
                      No products found
                    </Title>
                  )}
                </div>
              )}
            </Card>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel color="yellow" value="Update/Delete">
          <Paper shadow="xl" radius={'md'} p={'lg'}>
            <UpdateCrudProductsAdmin />
          </Paper>
        </Tabs.Panel>
      </Tabs>
    </Paper>
  );
};

export default ProductAddPage;
