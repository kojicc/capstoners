import React, { use, useContext, useEffect, useState } from 'react';
import useProtectedRoute from '../utils/protectedRoute'; // Ensure this path is correct
import {
  Button,
  Text,
  Skeleton,
  Image,
  TextInput,
  Select,
  SimpleGrid,
  LoadingOverlay,
} from '@mantine/core';
import { Dropzone, DropzoneProps, FileWithPath, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import axios from '../utils/axiosInstance';
import classes from '../components/modules.css/FloatingLabelInput.module.css';
import { DatesProvider, DateTimePicker } from '@mantine/dates';
import moment from 'moment-timezone';

import { modals } from '@mantine/modals';
import Cookies from 'js-cookie';
import router, { useRouter } from 'next/router';
import { AuthContext } from '@/utils/authContext';
import { useDisclosure } from '@mantine/hooks';

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

const ProfilePage = (props: Partial<DropzoneProps>) => {
  const [images, setImages] = useState<Product[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [visible, { toggle }] = useDisclosure(false);
  const { role } = useContext(AuthContext);
  // Custom hook to protect the route based on roles
  const { isRoleAllowed, loading } = useProtectedRoute({ allowedRoles: ['student', 'admin'] });
  // console.log('Role allowed:', isRoleAllowed);
  console.log('Loading:', loading);


  useEffect(() => {
    if (!isRoleAllowed) {
      console.log('Role not allowed:', isRoleAllowed);
      modals.openConfirmModal({
        title: 'Please confirm your action',
        children: (
          <Text size="sm">
            Your role is{' '}
            <b>
              <i>{role}</i>
            </b>{' '}
            and is currently unauthorized, please login as student/admin first.
          </Text>
        ),
        labels: { confirm: 'Login', cancel: 'Go back to home page' },
        onCancel: () => router.push('/'),
        onConfirm: () => router.push('/login'),
        withCloseButton: false,
      });
    } else {
      console.log('Role allowed:', isRoleAllowed);
    }
  }, []);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await axios.get('getImages/');
        setImages(response.data.images);
        console.log('images', response.data.images);
      } catch (error) {
        console.error('Error fetching images:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchImages();
  }, []);


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
  //   if(!isRoleAllowed){
  //     console.log('Role not allowed:', isRoleAllowed);
  //     modals.openConfirmModal({
  //       title: 'Please confirm your action',
  //       children: (
  //         <Text size="sm">
  //           Your role is <b><i>{role}</i></b> and is currently unauthorized, please login as student/admin first.
  //         </Text>
  //       ),
  //       labels: { confirm: 'Login', cancel: 'Go back to home page' },
  //       onCancel: () => router.push('/'),
  //       onConfirm: () => router.push('/login'),
  //       withCloseButton: false,
  //     });
  //   }
  //   else{
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

  const [prodID, setprodID] = useState<string>('');
  const [prodName, setprodName] = useState<string>('');
  const [prodDesc, setprodDesc] = useState<string>('');
  const [prodPrice, setprodPrice] = useState<number>(0);
  const [prodQuantity, setprodQuantity] = useState<number>(0);
  const [prodCategory, setprodCategory] = useState<string>('');
  const [prodImage, setprodImage] = useState<FileWithPath[]>([]);
  const [focused, setFocused] = useState<boolean>(false);
  const [value, setValue] = useState<string>('');

  const floating = value.trim().length !== 0 || focused;

  const previews = prodImage.map((file, index) => {
    const imageUrl = URL.createObjectURL(file);
    return <Image key={index} src={imageUrl} onLoad={() => URL.revokeObjectURL(imageUrl)} />;
  });

  const handleUpload = async () => {
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

      console.log('Image uploaded successfully:', response.data);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleUpdate = async () => {
    const formData = new FormData();
    formData.append('productId', prodID);
    formData.append('name', prodName);
    formData.append('description', prodDesc);
    formData.append('price', prodPrice.toString());
    formData.append('quantity', prodQuantity.toString());
    formData.append('category', prodCategory);
    if (prodImage.length > 0) {
      formData.append('image', prodImage[0]);
    }

    try {
      const response = await axios.put('updateProduct/', formData);

      console.log('Image uploaded successfully:', response.data);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await axios.delete(
        `http://localhost:8000/api/deleteProduct/?productId=${prodID}`
      );
      console.log('Product deleted successfully:', response.data);
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  //   const [date, setDate] = useState(moment().tz('Asia/Hong_Kong').toDate());

  // const handleChange = (value: moment.MomentInput) => {
  //   if (value) {
  //     const selectedDate = moment(value).tz('Asia/Hong_Kong');

  //     // Set the hours to 8 AM if before 8 AM
  //     if (selectedDate.hour() < 8) {
  //       selectedDate.hour(8).minute(0);
  //     }
  //     // Set the hours to 4 PM if after 4 PM
  //     else if (selectedDate.hour() >= 16) {
  //       selectedDate.hour(16).minute(0);
  //     }

  //     setDate(selectedDate.toDate());
  //   }
  // };
  const [date, setDate] = useState<Date | null>(null);

  // Format date for API request
  const formattedDate = moment(date).tz('Asia/Manila').format('YYYY-MM-DD HH:mm');

  console.log('Formatted Date:', formattedDate);

  return (
    <>
      <Text>Reservations - {role}</Text>

      {!isRoleAllowed ? (
        //eto yung pag hindi inallow yung role kapag hindi admin or student
        <div>
          <Button component="a" href="/">
            Go back Home
          </Button>
          <Button
            onClick={() =>
              modals.openConfirmModal({
                title: 'Please confirm your action',
                closeOnConfirm: false,
                labels: { confirm: 'Next modal', cancel: 'Close modal' },
                children: (
                  <Text size="sm">
                    This action is so important that you are required to confirm it with a modal.
                    Please click one of these buttons to proceed.
                  </Text>
                ),
                onConfirm: () =>
                  modals.openConfirmModal({
                    title: 'This is modal at second layer',
                    labels: { confirm: 'Close modal', cancel: 'Back' },
                    closeOnConfirm: false,
                    children: (
                      <Text size="sm">
                        When this modal is closed modals state will revert to first modal
                      </Text>
                    ),
                    onConfirm: modals.closeAll,
                  }),
              })
            }
          >
            Open multiple steps modal
          </Button>

          <Skeleton height={50} circle mb="xl" />
          <Skeleton height={8} radius="xl" />
          <Skeleton height={8} mt={6} radius="xl" />
          <Skeleton height={8} mt={6} width="70%" radius="xl" />
        </div>
      ) : (
        //eto yung pag inallow yung role either admin or student
        <div>
          <DatesProvider settings={{ locale: 'en', firstDayOfWeek: 1, weekendDays: [1, 5] }}>
            <DateTimePicker
              clearable
              hideOutsideDates
              valueFormat="YYYY-MM-DD HH:mm"
              defaultValue={date}
              onChange={setDate}
              label="Pick date and time"
              placeholder="Pick date and time"
              locale="en"
            />
          </DatesProvider>
          <Text>Username:</Text>
          <TextInput
            label="Product ID"
            placeholder="OMG, it also has a placeholder"
            required
            classNames={classes}
            value={prodID}
            onChange={(event) => setprodID(event.currentTarget.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            mt="md"
            autoComplete="nope"
            data-floating={floating}
            labelProps={{ 'data-floating': floating }}
          />

          <TextInput
            label="Product Name"
            placeholder="OMG, it also has a placeholder"
            required
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
            placeholder="OMG, it also has a placeholder"
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

          <TextInput
            label="Product Price"
            placeholder="OMG, it also has a placeholder"
            required
            classNames={classes}
            value={prodPrice}
            onChange={(event) => setprodPrice(parseFloat(event.currentTarget.value))}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            mt="md"
            autoComplete="nope"
            data-floating={floating}
            labelProps={{ 'data-floating': floating }}
          />

          <TextInput
            label="Input quantity"
            placeholder="Input quantity"
            required
            value={prodQuantity}
            onChange={(event) => setprodQuantity(parseInt(event.currentTarget.value))}
          />

          <Select
            mt="md"
            comboboxProps={{ withinPortal: true }}
            data={['alcohol', 'Angular', 'Svelte', 'Vue']}
            placeholder="Pick one"
            onChange={(value: string | null) => setprodCategory(value ?? '')}
            label="Select a category"
          />
          <Dropzone accept={IMAGE_MIME_TYPE} onDrop={setprodImage}>
            <Text ta="center">Drop images here</Text>
          </Dropzone>

          <SimpleGrid cols={{ base: 1, sm: 4 }} mt={previews.length > 0 ? 'xl' : 0}>
            {previews}
          </SimpleGrid>

          <Button onClick={handleUpload} mt="xl">
            Upload
          </Button>

          <Button onClick={handleUpdate} mt="xl">
            Update
          </Button>

          <Button onClick={handleDelete} mt="xl">
            Delete
          </Button>

          <p>Your role: {role}</p>
          <Button component="a" href="/">
            Go back Home
          </Button>
          {isLoading ? (
            <p>Loading images...</p>
          ) : (
            <div>
              {images && images.length > 0 ? (
                images.map((product) => (
                  <div key={product.id}>
                    <h3>{product.productId}</h3>
                    <h3>{product.category}</h3>
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                    <p>Price: ${product.price}</p>
                    <p>Quantity: {product.quantity}</p>
                    <Image
                      w={200}
                      h={200}
                      src={`http://localhost:8000${product.image}`}
                      fallbackSrc={product.name}
                    />
                  </div>
                ))
              ) : (
                <p>No images available</p>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ProfilePage;
