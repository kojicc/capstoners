import React, { useContext, useEffect, useState } from 'react';
import useProtectedRoute from '@/utils/protectedRoute'; // Ensure this path is correct
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
  Popover,
  Overlay,
  Paper,
} from '@mantine/core';
import { Dropzone, FileWithPath, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import axios from '@/utils/axiosInstance';
// import classes from '../components/modules.css/FloatingLabelInput.module.css';

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
import { useCategoryID } from '@/utils/CategoryIDContext';
import axiosInstance from '@/utils/axiosInstance';
import { notifications } from '@mantine/notifications';
import { useForm } from '@mantine/form';
import { readLocalStorageValue, useLocalStorage } from '@mantine/hooks';
import UpdateUser from './userSettings';
import { AuthenticationForm } from '../../loginandregisterUSER/authForm';
import { UserRegAdmin } from './userRegistrationAdmin';

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

const UserAccountsManage = () => {
  const [images, setImages] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { state } = useCategoryID();
  const [prodID, setprodID] = useState<string>('');
  const [prodName, setprodName] = useState<string>('');
  const [prodDesc, setprodDesc] = useState<string>('');
  const [prodPrice, setprodPrice] = useState<number>(0);
  const [prodQuantity, setprodQuantity] = useState<number>(0);
  const [prodCategory, setprodCategory] = useState<string>('');
  console.log('prodCategory', prodCategory);
  const [prodCategoryID, setprodCategoryID] = useState<string>('');
  const [prodImage, setprodImage] = useState<FileWithPath[]>([]);
  const [focused, setFocused] = useState<boolean>(false);
  const [value, setValue] = useState<string>('');
  const [openedPopoverId, setOpenedPopoverId] = useState<string | null>(null);

  const [nextProductId, setNextProductId] = useState('');
  const [error, setError] = useState('');
  const floating = value.trim().length !== 0 || focused || undefined;
  const [searchProduct, setSearchProduct] = useState<Product[]>([]);

  const [searchInput, setSearchInput] = useState<string>('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  const iconStyle = { width: rem(12), height: rem(12) };

  let categoryData = [];
  const [categories, setCategories] = useState<Category[]>([]);

  // const { role } = useContext(AuthContext);
  // // const role = Cookies.get('Role');
  // const { loading } = useContext(AuthContext);
  // console.log('loadingsaAuth', loading);

  // // Custom hook to protect the route based on roles
  // const { isRoleAllowed } = useProtectedRoute({ allowedRoles: ['student', 'admin'] });
  // console.log('isRoleAllowed', isRoleAllowed);

  // if(!isRoleAllowed){
  //   <LoadingOverlay visible={true} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />  }

  const fetchImages = async () => {
    try {
      const { categoryID } = state;
      console.log('Category ID sa pagfetch:', categoryID);

      if (categoryID) {
        // Only send the categoryID if it is truthy (not null, undefined, or empty)
        const response = await axios.get('getImages/', {
          params: { categoryID },
        });
        setImages(response.data.images);
        setSearchProduct(response.data.images);
        console.log('Images:', response.data.images);
      } else {
        const response = await axios.get('getImages/', {
          params: { categoryID: '' },
        }); // Fetch all images when categoryID is falsy (null, empty, etc.)
        setImages(response.data.images);
        setSearchProduct(response.data.images);
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

  // useEffect(() => {
  //   const modalAppear = async () => {
  //     if (isRoleAllowed) {
  //       modals.openConfirmModal({
  //         title: 'Please confirm your action',
  //         closeOnConfirm: false,
  //         labels: { confirm: 'Next modal', cancel: 'Close modal' },
  //         children: (
  //           <Text size="sm">
  //             This action is so important that you are required to confirm it with a modal. Please click one of these buttons to proceed.
  //           </Text>
  //         ),
  //         onConfirm: () =>
  //           modals.openConfirmModal({
  //             title: 'This is modal at second layer',
  //             labels: { confirm: 'Close modal', cancel: 'Back' },
  //             closeOnConfirm: false,
  //             children: (
  //               <Text size="sm">
  //                 When this modal is closed modals state will revert to first modal
  //               </Text>
  //             ),
  //             onConfirm: modals.closeAll,
  //           }),
  //       });
  //       console.log('Modal appeared');
  //     }
  //   };

  //   // Call the function
  //   modalAppear();
  // }, []); // This will run the effect whenever `isRoleAllowed` changes

  //

  const router = useRouter();

  // useEffect(() => {
  //   if (!isRoleAllowed) {
  //     console.log('Role not allowed:', isRoleAllowed);
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
  //   } else {
  //     console.log('Role allowed:', isRoleAllowed);
  //   }

  //   // if(isRoleAllowed===null){

  //   // }
  //   // else if(isRoleAllowed===false){
  //   // }

  //   // else if(isRoleAllowed===true){
  //   //   console.log('Role allowed:', isRoleAllowed);
  //   // }
  // }, []); // This will run the effect whenever `isRoleAllowed` changes

  // useEffect(() => {
  //   if (prodCategory==='Alcohol') {
  //     setprodCategoryID('ALC');
  //   }
  //   else if (prodCategory==='Glassware') {
  //     setprodCategoryID('GLW');
  //   }
  //   else if (prodCategory==='Linens') {
  //     setprodCategoryID('LIN');
  //   }
  //   else if (prodCategory==='Plates') {
  //     setprodCategoryID('PLT');
  // }
  // else if (prodCategory==='Utensils') {
  //   setprodCategoryID('UTN');
  // }

  //   else if (prodCategory==='Tableware/Furniture') {
  //     setprodCategoryID('TWF');
  //   }

  // }
  // , [prodCategory]);

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
      <Flex justify={'center'}>
        <Image
          w={400}
          h={400}
          key={index}
          src={imageUrl}
          onLoad={() => URL.revokeObjectURL(imageUrl)}
        />
      </Flex>
    );
  });

  const handleUpload = async () => {
    // setprodCategory("")
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

      console.log('Image uploaded successfully:', response.data);

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
        console.log('Category changed listener:', event.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [setCategoryChanged]);

  useEffect(() => {
    console.log('Category changed:', categoryChanged);

    fetchCategories();
    removeValue();
  }, [categoryChanged]);

  useEffect(() => {
    const value = readLocalStorageValue({ key: 'categoryChanged' });
    console.log('Value:', value);
  }, []);
  const fetchCategories = async () => {
    try {
      const response = await axios.get('getCategories/');
      categoryData = response.data.categories;
      setCategories(response.data.categories);
      console.log('Categories:', categoryData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSearch = (value: string) => {
    setSearchInput(value);
    const filteredValue = value.split(' - ')[0];

    const filtered = searchProduct.filter(
      (product) =>
        product.productId.toLowerCase().includes(value.toLowerCase()) ||
        product.name.toLowerCase().includes(value.toLowerCase()) ||
        product.productId.toLowerCase().includes(filteredValue.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  useEffect(() => {
    if (searchInput === '') {
      setFilteredProducts(searchProduct);
    } else {
      handleSearch(searchInput);
    }
  }, [searchInput, searchProduct]);

  return (
    <Paper pl={0} bg={'#ffff'}>
      {/* <Header /> */}

      <Paper shadow="xl" radius={'md'} p={'xl'}>
        <LoadingOverlay
          visible={isLoading}
          zIndex={1000}
          overlayProps={{ radius: 'sm', blur: 2 }}
        />

        <Tabs color="teal" variant="pills" defaultValue="Create">
          <Tabs.List grow>
            <Tabs.Tab value="Create" leftSection={<IconPhoto style={iconStyle} />}>
              Create
            </Tabs.Tab>
            <Tabs.Tab
              color="yellow"
              value="Update/Delete"
              leftSection={<IconMessageCircle style={iconStyle} />}
            >
              Update/View
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="Create">
            <>
              <Paper shadow="xl" radius={'md'} withBorder p={'xl'} mt={10}>
                <UserRegAdmin />
              </Paper>
            </>
          </Tabs.Panel>

          <Tabs.Panel color="yellow" value="Update/Delete">
            <Paper shadow="xl" radius={'md'} withBorder p={'xl'} mt={10}>
              <UpdateUser />
            </Paper>
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </Paper>
  );
};

export default UserAccountsManage;
