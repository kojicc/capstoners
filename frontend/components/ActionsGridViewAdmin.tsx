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
  } from '@mantine/core';
  import * as TablerIcons from '@tabler/icons-react';
  import classes from './modules.css/ActionsGrid.module.css';
  import axios from '../utils/axiosInstance';
  import { useCategoryID } from '../utils/categoryIDContext';
  import { modals } from '@mantine/modals';
  import { notifications } from '@mantine/notifications';
  import { useState, useEffect } from 'react';
import { useDisclosure, useLocalStorage } from '@mantine/hooks';

  interface Category {
    categoryId: string;
    name: string;
    description: string;
    icon: string;
  }
  
  let mockdata: any[] = [];
  
  const ActionsGridViewAdmin = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryID, setCategoryID] = useState('');
    const { state, dispatch } = useCategoryID();
    const [loading, setLoading] = useState(false);
    const [createCategoryID, setCreateCategoryID] = useState('');
    const [createCategoryName, setCreateCategoryName] = useState('');
    const [createCategoryDescription, setCreateCategoryDescription] = useState('');
    const [createCategoryIcon, setCreateCategoryIcon] = useState('');
    const [opened, setOpened] = useState(false);
    const [editOpened, setEditOpened] = useState(false);
    const [popoverOpened, setPopoverOpened] = useState<{ [key: string]: boolean }>({});
    const [hoverOpened, { close, open }] = useDisclosure(false);
    const theme = useMantineTheme();

    const [globalCategoryChanged, setGlobalCategoryChanged, removeValue] = useLocalStorage({
      key: 'categoryChanged',
      defaultValue: '0',
    })
  
    const getCategories = async () => {
      const response = await axios.get('getCategories/');
      setCategories(response.data.categories);
      
      mockdata = response.data.categories.map((category: {
        categoryId: any;
        icon: any;
        name: string;
      }) => {
        const IconComponent = (TablerIcons as { [key: string]: any })[category.icon] || TablerIcons['IconQuestionMark'];
        return { title: `${category.name} - ${category.categoryId}`, icon: IconComponent, color: 'violet', id: category.categoryId };
      });
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
            Are you sure you want to delete this category? This action is destructive and you will regret it if done without proper considerations.
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
            setGlobalCategoryChanged('1')
           
          } catch (error) {
            console.error('Error:', error);
          }
          dispatch({ type: 'SET_CATEGORY_ID', payload: '' });
        },
      });
    };


    const handleEditButtonClick = (id: string) => {
              setPopoverOpened((prev) => ({ ...prev, [id]: false })); // Close the specific popover

     
    }


    
    const items = mockdata.map((item) => (

      <Popover
        key={item.id}
        width={200}
        position="bottom"
        withArrow
        shadow="md"
        opened={popoverOpened[item.id] || hoverOpened ||false}
        onClose={() => setPopoverOpened((prev) => ({ ...prev, [item.id]: false }))}
      >
        <Popover.Target>
            <Tooltip label="Click to view more options" >
                
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
            <Text>Do you want to edit or delete this category?</Text>
            <Button color="red" onClick={() => handleDeleteButtonClick(item.id)}>
              Delete
            </Button>
            <Button color="blue" onClick={() => {handleEditButtonClick(item.id); setEditOpened(true);}}>
              Edit
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
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }} spacing={{ base: 10, sm: 'xl' }} verticalSpacing={{ base: 'md', sm: 'xl' }} mt="md">
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
              description={<span>Enter the icon name from the <Anchor href='https://tabler.io/icons'>Tabler Icons library</Anchor></span>}
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
                    ;
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
                    setGlobalCategoryChanged('1')
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
      </>
    );
  };
  
  export default ActionsGridViewAdmin;
  