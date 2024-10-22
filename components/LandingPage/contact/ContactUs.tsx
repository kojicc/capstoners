import React from 'react';
import {
  Container,
  SimpleGrid,
  Title,
  Text,
  Grid,
  Group,
  ThemeIcon,
  Stack,
  Transition,
  Button,
  Flex,
} from '@mantine/core';
import { Image } from '@mantine/core';
import {
  IconArrowRight,
  IconChecks,
  IconDeviceLandlinePhone,
  IconFileTime,
  IconMail,
  IconMap2,
  IconReceipt,
  IconStatusChange,
} from '@tabler/icons-react';
import { useState, useRef } from 'react';
import { useIntersection } from '@mantine/hooks';

export function ContactUs() {
  const [mounted, setMounted] = useState(false);
  const sectionRef = useRef(null);

  const { ref, entry } = useIntersection({
    root: sectionRef.current,
    threshold: 0.5,
  });

  if (entry?.isIntersecting && !mounted) {
    setMounted(true);
  }

  return (
    <Container fluid>
      <Title pb={60} pl={80} order={1} tt="uppercase">
        Location
      </Title>

      <Container fluid>
        <iframe
          style={{ border: 0, width: '100%', height: '270px' }}
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d683.3855772116332!2d120.96210766661352!3d14.322315149959394!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397d5b51127ef77%3A0x3a29d68f8e8012c5!2sCollege%20of%20Tourism%20and%20Hospitality%20Management%20Dean&#39;s%20Office!5e0!3m2!1sen!2sph!4v1713621681435!5m2!1sen!2sph"
          frameBorder="0"
          allowFullScreen
        ></iframe>

        {/* stack ng lahat */}
        <Flex
          pb={60}
          direction={{ base: 'column', sm: 'row' }}
          gap={{ base: 'sm', sm: 'lg' }}
          justify={{ sm: 'center' }}
        >
          {/* stack1 */}
          <Stack>
            <Group pt={15}>
              <ThemeIcon variant="filled" size="xl" radius="md" color="#592f55">
                <IconMap2 size={30} />
              </ThemeIcon>
              <Title order={1}>Location</Title>
            </Group>
            <Text size="md" lineClamp={1}>
              ADDBB-B, 4115 West Ave, Dasmarinas, Cavite
            </Text>
          </Stack>

          {/* stack2 */}
          <Stack>
            <Group pt={15}>
              <ThemeIcon variant="filled" size="xl" radius="md" color="#592f55">
                <IconMail size={30} />
              </ThemeIcon>
              <Title order={1}>Email</Title>
            </Group>
            <Text size="md" lineClamp={1}>
              cthmsecrratary@dlsud.edu.ph
            </Text>
          </Stack>

          {/* stack3 */}
          <Stack>
            <Group pt={15}>
              <ThemeIcon variant="filled" size="xl" radius="md" color="#592f55">
                <IconDeviceLandlinePhone size={30} />
              </ThemeIcon>
              <Title order={1}>Call</Title>
            </Group>
            <Text size="md" lineClamp={1}>
              (046)481.1900
            </Text>
          </Stack>
        </Flex>
      </Container>
    </Container>
  );
}
