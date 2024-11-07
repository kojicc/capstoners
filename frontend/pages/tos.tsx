import React from 'react';
import {
  AppShell,
  Burger,
  Group,
  UnstyledButton,
  Text,
  Title,
  Container,
  Stack,
  Center,
  Divider,
  Overlay,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Header from '@/components/LandingPage/header/HeaderLP';
import { Footer } from '@/components/LandingPage/footer/footer';

export default function TermsofServices() {
  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { desktop: true, mobile: !opened } }}
      padding="md"
      pos="relative"
    >
      <AppShell.Header bg={'#592f55'}>
        <Header />
      </AppShell.Header>

      <Center>
        <AppShell.Main>
          <Container py={150}>
            <Title order={1} mb="lg">
              Terms of Service
            </Title>
            <Stack gap="md">
              <Title order={2}>Reservations</Title>
              <Text>
                Our reservation system allows you to easily reserve items online. Browse through our
                catalog and select the items you need. Please ensure that you provide accurate
                information during the reservation process.
              </Text>
              <Divider />

              <Title order={2}>Charges for Broken Items</Title>
              <Text>
                You will only be charged if items are broken. If an item is broken, you will be
                notified via email with the details of the charges. The charges will be based on the
                cost of repair or replacement of the item.
              </Text>

              <Divider />
              <Title order={2}>Account Locking Policy</Title>
              <Text>
                If you do not pay for the broken items or do not replace them within 3 days or by
                the end of the semester (whichever comes first), your account will be locked. You
                will receive email notifications regarding the status of your account and the
                actions required to unlock it.
              </Text>

              <Divider />
              <Title order={2}>Contact Us</Title>
              <Text>
                If you have any questions or concerns about our terms of service, please contact our
                support team. We are here to assist you and ensure a smooth reservation experience.
              </Text>
            </Stack>
          </Container>
        </AppShell.Main>
      </Center>

      <Footer />
    </AppShell>
  );
}
