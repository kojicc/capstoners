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
} from '@tabler/icons-react';
import ActionsGridViewAdmin from '@/components/ActionsGridViewAdmin';
import UpdateCrudProductsAdmin from '@/components/adminPage/inventoryManagement/productCrudAdmin';
import { useCategoryID } from '../../../utils/categoryIDContext';
import axiosInstance from '../../../utils/axiosInstance';
import { notifications } from '@mantine/notifications';
import { useForm } from '@mantine/form';
import { readLocalStorageValue, useLocalStorage } from '@mantine/hooks';

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  quantity: number;
  image: string;
  productId: string;
  category: string;
}

interface Category {
  categoryId: string;
  name: string;
  description: string;
  icon: string;
}

const ProductAddPage = () => {
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

  let categoryData = [];
  const [categories, setCategories] = useState<Category[]>([]);

//   // const { role } = useContext(AuthContext);
//   // const role = Cookies.get('Role');
// const { role, loading } = useContext(AuthContext);

//   // Custom hook to protect the route based on roles
//   const { isRoleAllowed } = useProtectedRoute({ allowedRoles: ['student', 'admin'] });

  const fetchImages = async () => {
    try {
      const { categoryID } = state;

      if (categoryID) {
        // Only send the categoryID if it is truthy (not null, undefined, or empty)
        const response = await axios.get('getImages/', {
          params: { categoryID },
        });
        setImages(response.data.images);
        setFilteredProducts(response.data.images);
        setFiltered(true);
      } else {
        const response = await axios.get('getImages/', {
          params: { categoryID: '' },
        }); // Fetch all images when categoryID is falsy (null, empty, etc.)
        setImages(response.data.images);
        setFilteredProducts(response.data.images);
        setFiltered(false);
        setProductsList(response.data.images);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [state.categoryID]); // Fetch images when the component mounts

  const router = useRouter();

  // useEffect(() => {
  //   if (!isRoleAllowed) {
  //     modals.openConfirmModal({
  //       title: 'Please confirm your action',
  //       children: (
  //         <Text size="sm">
  //           Your role is{' '}
  //           <b>
  //             <i>{role}</i>
  //           </b>{' '}
  //           and is currently unauthorized, please login as student/admin first.
  //         </Text>
  //       ),
  //       labels: { confirm: 'Login', cancel: 'Go back to home page' },
  //       onCancel: () => router.push('/'),
  //       onConfirm: () => router.push('/login'),
  //       withCloseButton: false,
  //     });
  //   }
  // }, []); // This will run the effect whenever `isRoleAllowed` changes

  const categoryMap: { [key: string]: string } = {
    Alcohol: 'ALC',
    Glassware: 'GLW',
    Linens: 'LIN',
    Plates: 'PLT',
    Utensils: 'UTN',
    'Tableware/Furniture': 'TWF',
  };

  useEffect(() => {
    // Update prodCategoryID based on the current prodCategory
    setprodCategoryID(categoryMap[prodCategory] || '');
  }, [prodCategory]);

  useEffect(() => {
    const fetchNextProductId = async () => {
      if (!prodCategoryID) return; // Exit early if prodCategoryID is not set

      try {
        const response = await axiosInstance.post(
          'getProduct/',
          {
            // Use POST request
            categoryID: prodCategoryID, // Send prodCategory in the request body
          },
          {}
        );

        if (response.status === 200) {
          setNextProductId(response.data.nextProductId);
        } else {
          setError('Failed to retrieve the next product ID');
        }
      } catch (error) {
        setError((error as Error).message || 'An error occurred');
      }
    };

    fetchNextProductId();
  }, [prodCategoryID]); // The effect depends on prodCategory

  const previews = prodImage.map((file, index) => {
    const imageUrl = URL.createObjectURL(file);
    return (
      <Flex justify={'center'} key={index}>
        <Image w={400} h={400} src={imageUrl} onLoad={() => URL.revokeObjectURL(imageUrl)} />
      </Flex>
    );
  });

  const handleUpload = async () => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('name', prodName);
    formData.append('description', prodDesc);
    formData.append('price', prodPrice.toString());
    formData.append('quantity', prodQuantity.toString());
    formData.append('category', prodCategory);
    if (prodImage.length > 0) {
      formData.append('image', prodImage[0]);
    }

    try {
      const response = await axios.post('uploadProduct/', formData);

      setIsLoading(false);
      notifications.show({
        title: 'Success',
        message: 'Product uploaded successfully',
        color: 'teal',
        icon: <IconSettings />,
      });
      setprodCategoryID('');
      setprodName('');
      setprodDesc('');
      setprodPrice(0);
      setprodQuantity(0);
      setprodCategory('');

      setprodImage([]);
      setNextProductId('');
      fetchImages();

      if (response.status === 400) {
        notifications.show({
          title: 'Error',
          message: 'Product not uploaded',
          color: 'red',
          icon: <IconSettings />,
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

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

  useEffect(() => {
    fetchCategories();
    removeValue();
  }, [categoryChanged]);

  useEffect(() => {
    const value = readLocalStorageValue({ key: 'categoryChanged' });
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('getCategories/');
      categoryData = response.data.categories;
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSearch = (value: string) => {
    setSearchInput(value);
    const searchValue = value.trim().toLowerCase().split(' - ')[0];

    if (searchValue === '') {
      setFilteredProducts(productsList);
      return;
    }

    const filteredProducts = productsList.filter((product) => {
      return (
        product.productId.toLowerCase().includes(searchValue) ||
        product.category.toLowerCase().includes(searchValue) ||
        product.name.toLowerCase().includes(searchValue)
      );
    });

    setFilteredProducts(filteredProducts);
  };

  return (
    <Paper pl={0} bg={'#ffff'}>
      <Container fluid>
        <LoadingOverlay
          visible={isLoading}
          zIndex={1000}
          overlayProps={{ radius: 'sm', blur: 2 }}
        />

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
            <Stack gap="xl">
              <Card shadow="sm" padding="lg">
                <Text size="lg" fw={500}>
                  Product Details
                </Text>

                <TextInput
                  label="Product ID"
                  placeholder="Choose category to create new productID"
                  leftSection={focused ? <IconIdBadge2 style={iconStyle} /> : null}
                  required
                  classNames={classes}
                  value={nextProductId}
                  onChange={(event) => setprodID(event.currentTarget.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  mt="md"
                  disabled
                  autoComplete="nope"
                  data-floating={floating}
                  labelProps={{ 'data-floating': floating }}
                />

                <TextInput
                  label="Product Name"
                  placeholder="Enter product name"
                  leftSection={focused ? <IconBadgeTmFilled style={iconStyle} /> : null}
                  required
                  aria-required
                  classNames={classes}
                  value={prodName}
                  onChange={(event) => setprodName(event.currentTarget.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  mt="md"
                  autoComplete="nope"
                  data-floating={floating}
                  labelProps={{ 'data-floating': floating }}
                />
                <TextInput
                  label="Product Description"
                  placeholder="Enter product description"
                  leftSection={focused ? <IconFileDescription style={iconStyle} /> : null}
                  required
                  classNames={classes}
                  value={prodDesc}
                  onChange={(event) => setprodDesc(event.currentTarget.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  mt="md"
                  autoComplete="nope"
                  data-floating={floating}
                  labelProps={{ 'data-floating': floating }}
                />
                <NumberInput
                  leftSection={focused ? '₱' : null}
                  label="Product Price"
                  placeholder="Enter product price"
                  required
                  classNames={classes}
                  value={prodPrice !== 0 ? prodPrice.toString() : ''}
                  allowDecimal={false}
                  onChange={(value) => setprodPrice(Number(value))}
                  onClick={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  mt="md"
                  autoComplete="nope"
                  data-floating={floating}
                  labelProps={{ 'data-floating': floating }}
                />

                <NumberInput
                  label="Product Quantity"
                  placeholder="Enter product quantity"
                  required
                  classNames={classes}
                  leftSection={focused ? <IconBuildingWarehouse style={iconStyle} /> : null}
                  value={prodQuantity !== 0 ? prodQuantity.toString() : ''}
                  onChange={(value) => setprodQuantity(Number(value))}
                  onClick={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  data-floating={floating}
                  labelProps={{ 'data-floating': floating }}
                  mt="md"
                />

                <Select
                  mt="md"
                  classNames={classes}
                  leftSection={focused ? <IconCategoryFilled style={iconStyle} /> : null}
                  defaultSearchValue={prodCategory}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  data={categories.map((category: { name: any }) => category.name)}
                  placeholder="Pick a category"
                  label="Product Category"
                  labelProps={{ 'data-floating': floating }}
                  clearable
                  onChange={(value: string | null) => setprodCategory(value ?? '')}
                />
                <Dropzone my={20} accept={IMAGE_MIME_TYPE} onDrop={setprodImage}>
                  <Text ta="center">Drop images here</Text>
                </Dropzone>
                <SimpleGrid
                  type="container"
                  cols={{ base: 1, sm: 2, lg: 5 }}
                  spacing={{ base: 10, sm: 'xl' }}
                  verticalSpacing={{ base: 'md', sm: 'xl' }}
                  mt={previews.length > 0 ? 'xl' : 0}
                >
                  {previews.slice(0, 5)}
                </SimpleGrid>
                <Group justify="center" mt="xl">
                  <Button onClick={handleUpload}>Upload</Button>
                </Group>
              </Card>
              <ActionsGridViewAdmin />

              <Autocomplete
                rightSection={
                  searchInput !== '' && (
                    <CloseButton
                      size="sm"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => { setSearchInput(''); handleSearch('');}}
                      aria-label="Clear value"
                    />
                  )
                }
                placeholder="Search products using Product IDs or Category IDs"
                mt={20}
                leftSection={
                  <IconSearch style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
                }
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
                        <Card key={product.id} shadow="sm" padding="lg" mt="md">
                          <Flex
                            direction={{ base: 'column', sm: 'row' }}
                            gap={{ base: 'sm', sm: 'lg' }}
                            justify={{ sm: 'center' }}
                            align="center"
                            wrap="nowrap"
                          >
                            <Stack>
                              <Text>
                                <b>Product ID: </b>
                                {product.productId}
                              </Text>
                              <Text>
                                <b>Product Category:</b> {product.category}
                              </Text>
                              <Text>
                                <b>Product Name:</b> {product.name}
                              </Text>
                              <Text lineClamp={4}>
                                <b>Product Description:</b> {product.description}
                              </Text>
                              <Text>
                                <b>Product Price (₱): </b>
                                {product.price}
                              </Text>
                              <Text>
                                <b>Quantity:</b> {product.quantity}
                              </Text>
                            </Stack>
                            <Image
                              mx={'auto'}
                              src={`http://localhost:8000${product.image}`}
                              alt={product.name}
                              radius="md"
                              h={200}
                              w={500}
                            />
                          </Flex>
                        </Card>
                      ))
                    ) : (
                      <p>No products found</p>
                    )}
                  </div>
                )}
              </Card>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel color="yellow" value="Update/Delete">
            <Container fluid bg={'#417A46'}>
              <UpdateCrudProductsAdmin />
            </Container>
          </Tabs.Panel>
        </Tabs>
      </Container>
    </Paper>
  );
};

export default ProductAddPage;
