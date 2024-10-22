import { Image, Container, Title, Button, Group, Text, List, ThemeIcon, rem } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import image from './image.svg';
import classes from './HeroBullets.module.css';
interface HeroBulletsProps {
  scrollTo: () => void;
}

export function HeroBullets({ scrollTo }: HeroBulletsProps) {
  return (
    <Container size="md">
      <div className={classes.inner}>
        <div className={classes.content}>
          {/* Update the title to be project-specific */}
          <Title className={classes.title}>
            The <span className={classes.highlight}>ultimate</span> solution for <br /> product
            reservations
          </Title>
          {/* Updated description text */}
          <Text c="dimmed" mt="md">
            Manage your product reservations effortlessly. Our platform offers real-time
            notifications, detailed analytics, and a seamless user experience – designed to boost
            your efficiency.
          </Text>

          {/* Update the list to feature project-specific points */}
          <List
            mt={30}
            spacing="sm"
            size="sm"
            icon={
              <ThemeIcon size={20} radius="xl" color="blue">
                {' '}
                {/* Updated color */}
                <IconCheck style={{ width: rem(12), height: rem(12) }} stroke={1.5} />
              </ThemeIcon>
            }
          >
            <List.Item>
              <b>Real-time notifications</b> – Stay updated on reservation statuses and inventory in
              real time.
            </List.Item>
            <List.Item>
              <b>Seamless reservation management</b> – Organize, track, and approve reservations
              with ease.
            </List.Item>
            <List.Item>
              <b>No hassle. Reserve. That's it.</b> – Our platform is designed to be intuitive and
              user-friendly.
            </List.Item>
          </List>
          <Group mt={50}>
            <Button
              radius="xl"
              size="md"
              color="blue"
              className={classes.control}
              onClick={scrollTo}
            >
              Start Reserving
            </Button>
          </Group>
        </div>
        <Image src={image.src} className={classes.image} />
      </div>
      {/* Update buttons to reflect your capstone project */}
    </Container>
  );
}
