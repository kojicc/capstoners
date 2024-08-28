
import {ContactUs} from '@/components/LandingPage/contact/ContactUs';

import { Header } from '../components/LandingPage/header/HeaderLP';
import { Hero } from '../components/LandingPage/hero/Hero';
import { About } from '@/components/LandingPage/abouts/About';
import { Products } from '@/components/LandingPage/products/Products';
import { Footer } from '@/components/LandingPage/footer/footer';
import { useState } from 'react';
import { Button } from '@mantine/core';
// import { TransactionsAdmin } from '@/components/adminPage/TransactionsAdmin';





export default function HomePage() {
  

  return (
    <>
        
        <Button component='a'href='/productsCRUDAdmin'>Crud Test</Button>
        <Button component='a'href='/cart'>Cart Test</Button>
        <Button component='a'href='/test'>Notification Test</Button>
    <Header />
    <Hero/>
    <About/>
    
    {/* <TransactionsAdmin/> */}


   
    <Products/>
<ContactUs/>
    
    <Footer/>
    
    </>
  );
}
