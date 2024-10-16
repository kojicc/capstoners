import { Footer } from '@/components/LandingPage/footer/footer';
import { Header } from '@/components/LandingPage/header/HeaderLP';
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
        <BackgroundImage
          src="/RAFAEL.jpg"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: -1,
          }}
        />

        <Overlay color="#000" backgroundOpacity={0.85} zIndex={-1} />
        <AppShell.Header bg={'#592f55'}>
          <Header />
        </AppShell.Header>

        <AppShell.Main style={{ height: '100vh' }}>
          <Center style={{ height: '80vh' }}>
            <Container>
              <AuthenticationForm />
            </Container>
          </Center>
        </AppShell.Main>
      </AppShell>
    </>
  );
}
