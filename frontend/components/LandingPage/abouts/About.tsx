import React from 'react';
import { Container, SimpleGrid, Title, Text, Grid, Group, ThemeIcon, Stack, Transition, Divider } from '@mantine/core';
import { Image } from '@mantine/core';
import { IconArrowRight, IconChecks, IconFileTime, IconReceipt, IconStatusChange } from '@tabler/icons-react';
import { useState, useRef } from 'react';
import { useIntersection } from '@mantine/hooks';


export function About(){
  const [mounted, setMounted] = useState(false);
  const sectionRef = useRef(null);

  const { ref, entry } = useIntersection({
    root: sectionRef.current,
    threshold: 0.1,
  });

  if (entry?.isIntersecting && !mounted) {
    setMounted(true);
  }
return(

<Container fluid pt={50} pb={50}>

  <Grid overflow="hidden" >  
  <Grid.Col span={'auto'} offset={0.3} ref={ref}>
      <Transition mounted={mounted} transition="fade-right" duration={500} timingFunction="ease">
        {(styles) => (
          <div style={styles}>
            <h3>CTHM LABORATORY.</h3>
            <Text fs='italic'>
              The College of Tourism and Hospitality Management at De La Salle University-Dasmariñas is a dynamic hub nurturing future leaders in hospitality and tourism. Its two distinguished departments, the Hospitality Management Department (HMD) and the Tourism Management Department, offer tailored programs to meet industry demands.
            </Text>

            <Stack pt={25}>
              <Group>
                <ThemeIcon variant="white" size="md" radius="xl" color="#592f55">
                  <IconChecks size={20} />
                </ThemeIcon>
                <Text fw={700} color="black">
                  Laboratory
                </Text>
              </Group>

              <Group>
                <ThemeIcon variant="white" size="md" radius="xl" color="#592f55">
                  <IconChecks size={20} />
                </ThemeIcon>
                <Text fw={700} color="black">
                  Sentenial Hall
                </Text>
              </Group>

              <Group>
                <ThemeIcon variant="white" size="md" radius="xl" color="#592f55">
                  <IconChecks size={20} />
                </ThemeIcon>
                <Text fw={700} color="black">
                  Hotel Rafael
                </Text>
              </Group>
            </Stack>

            <p>
              The Bachelor of Science in Hotel and Restaurant Management program, led by the Hospitality Management Department, blends rigorous coursework with hands-on experiences to prepare students for success in the hospitality industry.
            </p>
          </div>
        )}
      </Transition>
    </Grid.Col>
  
              
    <Grid.Col span={6} offset={0.5} >

    <div data-aos="fade-left" >
      <Image radius={'md'} w="700" fit='contain' src='/RAFAEL.jpg'  
      fallbackSrc="https://placehold.co/600x400?text=Error Loading Image"/>
  </div>
      </Grid.Col>
    
    </Grid>

    
    <Divider my="xl" />

    <Grid  overflow="hidden" >  
    <Grid.Col span={6} offset={0.5} >

      <div  data-aos="fade-right">
      <Image  radius={'sm'} w="600" fit='contain' src='/lake.png'  
        fallbackSrc="https://placehold.co/600x400?text=Error Loading Image"/>
    
      </div>
      
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




    </Container>




    )
  
  

  
}

