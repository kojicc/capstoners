import {
  Card,
  Text,
  SimpleGrid,
  UnstyledButton,
  Anchor,
  Group,
  useMantineTheme,
  Button,
  Flex,
  Popover,
  LoadingOverlay,
  Modal,
  Stack,
  TextInput,
  Tooltip,
  Autocomplete,
  Image,
  NumberInput,
  ActionIcon,
} from '@mantine/core';
import * as TablerIcons from '@tabler/icons-react';
import classes from './modules.css/ActionsGrid.module.css';
import axios from '../utils/axiosInstance';
import { useCategoryID } from '../utils/categoryIDContext';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useState, useEffect } from 'react';
import { useDisclosure, useLocalStorage } from '@mantine/hooks';
import useSWR, { mutate } from 'swr';
import { get } from 'http';
import { Dropzone, FileWithPath, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { IconX } from '@tabler/icons-react';

interface Category {
  categoryId: string;
  name: string;
  description: string;
  icon: string;
}
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
}

interface ProductType {
  id: string;
  name: string;
  description: string;
}
let mockdata: any[] = [];

let productTypesArray: ProductType[] = [];
const fetcher = (url: string) => axios.get(url).then((res) => res.data);
const ActionsGridViewAdmin = () => {
  const [productTypes, setProductTypes] = useState('');
  const [createProductName, setCreateProductName] = useState('');
  const [createProductDescription, setCreateProductDescription] = useState('');
  const [createProductPrice, setCreateProductPrice] = useState<string | number>('');
  const [createProductQuantity, setCreateProductQuantity] = useState<string | number>('');
  const [createProductCategory, setCreateProductCategory] = useState('');
  const [createProductImage, setCreateProductImage] = useState('');
  const [prodImage, setprodImage] = useState<FileWithPath[]>([]);
  const [createCategoryID, setCreateCategoryID] = useState('');
  console.log('prodImage', prodImage[0]);

  const previews = prodImage.map((file, index) => {
    const imageUrl = URL.createObjectURL(file);
    return (
      <Flex justify={'center'} key={index}>
        <Image w={400} h={400} src={imageUrl} onLoad={() => URL.revokeObjectURL(imageUrl)} />
      </Flex>
    );
  });

  const { data, error } = useSWR(`producttypeCrud/?category_id=${createCategoryID}`, fetcher);
  const productTypesArray =
    data?.product_types.map((type: { id: string; name: string; description: string }) => ({
      value: type.name, // or type.name, depending on what you want to use as value
      label: type.name,
    })) || [];

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryID, setCategoryID] = useState('');
  const { state, dispatch } = useCategoryID();
  const [loading, setLoading] = useState(false);

  const [createCategoryName, setCreateCategoryName] = useState('');
  const [createCategoryDescription, setCreateCategoryDescription] = useState('');
  const [createCategoryIcon, setCreateCategoryIcon] = useState('');
  const [opened, setOpened] = useState(false);
  const [editOpened, setEditOpened] = useState(false);
  const [addOpened, setAddOpened] = useState(false);
  const [popoverOpened, setPopoverOpened] = useState<{ [key: string]: boolean }>({});
  const [hoverOpened, { close, open }] = useDisclosure(false);
  const theme = useMantineTheme();
  const [nextProductID, setNextProductID] = useState('');
  const [globalCategoryChanged, setGlobalCategoryChanged, removeValue] = useLocalStorage({
    key: 'categoryChanged',
    defaultValue: '0',
  });

  const getNextProductID = async () => {
    if (!categoryID) return; // Exit early if prodCategoryID is not set

    try {
      const response = await axios.get('getProduct/', {
        params: {
          categoryID: categoryID, // Send prodCategory in the request parameters
        },
      });

      if (response.status === 200) {
        setNextProductID(response.data.nextProductId);
      }
    } catch (error) {
      console.log((error as Error).message || 'An error occurred');
    }
  };

  const getCategories = async () => {
    const response = await axios.get('getCategories/');
    setCategories(response.data.categories);

    mockdata = response.data.categories.map(
      (category: { categoryId: any; icon: any; name: string }) => {
        const IconComponent =
          (TablerIcons as { [key: string]: any })[category.icon] || TablerIcons['IconQuestionMark'];
        return {
          title: `${category.name} - ${category.categoryId}`,
          icon: IconComponent,
          color: 'violet',
          id: category.categoryId,
        };
      }
    );
  };

  useEffect(() => {
    getCategories();
  }, []);

  const handleButtonClick = (id: string) => {
    console.log('Button clicked, setting categoryID to:', id);
    setCategoryID(id);
    dispatch({ type: 'SET_CATEGORY_ID', payload: id });

    const selectedCategory = categories.find((category) => category.categoryId === id);

    if (selectedCategory) {
      setCreateCategoryID(selectedCategory.categoryId);
      setCreateCategoryName(selectedCategory.name);
      setCreateCategoryDescription(selectedCategory.description);
      setCreateCategoryIcon(selectedCategory.icon);
    }
  };

  const handleDeleteButtonClick = (id: string) => {
    setPopoverOpened((prev) => ({ ...prev, [id]: false })); // Close the specific popover

    modals.openConfirmModal({
      title: `Delete Category - ${id}`,
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete this category? This action is destructive and you will
          regret it if done without proper considerations.
        </Text>
      ),
      labels: { confirm: 'Delete Category', cancel: "No don't delete it" },
      confirmProps: { color: 'red' },
      onCancel: () => console.log('Canceled'),
      onConfirm: async () => {
        try {
          const response = await axios.delete(`deleteCategory/`, { data: { categoryId: id } });
          console.log('Response:', response);
          getCategories();
          notifications.show({
            title: 'Category Deleted',
            message: `Category with ID ${id} has been deleted successfully`,
            color: 'red',
            icon: '🗑️',
            autoClose: true,
            autoCloseIn: 5000,
          });
          setGlobalCategoryChanged('1');
        } catch (error) {
          console.error('Error:', error);
        }
        dispatch({ type: 'SET_CATEGORY_ID', payload: '' });
      },
    });
  };

  const handleEditButtonClick = (id: string) => {
    setPopoverOpened((prev) => ({ ...prev, [id]: false })); // Close the specific popover
  };

  const handleAddButtonClick = (id: string) => {
    setPopoverOpened((prev) => ({ ...prev, [id]: false })); // Close the specific popover
    getNextProductID();
  };

  const items = mockdata.map((item) => (
    <Popover
      key={item.id}
      width={200}
      position="bottom"
      withArrow
      shadow="md"
      opened={popoverOpened[item.id] || hoverOpened || false}
      onClose={() => setPopoverOpened((prev) => ({ ...prev, [item.id]: false }))}
    >
      <Popover.Target>
        <Tooltip label="Click to view more options">
          <UnstyledButton
            onClick={() => {
              setPopoverOpened((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
              handleButtonClick(item.id);
            }}
            className={classes.item}
          >
            {item.name}
            <item.icon color={theme.colors[item.color][6]} size="2rem" />
            <Text size="xs" mt={7}>
              {item.title}
            </Text>
          </UnstyledButton>
        </Tooltip>
      </Popover.Target>
      <Popover.Dropdown>
        <Flex direction="column" gap="md" p="md">
          <Text>Do you want to edit or delete this category or add a product?</Text>
          <Button color="red" onClick={() => handleDeleteButtonClick(item.id)}>
            Delete
          </Button>
          <Button
            color="blue"
            onClick={() => {
              handleEditButtonClick(item.id);
              setEditOpened(true);
            }}
          >
            Edit
          </Button>
          <Button
            color="green"
            onClick={() => {
              handleAddButtonClick(item.id);
              setAddOpened(true);
            }}
          >
            Add
          </Button>
          {/* <Button onClick={() => setEditOpened(true)}>
            Edit
            </Button>  */}
        </Flex>
      </Popover.Dropdown>
    </Popover>
  ));

  return (
    <>
      <Card withBorder radius="md" className={classes.card}>
        <Group justify="space-between">
          <Text className={classes.title}>Categories</Text>
          <Anchor onClick={() => setOpened(true)} size="xs" c="dimmed" style={{ lineHeight: 1 }}>
            Want to add a new Category?
          </Anchor>
        </Group>
        <SimpleGrid
          cols={{ base: 1, sm: 2, lg: 5 }}
          spacing={{ base: 10, sm: 'xl' }}
          verticalSpacing={{ base: 'md', sm: 'xl' }}
          mt="md"
        >
          {items}
        </SimpleGrid>
      </Card>

      <Modal title="Edit Category" opened={editOpened} onClose={() => setEditOpened(false)}>
        <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />

        <Stack>
          <TextInput
            disabled
            label="Category ID"
            placeholder="Enter category ID"
            required
            value={createCategoryID}
            onChange={(event) => setCreateCategoryID(event.currentTarget.value)}
            style={{ width: '100%' }}
          />
          <TextInput
            label="Category Name"
            placeholder="Enter category name"
            required
            value={createCategoryName}
            onChange={(event) => setCreateCategoryName(event.currentTarget.value)}
            style={{ width: '100%' }}
          />
          <TextInput
            label="Category Description"
            placeholder="Enter category description"
            required
            value={createCategoryDescription}
            onChange={(event) => setCreateCategoryDescription(event.currentTarget.value)}
            style={{ width: '100%' }}
          />
          <TextInput
            description={
              <span>
                Enter the icon name from the{' '}
                <Anchor href="https://tabler.io/icons">Tabler Icons library</Anchor>
              </span>
            }
            label="Category Icon"
            placeholder="Enter category icon"
            required
            value={createCategoryIcon}
            onChange={(event) => setCreateCategoryIcon(event.currentTarget.value)}
            style={{ width: '100%' }}
          />
          <Button
            onClick={() => {
              setLoading(true);
              axios
                .put('editCategory/', {
                  categoryId: createCategoryID,
                  name: createCategoryName,
                  description: createCategoryDescription,
                  icon: createCategoryIcon,
                })
                .then((response) => {
                  console.log('Response:', response);
                  setLoading(false);
                  getCategories();
                  notifications.show({
                    title: 'Category Edited',
                    message: `Category with ID ${createCategoryID} has been edited successfully`,
                    color: 'blue',
                    icon: '🎉',
                    autoClose: true,
                    autoCloseIn: 5000,
                  });
                  setEditOpened(false);
                  setCreateCategoryID('');
                  setCreateCategoryName('');
                  setCreateCategoryIcon('');
                  setCreateCategoryDescription('');
                })
                .catch((error) => {
                  console.error('Error:', error);
                  setLoading(false);
                })
                .finally(() => {
                  console.log('Finally block executed');
                  setLoading(false);
                });
            }}
          >
            Edit Category
          </Button>
        </Stack>
      </Modal>

      <Modal opened={opened} onClose={() => setOpened(false)} title="Add Category">
        <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />
        <Stack>
          <TextInput
            label="Category ID"
            placeholder="Enter category ID"
            required
            value={undefined}
            onChange={(event) => setCreateCategoryID(event.currentTarget.value)}
            style={{ width: '100%' }}
          />
          <TextInput
            label="Category Name"
            placeholder="Enter category name"
            required
            value={undefined}
            onChange={(event) => setCreateCategoryName(event.currentTarget.value)}
            style={{ width: '100%' }}
          />
          <TextInput
            label="Category Description"
            placeholder="Enter category description"
            required
            value={undefined}
            onChange={(event) => setCreateCategoryDescription(event.currentTarget.value)}
            style={{ width: '100%' }}
          />
          <TextInput
            label="Category Icon"
            placeholder="Enter category icon"
            required
            value={undefined}
            onChange={(event) => setCreateCategoryIcon(event.currentTarget.value)}
            style={{ width: '100%' }}
          />
          <Button
            onClick={() => {
              setLoading(true);
              axios
                .post('addCategory/', {
                  categoryId: createCategoryID,
                  name: createCategoryName,
                  description: createCategoryDescription,
                  icon: createCategoryIcon,
                })
                .then((response) => {
                  console.log('Response:', response);
                  setLoading(false);
                  getCategories();
                  notifications.show({
                    title: 'Category Added',
                    message: `Category with ID ${createCategoryID} has been added successfully`,
                    color: 'blue',
                    icon: '🎉',
                    autoClose: true,
                    autoCloseIn: 5000,
                  });
                  setOpened(false);
                  setCreateCategoryID('');
                  setCreateCategoryName('');
                  setCreateCategoryIcon('');
                  setCreateCategoryDescription('');
                  setGlobalCategoryChanged('1');
                })
                .catch((error) => {
                  console.error('Error:', error);
                  setLoading(false);
                })
                .finally(() => {
                  console.log('Finally block executed');
                  setLoading(false);
                  dispatch({ type: 'SET_CATEGORY_ID', payload: '' });
                  // setGlobalCategoryChanged('0')
                });
            }}
          >
            Add Category
          </Button>
        </Stack>
      </Modal>

      <Modal opened={addOpened} onClose={() => setAddOpened(false)} title="Add Product">
        <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />
        <Stack>
          <TextInput
            label="Product ID"
            placeholder="Enter product ID"
            required
            disabled
            value={nextProductID}
            style={{ width: '100%' }}
          />
          <Autocomplete
            label="Product Type"
            placeholder="Select product type"
            data={productTypesArray}
            value={productTypes}
            rightSection={
              <ActionIcon
                variant="transparent"
                onClick={() => {
                  setProductTypes('');
                }}
              >
                <IconX style={{ width: '70%', height: '70%' }} stroke={1.5} />
              </ActionIcon>
            }
            onChange={(event) => setProductTypes(event)}
            style={{ width: '100%' }}
          />

          <TextInput
            label="Product Name"
            placeholder="Enter product name"
            required
            value={createProductName}
            onChange={(event) => setCreateProductName(event.currentTarget.value)}
            style={{ width: '100%' }}
          />
          <TextInput
            label="Product Description"
            placeholder="Enter product description"
            required
            value={createProductDescription}
            onChange={(event) => setCreateProductDescription(event.currentTarget.value)}
            style={{ width: '100%' }}
          />
          <NumberInput
            label="Product Price"
            placeholder="Enter product price"
            required
            min={1}
            value={createProductPrice}
            onChange={setCreateProductPrice}
            style={{ width: '100%' }}
          />
          <NumberInput
            label="Product Quantity"
            placeholder="Enter product quantity"
            required
            min={1}
            value={createProductQuantity}
            onChange={setCreateProductQuantity}
            style={{ width: '100%' }}
          />
          <Dropzone my={20} accept={IMAGE_MIME_TYPE} onDrop={setprodImage}>
            {prodImage.length > 0
              ? 'Click or drop to change image'
              : 'Click or drop to upload image'}
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

          <Button
            onClick={() => {
              setLoading(true);
              const formData = new FormData();
              formData.append('name', createProductName);
              formData.append('description', createProductDescription);
              formData.append('price', createProductPrice.toString());
              formData.append('quantity', createProductQuantity.toString());
              formData.append('category', createCategoryName);
              formData.append('type', productTypes);
              if (prodImage.length > 0) {
                formData.append('image', prodImage[0]);
              }
              axios
                .post('uploadProduct/', formData, {
                  headers: {
                    'Content-Type': 'multipart/form-data',
                  },
                })
                .then((response) => {
                  console.log('Response:', response);
                  setLoading(false);
                  getCategories();
                  notifications.show({
                    title: 'Product Added',
                    message: `Product with ID ${nextProductID} has been added successfully`,
                    color: 'blue',
                    icon: '🎉',
                    autoClose: true,
                    autoCloseIn: 5000,
                  });
                  setAddOpened(false);
                  setCreateProductName('');
                  setCreateProductDescription('');
                  setCreateProductPrice('');
                  setCreateProductQuantity('');
                  setCreateProductCategory('');
                  setprodImage([]);
                  setGlobalCategoryChanged('1');
                })
                .catch((error) => {
                  console.error('Error:', error);
                  setLoading(false);
                })
                .finally(() => {
                  console.log('Finally block executed');
                  setLoading(false);
                  mutate('getImages/');
                  // dispatch({ type: 'SET_CATEGORY_ID', payload: '' });
                  // setGlobalCategoryChanged('0')
                });
            }}
          >
            Add Product
          </Button>
        </Stack>
      </Modal>
    </>
  );
};

export default ActionsGridViewAdmin;
