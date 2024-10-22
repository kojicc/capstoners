import React from 'react';
import { Container, SimpleGrid, Title, Text, Grid, Group, ThemeIcon, Stack, Transition, Button } from '@mantine/core';
import { Image } from '@mantine/core';
import { IconArrowRight, IconChecks, IconFileTime, IconReceipt, IconStatusChange } from '@tabler/icons-react';
import { useState, useRef } from 'react';
import { useIntersection } from '@mantine/hooks';

export function Features(){
    const [mounted, setMounted] = useState(false);
    const sectionRef = useRef(null);
  
    const { ref, entry } = useIntersection({
      root: sectionRef.current,
      threshold: 0.5, 
    });
  
   
    if (entry?.isIntersecting && !mounted) {
      setMounted(true);
    }

return(



  
<Container fluid pt={25} pb={50}>

  <Grid  overflow="hidden" >  
  <Grid.Col span={6} offset={0.5} >
      <Image radius={'sm'} w="600" fit='contain' src='/lake.png'  
      fallbackSrc="https://placehold.co/600x400?text=Error Loading Image"/>
  
      </Grid.Col>


      <Grid.Col pt={150} span={'auto'} offset={-0.5}>
        
              
      <Stack ref={ref} pt={25} align="center" justify="center">
      <Transition mounted={mounted} transition="rotate-right" duration={1500} timingFunction="ease">
        {(styles) => (

          <Group pb={15} style={styles}>
            <ThemeIcon variant="white" size="xl" radius="xl" color="#592f55">
              <IconReceipt size={100} />
            </ThemeIcon>
            <Text size="xl" fw={700} color="black">
              Reserve
            </Text>
            <Text size="md" color="black" lineClamp={1}>
              Consequuntur sunt aut quasi enim aliquam quae harum pariatur laboris nisi ut aliquip
              Consequuntur sunt aut quasi enim aliquam quae harum pariatur laboris nisi ut aliquip
            </Text>
          </Group>
        )}
      </Transition>

      <Transition mounted={mounted} transition="rotate-right" duration={1500} timingFunction="ease">
        {(styles) => (
          <Group style={styles}>
            <ThemeIcon variant="white" size="xl" radius="xl" color="#592f55">
              <IconStatusChange size={100} />
            </ThemeIcon>
            <Text fw={700} color="black">
              Status
            </Text>
            <Text size="md" color="black" lineClamp={1}>
              Consequuntur sunt aut quasi enim aliquam quae harum pariatur laboris nisi ut aliquip
              Consequuntur sunt aut quasi enim aliquam quae harum pariatur laboris nisi ut aliquip
            </Text>
          </Group>
        )}
      </Transition>

      <Transition mounted={mounted} transition="rotate-right" duration={1500} timingFunction="ease">
        {(styles) => (
          <Group style={styles}>
            <ThemeIcon variant="white" size="xl" radius="xl" color="#592f55">
              <IconFileTime size={100} />
            </ThemeIcon>
            <Text fw={700} color="black">
             Transaction History
            </Text>
            <Text size="md" color="black" lineClamp={1}>
              Consequuntur sunt aut quasi enim aliquam quae harum pariatur laboris nisi ut aliquip
              Consequuntur sunt aut quasi enim aliquam quae harum pariatur laboris nisi ut aliquip
            </Text>
          </Group>
        )}
      </Transition>
    </Stack>
              </Grid.Col>
  
              
    
    
    </Grid>
    </Container>)

  
}

