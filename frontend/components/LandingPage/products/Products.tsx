import React from 'react';
import { Container, SimpleGrid, Title, Text, Grid, Group, ThemeIcon, Stack, Transition, Button, Tabs, rem, Skeleton } from '@mantine/core';
import { Image } from '@mantine/core';
import { IconArrowRight, IconChecks, IconDownload, IconFileTime, IconMessageCircle, IconPhoto, IconReceipt, IconSettings, IconStatusChange } from '@tabler/icons-react';
import { useState, useRef } from 'react';
import { useIntersection } from '@mantine/hooks';
import classes from './Products.module.css';
export function Products(){
   
    const child = <Skeleton height={140} radius="md" animate={false} />;

    const [activeTab, setActiveTab] = useState<string | null>('first');

  

return(
<Container fluid pt={25} pb={50}>


<Title pl={80} order={1} tt='uppercase' >most used laboratory items</Title>


{/* 
ilalagay dito mga pictures na need magbago depende sa pics na locally or nasa top na used?? maybe idk django backend pa yon or maybe not na manual changing nalang since di naman siguro featured to masyado */}
<Tabs variant='pills' value={activeTab} onChange={setActiveTab} defaultValue="first">
      <Tabs.List justify="center">
        <Tabs.Tab value="first">First tab</Tabs.Tab>
        <Tabs.Tab value="second">Second tab</Tabs.Tab>
        <Tabs.Tab value="third">Third tab</Tabs.Tab>
      </Tabs.List>
    
 

    <Tabs.Panel value="first">
    <Container my="md">
    <div data-aos="fade-up" >
      <Grid columns={24}>
        <Grid.Col span={{ base: 12, xs: 4 }}>{child}</Grid.Col>
        <Grid.Col span={{ base: 12, xs: 8 }}>{child}</Grid.Col>
        <Grid.Col span={{ base: 12, xs: 8 }}>{child}</Grid.Col>
        <Grid.Col span={{ base: 12, xs: 4 }}>{child}</Grid.Col>
        <Grid.Col span={{ base: 12, xs: 3 }}>{child}</Grid.Col>
        <Grid.Col span={{ base: 12, xs: 3 }}>{child}</Grid.Col>
        <Grid.Col span={{ base: 12, xs: 6 }}>{child}</Grid.Col>
       
      </Grid>
      </div>
    </Container>
      </Tabs.Panel>

      <Tabs.Panel value="second">
      <Container my="md">
    <div data-aos="fade-up" >
      <Grid columns={24}>
        <Grid.Col span={{ base: 12, xs: 12 }}>{child}</Grid.Col>
        <Grid.Col span={{ base: 12, xs: 8 }}>{child}</Grid.Col>
        <Grid.Col span={{ base: 12, xs: 8 }}>{child}</Grid.Col>
        <Grid.Col span={{ base: 12, xs: 4 }}>{child}</Grid.Col>
        <Grid.Col span={{ base: 12, xs: 3 }}>{child}</Grid.Col>
        <Grid.Col span={{ base: 12, xs: 3 }}>{child}</Grid.Col>
        <Grid.Col span={{ base: 12, xs: 6 }}>{child}</Grid.Col>
       
      </Grid>
      </div>
    </Container>
      </Tabs.Panel>

      <Tabs.Panel value="third">
      <Container my="md">
    <div data-aos="fade-up" >
      <Grid columns={24}>
        <Grid.Col span={{ base: 12, xs: 6 }}>{child}</Grid.Col>
        <Grid.Col span={{ base: 12, xs: 8 }}>{child}</Grid.Col>
        <Grid.Col span={{ base: 12, xs: 8 }}>{child}</Grid.Col>
        <Grid.Col span={{ base: 12, xs: 4 }}>{child}</Grid.Col>
        <Grid.Col span={{ base: 12, xs: 3 }}>{child}</Grid.Col>
        <Grid.Col span={{ base: 12, xs: 3 }}>{child}</Grid.Col>
        <Grid.Col span={{ base: 12, xs: 6 }}>{child}</Grid.Col>
       
      </Grid>
      </div>
    </Container>
      </Tabs.Panel>

    
    
   
    </Tabs>
    </Container>
    )

  
}

