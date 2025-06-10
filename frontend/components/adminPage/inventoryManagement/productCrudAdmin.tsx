import { useState, useEffect, JSXElementConstructor, Key, ReactElement, ReactNode } from 'react';
import axiosInstance from '@/utils/axiosInstance';
import {
  Table,
  Button,
  TextInput,
  Container,
  Title,
  Text,
  UnstyledButton,
  Group,
  Center,
  rem,
  ActionIcon,
  Modal,
  Stack,
  Pagination,
  Flex,
  Overlay,
  Autocomplete,
  NumberInput,
  LoadingOverlay,
  SimpleGrid,
  CloseButton,
  Tooltip,
  FileInput,
  Popover,
  Grid,
  ScrollArea,
  TableScrollContainer,
  Paper,
  Select,
} from '@mantine/core';
import {
  IconSelector,
  IconChevronDown,
  IconChevronUp,
  IconSearch,
  IconEdit,
  IconTrash,
  IconFileArrowLeft,
  IconFileArrowRight,
  IconUpload,
  IconDownload,
  IconX,
  IconAlertTriangle,
  IconChartBar,
} from '@tabler/icons-react';
import classes from '@/components/modules.css/TableSort.module.css';
import { notifications } from '@mantine/notifications';
import moment from 'moment-timezone';
import styles from '@/components/modules.css/TableSort.module.css';
import { useRouter } from 'next/router';
import { Dropzone, FileWithPath, IMAGE_MIME_TYPE } from '@mantine/dropzone';
// import { ReusableTable } from '@/components/transactionsUser';
// import classes from '../components/modules.css/Demo.module.css';
import useSWR, { mutate } from 'swr';
import ProductStatsCard from './ProductStatsCard';

interface ProductStats {
  most_reserved: Product[];
  lowest_stock: Product[];
}

interface Product {
  id: number;
  category: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  image: string;
  productId: string;
  type: string;
  reserved: number;
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
  return data.filter(
    (item) =>
      (item.productId?.toLowerCase() || '').includes(query) ||
      (item.name?.toLowerCase() || '').includes(query) ||
      (item.description?.toLowerCase() || '').includes(query) ||
      (item.price?.toString().toLowerCase() || '').includes(query) ||
      (item.quantity?.toString().toLowerCase() || '').includes(query) ||
      (item.image?.toLowerCase() || '').includes(query) ||
      (item.type?.toLowerCase() || '').includes(query) ||
      (item.category?.toLowerCase() || '').includes(query)
  );
}

