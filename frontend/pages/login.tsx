import { Footer } from '@/components/LandingPage/footer/footer';
import Header from '@/components/LandingPage/header/HeaderLP';
import { AuthenticationForm } from '@/components/loginandregisterUSER/authForm';
import {
  Anchor,
  AppShell,
  BackgroundImage,
  Button,
  Center,
  Container,
  Divider,
  Grid,
  Overlay,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { url } from 'inspector';

export default function LoginPage() {
  const [opened, { toggle }] = useDisclosure();
  return (
    <>
      {/* <AuthenticationForm /> */}
      <AppShell
        header={{ height: 60 }}
        navbar={{ width: 300, breakpoint: 'sm', collapsed: { desktop: true, mobile: !opened } }}
        footer={{ height: 300 }}
        padding="md"
        withBorder={false}
      >
        <AppShell.Header bg={'#592f55'}>
          <Header />
        </AppShell.Header>

        <AppShell.Main
          style={{
            backgroundImage: 'url(/RAFAEL.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            zIndex: -1,
          }}
          p="xl"
        >
          <Overlay color="#000" backgroundOpacity={0.85} zIndex={-1} />
          <Center style={{ marginTop: '10vh' }}>
            <Container fluid>
              <AuthenticationForm />
            </Container>
          </Center>
        </AppShell.Main>
      </AppShell>
    </>
  );
}
