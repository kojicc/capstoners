import { ContactUs } from '@/components/LandingPage/contact/ContactUs';
import { NavbarSection } from '../components/adminPage/dashboard/sidebarAdmin';

import Header from '../components/LandingPage/header/HeaderLP';
import { Hero } from '../components/LandingPage/hero/Hero';
import { About } from '@/components/LandingPage/abouts/About';
import { Products } from '@/components/LandingPage/products/Products';
import { Footer } from '@/components/LandingPage/footer/footer';
import { useContext, useEffect, useState } from 'react';
import { Button, Text } from '@mantine/core';
import { AuthContext } from '@/utils/authContext';
import useProtectedRoute from '@/utils/protectedRoute';
import { modals } from '@mantine/modals';
import router from 'next/router';
// import { TransactionsAdmin } from '@/components/adminPage/TransactionsAdmin';
import { withRoleProtection } from '@/utils/withRoleProtection';

const HomePage = () => {
  return (
    <>
      {/* <Button component='a'href='/productsCRUDAdmin'>Crud Test</Button> */}

      {/* <Header /> */}
      <NavbarSection />
    </>
  );
};
export default withRoleProtection(HomePage, ['admin']);