function sortData(
  data: Product[],
  { sortBy, reversed, search }: { sortBy: keyof Product | null; reversed: boolean; search: string }
) {
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
const fetcher = (url: string) => axiosInstance.get(url).then((res) => res.data);

const UpdateCrudProductsAdmin = () => {
  // #region use states

  const [categoryID, setCategoryID] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<keyof Product | null>(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Product | null>(null);
  const [activePage, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileExportImport, setFileExportImport] = useState<File | null>(null);
  const [openedExportImport, setOpenedExportImport] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>('excel');

  const { data: productStats, error: statsError } = useSWR<ProductStats>(
    selectedCategory ? `getProductStats/?categoryId=${selectedCategory}` : 'getProductStats/',
    fetcher,
    { refreshInterval: 1000 }
  );

  const [files, setFiles] = useState<FileWithPath[]>([]);

  // #endregion

  const { data, error: ProductTypeError } = useSWR(
    `producttypeCrud/?category_id=${selectedProducts?.category || ''}`,
    fetcher
  );

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
  };

  const productTypesArray =
    data?.product_types.map((type: { id: string; name: string; description: string }) => ({
      value: type.name, // or type.name, depending on what you want to use as value
      label: type.name,
    })) || [];

  const previews = files.map((file, index) => {
    const imageUrl = URL.createObjectURL(file);
    return <img key={index} src={imageUrl} onLoad={() => URL.revokeObjectURL(imageUrl)} />;
  });

  const itemsPerPage = 5;

  // Fetch products with SWR
  const {
    data: productData,
    error: productError,
    isValidating: loadingProducts,
  } = useSWR('getadminProductDetail/', fetcher, { refreshInterval: 1000 });

  // Fetch categories with SWR
  const {
    data: categoryData,
    error: categoryError,
    isValidating: loadingCategories,
  } = useSWR('getCategories/', fetcher, { refreshInterval: 1000 });

  // Handle loading or error for products and categories
  const products = productData?.products || [];
  const categories = categoryData?.categories || [];

  // Filter products based on categoryID and searchQuery
  const filteredProducts = categoryID
    ? products.filter((product: { categoryId: string }) => product.categoryId === categoryID)
    : products;

  const sortedData = sortData(filteredProducts, {
    sortBy,
    reversed: reverseSortDirection,
    search: searchQuery,
  });

  const handleSort = (field: keyof Product) => {
    const reversed = field === sortBy ? !reverseSortDirection : false;
    setReverseSortDirection(reversed);
    setSortBy(field);
  };

  const handleDelete = async () => {
    setLoading(true);
    const productId = selectedProducts?.productId || '';
    try {
      const response = await axiosInstance.delete(`deleteProduct/`, { data: { productId } });
      if (response.status === 200) {
        // Revalidate SWR data to get the updated product list
        mutate('getadminProductDetail/');
        setDeleteModalOpened(false);
        notifications.show({
          title: 'Success',
          message: 'Product deleted successfully.',
          color: 'green',
        });
      }
    } catch (error) {
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
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('productId', selectedProducts?.productId || '');
      formData.append('name', selectedProducts?.name || '');
      formData.append('description', selectedProducts?.description || '');
      formData.append('price', selectedProducts?.price.toString() || '');
      formData.append('quantity', selectedProducts?.quantity.toString() || '');
      formData.append('type', selectedProducts?.type || '');

      // Handle file upload separately if files exist
      if (files.length > 0) {
        const file = files[0];
        try {
          // Get presigned URL from backend
          const presignedResponse = await axiosInstance.post('generate-presigned-url/', {
            file_name: file.name,
            file_type: file.type,
          });

          const { url, fields } = presignedResponse.data;

          // Create form data for S3 upload
          const s3FormData = new FormData();
          Object.entries(fields).forEach(([key, value]) => {
            s3FormData.append(key, value as string);
          });
          s3FormData.append('file', file);

          // Use fetch for S3 upload to handle redirects properly
          const uploadResponse = await fetch(url, {
            method: 'POST',
            body: s3FormData,
            // Don't set Content-Type header, let browser set it with boundary
          });

          if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.status}`);
          }

          // After successful upload, use the file name in your product update
          formData.append('image', file.name);
        } catch (error) {
          console.error('Error uploading to S3:', error);
          notifications.show({
            title: 'Error',
            message: 'Failed to upload image to S3',
            color: 'red',
          });
          setLoading(false);
          return;
        }
      }

      // Update product info in your database
      const response = await axiosInstance.put('updateProduct/', formData);

      if (response.status === 200) {
        mutate('getadminProductDetail/');
        handleCloseModal();
        notifications.show({
          title: 'Success',
          message: 'Product updated successfully',
          color: 'green',
        });
      }
    } catch (error) {
      console.error('Error updating product:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update product',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setEditModalOpened(false);
    setDeleteModalOpened(false);
    setSelectedProducts(null);
  };
  const paginatedData = sortedData.slice(
    (activePage - 1) * itemsPerPage,
    activePage * itemsPerPage
  );
  const exportProducts = async () => {
    try {
      const response = await axiosInstance.get('exportimportProduct/', {
        responseType: 'blob', // Important for binary data
      });
      // Create a link element to download the file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'products.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting products:', error);
    }
  };

  const handleImport = async () => {
    try {
      const formData = new FormData();
      if (fileExportImport) {
        formData.append('file', fileExportImport);
      } else {
        notifications.show({
          color: 'red',
          title: 'Error',
          message: 'No file selected',
        });
        return;
      }
      await axiosInstance.post('exportimportProduct/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      notifications.show({
        color: 'green',
        title: 'Success',
        message: 'Products uploaded successfully',
      });
      setFileExportImport(null);
      setOpenedExportImport(false);
    } catch (error) {
      notifications.show({
        color: 'red',
        title: 'Error',
        message: 'Failed to upload products',
      });
      mutate('getadminProductDetail/');
    }
  };

  // const { username } = useContext(AuthContext);

  return (
    <>
      <Flex justify="center" align="center" direction="row" wrap="wrap" className={classes.inner}>
        <Container fluid>
          <Group>
            <Title my={20} order={2}>
              Product History - Admin
            </Title>
            <Tooltip label="Export Products">
              <ActionIcon onClick={exportProducts} color="blue" variant="outline">
                <IconDownload />
              </ActionIcon>
            </Tooltip>
            <Popover
              opened={openedExportImport}
              onClose={() => setOpenedExportImport(false)}
              position="bottom"
              withArrow
              shadow="md"
              trapFocus={false} // Allow interaction with the file explorer
              // closeOnClickOutside={false} // Keep the popover open when clicking outside
            >
              <Popover.Target>
                <Tooltip label="Import Products">
                  <ActionIcon
                    onClick={() => setOpenedExportImport((o) => !o)}
                    color="green"
                    variant="outline"
                  >
                    <IconUpload />
                  </ActionIcon>
                </Tooltip>
              </Popover.Target>

              <Popover.Dropdown>
                <FileInput
                  placeholder="Choose file"
                  onChange={(selectedFile) => setFileExportImport(selectedFile)}
                  accept=".xlsx"
                  required
                />
                <Button
                  mt="md"
                  onClick={handleImport}
                  disabled={!fileExportImport} // Disable the button if no file is selected
                >
                  Import
                </Button>
              </Popover.Dropdown>
            </Popover>
          </Group>
          <Paper shadow="sm" radius={'md'} p={'lg'}>
            <Group justify="center" grow>
              <Select
                placeholder="Filter by category"
                value={selectedCategory}
                onChange={handleCategoryChange}
                data={categories.map((cat: { categoryId: any; name: any }) => ({
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
                        product={{ ...product, price: product.price.toString() }}
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
                      <ProductStatsCard
                        key={product.productId}
                        product={{ ...product, price: product.price.toString() }}
                        label="Stock"
                      />
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
          <Autocomplete
            placeholder="Search products using products ids"
            value={searchQuery}
            onChange={setSearchQuery}
            leftSection={<IconSearch style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
            rightSection={
              searchQuery !== '' && (
                <CloseButton
                  size="sm"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear value"
                />
              )
            }
            my={20}
            data={[
              {
                group: 'Product Categories',
                items: categories.map((category: { categoryId: any }) => ({
                  value: category.categoryId,
                  label: category.categoryId,
                })),
              },
              {
                group: 'Product IDs',
                items: products.map((product: { productId: any }) => ({
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
          ) : Array.isArray(products) && products.length === 0 ? (
            <Title order={1} ta="center" mt="md">
              There are no products yet. Please add a new one on the create tab first!
            </Title>
          ) : (
            <Container fluid>
              {/* <ScrollArea offsetScrollbars type="auto" className={styles.tableContainer}> */}
              <Grid>
                <Grid.Col span="auto">
                  <Paper shadow="xl" p="sm" radius="md" withBorder>
                    <TableScrollContainer minWidth={500}>
                      <Table
                        striped
                        highlightOnHover
                        withTableBorder
                        withColumnBorders
                        // className={styles.table}
                        horizontalSpacing="xl"
                        verticalSpacing="xs"
                      >
                        <Table.Thead>
                          <Table.Tr>
                            <Th
                              sorted={sortBy === 'productId'}
                              reversed={reverseSortDirection}
                              onSort={() => handleSort('productId')}
                            >
                              Product ID
                            </Th>

                            <Th
                              sorted={sortBy === 'type'}
                              reversed={reverseSortDirection}
                              onSort={() => handleSort('type')}
                            >
                              Product Type
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
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {paginatedData.map((products) => {
                            // const products = products.items.map((item: { product: any; }) => item.product.productId).join(', ');
                            // const quantities = products.items.map((item: { quantity: any; }) => item.quantity).join(', ');

                            return (
                              <Table.Tr
                                key={products.productId}
                                // className={styles.tr}
                                id={products.productId}
                              >
                                <Table.Td className={styles.td}>{products.productId}</Table.Td>
                                <Table.Td className={styles.td}>{products.type}</Table.Td>
                                <Table.Td className={styles.td}>{products.name}</Table.Td>
                                <Table.Td className={styles.td}>{products.description}</Table.Td>
                                <Table.Td className={styles.td}>{products.price}</Table.Td>
                                <Table.Td className={styles.td}>{products.quantity}</Table.Td>
                                <Table.Td className={styles.td}>
                                  {' '}
                                  <img
                                    style={{
                                      margin: 'auto',
                                      borderRadius: 'md',
                                      height: 100,
                                      width: 100,
                                    }}
                                    src={`${products.image}`}
                                    alt={products.name}
                                  />
                                </Table.Td>
                                <Table.Td className={styles.td}>
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
                                </Table.Td>
                              </Table.Tr>
                            );
                          })}
                        </Table.Tbody>
                      </Table>
                    </TableScrollContainer>
                  </Paper>
                </Grid.Col>
              </Grid>
              {/* </ScrollArea> */}
              <Flex justify="center">
                <Pagination
                  value={activePage}
                  onChange={setPage}
                  total={Math.ceil(sortedData.length / itemsPerPage)}
                  mt="md"
                  color="blue"
                />
              </Flex>
            </Container>
          )}

          {/* Edit Modal */}
          <Modal opened={editModalOpened} onClose={handleCloseModal} title="Edit Product">
            <LoadingOverlay
              pos="absolute"
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

              <Autocomplete
                label="Product Type"
                placeholder="Select product type"
                data={productTypesArray}
                value={selectedProducts?.type || ''}
                rightSection={
                  <ActionIcon
                    variant="transparent"
                    onClick={() => {
                      selectedProducts?.type &&
                        setSelectedProducts((prev) => (prev ? { ...prev, type: '' } : null));
                    }}
                  >
                    <IconX style={{ width: '70%', height: '70%' }} stroke={1.5} />
                  </ActionIcon>
                }
                onChange={(value) =>
                  setSelectedProducts((prev) => ({ ...prev, type: value }) as Product)
                }
                style={{ width: '100%' }}
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
                data={categories.map((category: { categoryId: any }) => ({
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
                    <Title order={2}>New Product Image</Title> {previews}
                  </>
                ) : (
                  <>
                    <Title order={2}> Old Product Image</Title>
                    <img src={`${selectedProducts?.image}`} alt={selectedProducts?.name} />
                  </>
                )}
              </>

              <Button onClick={handleEdit}>Save Changes</Button>
            </Stack>
          </Modal>

          {/* Update Modal */}
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
