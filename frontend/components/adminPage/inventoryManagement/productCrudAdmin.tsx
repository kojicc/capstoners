import { useState, useEffect, AwaitedReactNode, JSXElementConstructor, Key, ReactElement, ReactNode } from 'react';
import axiosInstance from '@/utils/axiosInstance';
import {
  Table, Button, TextInput, Container, Title, Text, UnstyledButton, Group, Center, rem, ActionIcon, Modal, Stack,
  Pagination,
  Flex,
  Overlay,
  Autocomplete,
  NumberInput,
  LoadingOverlay,
  SimpleGrid,
} from '@mantine/core';
import { IconSelector, IconChevronDown, IconChevronUp, IconSearch, IconEdit, IconTrash } from '@tabler/icons-react';
import classes from '@/components/modules.css/TableSort.module.css';
import { notifications } from '@mantine/notifications';
import moment from 'moment-timezone';
import styles from '@/components/modules.css/TableSort.module.css';
import { Header } from '@/components/LandingPage/header/HeaderLP';
import { useRouter } from 'next/router';
import { Dropzone, FileWithPath, IMAGE_MIME_TYPE } from '@mantine/dropzone';
// import { ReusableTable } from '@/components/transactionsUser';
// import classes from '../components/modules.css/Demo.module.css';




interface Product {
  category: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  image: string;
  productId: string;
}

interface Category {
  categoryId: string;
  name: string;
  description: string;
  icon: string;
}

export interface ThProps {
  children: React.ReactNode;
  sorted?: boolean;
  reversed?: boolean;
  onSort?: () => void;
}

function Th({ children, reversed, sorted, onSort }: ThProps) {
  const Icon = sorted ? (reversed ? IconChevronUp : IconChevronDown) : IconSelector;
  return (
    <Table.Th className={classes.th}>
      <UnstyledButton onClick={onSort} className={classes.control}>
        <Group justify="space-between">
          <Text fw={500} fz="sm">
            {children}
          </Text>
          <Center className={classes.icon}>
            <Icon style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
          </Center>
        </Group>
      </UnstyledButton>
    </Table.Th>
  );
}

function filterData(data: Product[] | undefined, search: string): Product[] {
  if (!Array.isArray(data)) {
    console.error('Data is not an array or is undefined');
    return [];
  }

  const query = search.toLowerCase().trim();
  return data.filter((item) =>
    (item.productId?.toLowerCase() || '').includes(query)
    || (item.name?.toLowerCase() || '').includes(query)
   
  );
}

function sortData(data: Product[], { sortBy, reversed, search }: { sortBy: keyof Product | null, reversed: boolean, search: string }) {
  const filteredData = filterData(data, search);
  // console.log('filteredData:', filteredData);
  return filteredData.sort((a, b) => {
    if (!sortBy) return 0;

    const aValue = a[sortBy];
    const bValue = b[sortBy];

    const aString = typeof aValue === 'string' ? aValue.toLowerCase() : '';
    const bString = typeof bValue === 'string' ? bValue.toLowerCase() : '';

    return reversed ? bString.localeCompare(aString) : aString.localeCompare(bString);
  });
}

const UpdateCrudProductsAdmin = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryID, setCategoryID] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortedData, setSortedData] = useState<Product[]>([]);
  const [sortBy, setSortBy] = useState<keyof Product | null>(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  // const [selectedProducts, setSelectedProducts] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Product | null>(null);
  const [activePage, setPage] = useState(1);
  const [quantity, setQuantity] = useState<number>();
  const [disabled, setDisabled] = useState<boolean[]>([]);
  const itemsPerPage = 5;
  const router = useRouter();
  const [files, setFiles] = useState<FileWithPath[]>([]);

  const previews = files.map((file, index) => {
    const imageUrl = URL.createObjectURL(file);
    return <img key={index} src={imageUrl} onLoad={() => URL.revokeObjectURL(imageUrl)} />;
  });

  useEffect(() => {
    if (router.query.searchQuery) {
      setSearchQuery(router.query.searchQuery as string);
    }
  }, [router.query.searchQuery]);

  //pampakita ng data sa table na sinosort muna thru sortData function
  useEffect(() => {
    setSortedData(
      sortData(products, { sortBy, reversed: reverseSortDirection, search: searchQuery })
    );
  }, [products, sortBy, reverseSortDirection, searchQuery]);

  const fetchProducts = async () => {
    try {
      const response = await axiosInstance.get('getadminProductDetail/');
      if (response.status === 200) {
        if (categoryID) {
          const filteredProducts = response.data.products.filter(
            (product: { categoryId: string }) => product.categoryId === categoryID
          );
          setProducts(filteredProducts);
        } else {
          setProducts(response.data.products);
        }
      } else {
        setError('No products found');
      }
    } catch (error) {
      setError('Failed to fetch products');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSort = (field: keyof Product) => {
    const reversed = field === sortBy ? !reverseSortDirection : false;
    setReverseSortDirection(reversed);
    setSortBy(field);
  };

  const handleDelete = async () => {
    const productId = selectedProducts?.productId || '';
    setLoading(true);

    try {
      const response = await axiosInstance.delete(`deleteProduct/`, { data: { productId } });

      if (response.status === 200) {
        fetchProducts();
        setError('');
        notifications.show({
          title: 'Success',
          message: 'Product deleted successfully.',
          color: 'green',
        });
        setDeleteModalOpened(false);
      } else {
        setError('Failed to delete product');
        notifications.show({
          title: 'Error',
          message: 'Failed to delete product.',
          color: 'red',
        });
      }
    } catch (error) {
      setError('Delete failed');
      notifications.show({
        title: 'Error',
        message: 'Failed to delete product.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    const formData = new FormData();
    formData.append('productId', selectedProducts?.productId || '');
    formData.append('name', selectedProducts?.name || '');
    formData.append('description', selectedProducts?.description || '');
    formData.append('price', selectedProducts?.price.toString() || '');
    formData.append('quantity', selectedProducts?.quantity.toString() || '');
    formData.append('image', files[0] || '');
    console.log('formData:', formData.get('image'));

    setLoading(true);

    try {
      const response = await axiosInstance.put('updateProduct/', formData);

      handleCloseModal();
      fetchProducts();
      notifications.show({
        title: 'Success',
        message: 'Product updated successfully.',
        color: 'green',
      });
    } catch (error) {
      console.error('Error updating products:', error);
    } finally {
      setLoading(false);
    }
  };

  const [value, setValue] = useState<string[]>([]);

  const handleCloseModal = () => {
    setEditModalOpened(false);
    setSelectedProducts(null);
    setQuantity(0);
    setDisabled([]);
    setValue([]);
    setFiles([]);
  };

  const paginatedData = sortedData.slice(
    (activePage - 1) * itemsPerPage,
    activePage * itemsPerPage
  );

  // const predefinedStatuses = [
  // 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED',
  // 'AWAITING RETURN', 'DAMAGED/LOST/PARTIALLY_COMPLETED', 'AWAITING PAYMENT'
  // ];

  // const combinedStatuses = [
  //   ...new Set([
  //     ...reservations.map(products => products.productId),
  //     ...predefinedStatuses
  //   ])
  // ];
  useEffect(() => {
    const test = products.map((product) => product.category);
    console.log('test:', categories);
  }, [products]);

  const getCategories = async () => {
    const response = await axiosInstance.get('getCategories/');
    setCategories(response.data.categories);
  };

  useEffect(() => {
    getCategories();
  }, []);

  return (
    <>
      <Flex justify="center" align="center" direction="row" wrap="wrap" className={classes.inner}>
        <Container>
          <Title my={20} c={'black'} order={2}>
            Product History - Admin
          </Title>
          <Autocomplete
            placeholder="Search products using products ids"
            value={searchQuery}
            onChange={setSearchQuery}
            leftSection={<IconSearch style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
            my={20}
            data={[
              {
                group: 'Product Categories',
                items: categories.map((category) => ({
                  value: category.categoryId,
                  label: category.categoryId,
                })),
              },
              {
                group: 'Product IDs',
                items: products.map((product) => ({
                  value: product.productId,
                  label: product.productId,
                })),
              },
            ]}
            limit={5}
            comboboxProps={{
              transitionProps: { transition: 'pop', duration: 200 },
              dropdownPadding: 10,
              shadow: 'xl',
            }}
          />

          {loading ? (
            <Text>Loading...</Text>
          ) : error ? (
            <Text color="red">{error}</Text>
          ) : (
            <>
              <Table className={styles.table} horizontalSpacing="xl" verticalSpacing="xs">
                <thead>
                  <tr>
                    <Th
                      sorted={sortBy === 'productId'}
                      reversed={reverseSortDirection}
                      onSort={() => handleSort('productId')}
                    >
                      Product ID
                    </Th>

                    <Th
                      sorted={sortBy === 'name'}
                      reversed={reverseSortDirection}
                      onSort={() => handleSort('name')}
                    >
                      Product Name
                    </Th>

                    <Th
                      sorted={sortBy === 'description'}
                      reversed={reverseSortDirection}
                      onSort={() => handleSort('description')}
                    >
                      Product Description
                    </Th>

                    <Th
                      sorted={sortBy === 'price'}
                      reversed={reverseSortDirection}
                      onSort={() => handleSort('price')}
                    >
                      Product Price
                    </Th>

                    <Th
                      sorted={sortBy === 'quantity'}
                      reversed={reverseSortDirection}
                      onSort={() => handleSort('quantity')}
                    >
                      Product Quantity
                    </Th>

                    <Th
                      sorted={sortBy === 'image'}
                      reversed={reverseSortDirection}
                      onSort={() => handleSort('image')}
                    >
                      Product Image
                    </Th>

                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((products) => {
                    // const products = products.items.map((item: { product: any; }) => item.product.productId).join(', ');
                    // const quantities = products.items.map((item: { quantity: any; }) => item.quantity).join(', ');

                    return (
                      <tr key={products.productId} className={styles.tr} id={products.productId}>
                        <td className={styles.td}>{products.productId}</td>
                        <td className={styles.td}>{products.name}</td>
                        <td className={styles.td}>{products.description}</td>
                        <td className={styles.td}>{products.price}</td>
                        <td className={styles.td}>{products.quantity}</td>
                        <td className={styles.td}>
                          {' '}
                          <img
                            style={{ margin: 'auto', borderRadius: 'md', height: 100, width: 100 }}
                            src={`http://localhost:8000${products.image}`}
                            alt={products.name}
                          />
                        </td>
                        <td className={styles.td}>
                          <Group gap="xs">
                            <ActionIcon
                              onClick={() => {
                                setSelectedProducts(products);
                                setEditModalOpened(true);
                              }}
                            >
                              <IconEdit />
                            </ActionIcon>
                            <ActionIcon
                              color="red"
                              onClick={() => {
                                setSelectedProducts(products);
                                setDeleteModalOpened(true);
                              }}
                            >
                              <IconTrash />
                            </ActionIcon>
                          </Group>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
              <Flex justify="center">
                <Pagination
                  value={activePage}
                  onChange={setPage}
                  total={Math.ceil(sortedData.length / itemsPerPage)}
                  mt="md"
                  color="blue"
                />
              </Flex>
            </>
          )}

          {/* Edit Modal */}
          <Modal opened={editModalOpened} onClose={handleCloseModal} title="Edit Product">
            <LoadingOverlay
              visible={loading}
              zIndex={1000}
              overlayProps={{ radius: 'sm', blur: 2 }}
            />

            <Stack>
              <TextInput
                disabled
                label="Product ID"
                value={selectedProducts?.productId || ''}
                onChange={(event) =>
                  setSelectedProducts(
                    (prev) => ({ ...prev, productId: event.currentTarget.value }) as Product
                  )
                }
              />

              <TextInput
                label="Product Name"
                value={selectedProducts?.name || ''}
                onChange={(event) =>
                  setSelectedProducts(
                    (prev) => ({ ...prev, name: event.currentTarget.value }) as Product
                  )
                }
              />

              <TextInput
                label="Product Description"
                value={selectedProducts?.description || ''}
                onChange={(event) =>
                  setSelectedProducts(
                    (prev) => ({ ...prev, description: event.currentTarget.value }) as Product
                  )
                }
              />

              <NumberInput
                label="Product Price"
                value={selectedProducts?.price || 0}
                onChange={(event) =>
                  setSelectedProducts((prev) => ({ ...prev, price: Number(event) }) as Product)
                }
              />

              <NumberInput
                allowDecimal={true}
                decimalScale={2}
                label="Product Quantity"
                value={selectedProducts?.quantity || 0}
                onChange={(event) =>
                  setSelectedProducts((prev) => ({ ...prev, quantity: Number(event) }) as Product)
                }
              />

              <Autocomplete
                label="Product Category"
                disabled
                data={categories.map((category) => ({
                  value: category.categoryId,
                  label: category.categoryId,
                }))}
                placeholder="Select category"
                value={selectedProducts?.category || ''}
                onChange={(value) =>
                  setSelectedProducts((prev) => ({ ...prev, category: value! }) as Product)
                }
              />

              <Dropzone accept={IMAGE_MIME_TYPE} onDrop={setFiles}>
                <Text ta="center">Drop images here</Text>
              </Dropzone>
              <>
                {files.length ? (
                  <>
                    <Title order={2} c={'black'}>
                      New Product Image
                    </Title>{' '}
                    {previews}
                  </>
                ) : (
                  <>
                    <Title order={2} c={'black'}>
                      {' '}
                      Old Product Image
                    </Title>
                    <img
                      src={`http://localhost:8000${selectedProducts?.image}`}
                      alt={selectedProducts?.name}
                    />
                  </>
                )}
              </>

              <Button onClick={handleEdit}>Save Changes</Button>
            </Stack>
          </Modal>

          <Modal
            opened={deleteModalOpened}
            onClose={() => setDeleteModalOpened(false)}
            title="Delete Product"
          >
            <LoadingOverlay
              visible={loading}
              zIndex={1000}
              overlayProps={{ radius: 'sm', blur: 2 }}
            />

            <Text>Are you sure you want to delete this products?</Text>
            <Group justify="center" mt="md">
              <Button color="red" onClick={handleDelete}>
                Delete
              </Button>
              <Button onClick={() => setDeleteModalOpened(false)}>Cancel</Button>
            </Group>
          </Modal>
        </Container>
      </Flex>
    </>
  );
};

export default UpdateCrudProductsAdmin;